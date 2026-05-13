/**
 * Dispara eventos Realtime via REST API do Supabase para o kiosk consumir.
 *
 * Usa Broadcast (canal pub/sub manual) em vez de Postgres Changes — assim
 * os dados que chegam no kiosk anonimo sao **sanitizados pelo backend**, e
 * nao precisamos de policies SELECT permissivas em tabelas que contém
 * informações privadas (pontos, nível, email, etc).
 */
import type { Material } from "@/lib/domain/materials";
import type { SessionStatus } from "@/lib/domain/session-lifecycle";

export interface KioskSessionPayload {
  token: string;
  status: SessionStatus;
  material: Material | null;
  pointsValue: number | null;
  expiresAt: string;
  userDisplayName: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Envia evento broadcast no canal de um bin especifico.
 * Falhas no broadcast NUNCA devem quebrar a mutation principal — log e
 * deixa passar.
 */
export async function broadcastBinSession(
  binId: string,
  payload: KioskSessionPayload,
): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    // eslint-disable-next-line no-console
    console.warn("[broadcast] env vars missing — skipping");
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `bin:${binId}`,
            event: "session_change",
            payload,
            private: false,
          },
        ],
      }),
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `[broadcast] status ${response.status}: ${await response.text().catch(() => "")}`,
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[broadcast] failed:", err);
  }
}
