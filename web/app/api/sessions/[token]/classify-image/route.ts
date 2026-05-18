import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { db } from "@/lib/db/client";
import { sessions, bins, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyBinKey } from "@/lib/auth/bin-key";
import { canTransition } from "@/lib/domain/session-lifecycle";
import { pointsForMaterial, isValidMaterial } from "@/lib/domain/materials";
import { broadcastBinSession } from "@/lib/realtime/broadcast";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { params: Promise<{ token: string }> };

const MAX_IMAGE_BYTES = 2_000_000; // 2MB
const MIN_IMAGE_BYTES = 1_000; // 1KB

const VISION_MODEL = "claude-sonnet-4-6";
const MIN_CONFIDENCE = 0.5;

const PROMPT = `Voce e um classificador de materiais reciclaveis para uma lixeira inteligente em Manaus.

Olhe a imagem e classifique o material FISICO visivel como EXATAMENTE UM destes:
- plastic (plastico: garrafas PET, embalagens, sacos, copos)
- metal (latas de aluminio, ferro, tampinhas metalicas)
- glass (vidro: garrafas, potes)
- paper (papel, papelao, jornal, revista)

REGRA ANTI-FRAUDE (criticisima):
Se a imagem mostrar:
- Uma TELA de celular, tablet, monitor, TV (mesmo exibindo um material) — sinais: reflexos, pixels visiveis, bordas escuras do display, brilho artificial uniforme, moire pattern
- Uma FOTOGRAFIA IMPRESSA em papel mostrando um material — sinais: bordas marcadas, falta de profundidade 3D, textura de impressao, sombras planas
- Qualquer REPRESENTACAO DIGITAL ou IMPRESSA de um material (nao o material real)
NAO classifique. Retorne {"material": null, "confidence": 0.0, "fraudSuspected": true}.

Apenas materiais FISICOS reais, em 3D, com sombras naturais consistentes, sao validos.

Responda APENAS com JSON valido, sem markdown, sem explicacao:
{"material": "plastic", "confidence": 0.94}

Se for fraude: {"material": null, "confidence": 0.0, "fraudSuspected": true}
Se for vazio/irreconhecivel/outro material: {"material": null, "confidence": 0.0}

Apenas o JSON.`;

interface ClaudeClassification {
  material: string | null;
  confidence: number;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = "session-images";

async function uploadImageToStorage(
  token: string,
  buffer: Buffer,
): Promise<string | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  try {
    const supabase = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const path = `${token}.jpg`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[classify-image] storage upload failed:", error.message);
      return null;
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[classify-image] storage exception:", err);
    return null;
  }
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  // 1) Auth header
  const providedKey = request.headers.get("x-bin-key");
  if (!providedKey) {
    return NextResponse.json({ error: "missing_bin_key" }, { status: 401 });
  }

  // 2) Read JPEG body (binary)
  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length < MIN_IMAGE_BYTES || buffer.length > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      {
        error: "invalid_payload",
        reason: "image size out of range",
        size: buffer.length,
      },
      { status: 422 },
    );
  }

  // 3) Load session + bin
  const rows = await db
    .select({ session: sessions, bin: bins })
    .from(sessions)
    .innerJoin(bins, eq(sessions.binId, bins.id))
    .where(eq(sessions.token, token))
    .limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }
  const { session, bin } = rows[0]!;

  // 4) Verify bin key
  if (!(await verifyBinKey(providedKey, bin.apiKeyHash))) {
    return NextResponse.json({ error: "invalid_bin_key" }, { status: 401 });
  }

  // 5) State machine
  if (!canTransition(session.status, "material_detected")) {
    return NextResponse.json(
      {
        error: "invalid_transition",
        from: session.status,
        to: "material_detected",
      },
      { status: 409 },
    );
  }

  if (session.expiresAt < new Date()) {
    return NextResponse.json({ error: "session_expired" }, { status: 410 });
  }

  // 6) Call Claude vision
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "anthropic_key_missing" },
      { status: 500 },
    );
  }
  const client = new Anthropic({ apiKey });

  let classification: ClaudeClassification;
  try {
    const result = await client.messages.create({
      model: VISION_MODEL,
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: buffer.toString("base64"),
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const block = result.content[0];
    if (!block || block.type !== "text") {
      return NextResponse.json(
        { error: "classification_failed", reason: "no text block" },
        { status: 502 },
      );
    }

    classification = JSON.parse(block.text.trim());
  } catch (err) {
    return NextResponse.json(
      {
        error: "classification_failed",
        reason: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 },
    );
  }

  // 7) Upload da foto pro Storage (em paralelo com decisao da classificacao)
  const imageUrl = await uploadImageToStorage(token, buffer);

  // 8) Sanity check do output da IA
  if (
    classification.material === null ||
    typeof classification.confidence !== "number" ||
    classification.confidence < MIN_CONFIDENCE ||
    !isValidMaterial(classification.material)
  ) {
    // Mesmo nao classificando, salvamos a URL da imagem pra debug
    if (imageUrl) {
      await db
        .update(sessions)
        .set({ imageUrl })
        .where(eq(sessions.token, token));
    }
    return NextResponse.json({
      ok: false,
      reason: "unrecognized_or_low_confidence",
      material: classification.material,
      confidence: classification.confidence,
      imageUrl,
    });
  }

  const material = classification.material;
  const pointsValue = pointsForMaterial(material);

  // 9) Atualiza sessao (mesmo path do /classify)
  await db
    .update(sessions)
    .set({
      status: "material_detected",
      material,
      pointsValue,
      materialDetectedAt: new Date(),
      imageUrl,
    })
    .where(eq(sessions.token, token));

  // 10) Broadcast pro kiosk
  const [profile] = await db
    .select({ displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, session.userId))
    .limit(1);
  await broadcastBinSession(bin.id, {
    token,
    status: "material_detected",
    material,
    pointsValue,
    expiresAt: session.expiresAt.toISOString(),
    userDisplayName: profile?.displayName ?? "Visitante",
  });

  return NextResponse.json({
    ok: true,
    material,
    confidence: classification.confidence,
    pointsValue,
    destinationCompartment: material,
    imageUrl,
  });
}
