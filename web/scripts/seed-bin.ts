import "dotenv/config";
import { db } from "../lib/db/client";
import { bins } from "../lib/db/schema";
import { hashBinKey, generateBinKey } from "../lib/auth/bin-key";

async function main() {
  const code = process.env.SEED_BIN_CODE ?? "BIN-MNS-001";
  const locationName = process.env.SEED_BIN_LOCATION ?? "Estande Inov@tech — FAMETRO";
  const latitude = process.env.SEED_BIN_LAT ?? "-3.1019";
  const longitude = process.env.SEED_BIN_LON ?? "-60.0250";

  const key = generateBinKey();
  const keyHash = await hashBinKey(key);

  const [bin] = await db
    .insert(bins)
    .values({
      code,
      locationName,
      latitude,
      longitude,
      status: "active",
      apiKeyHash: keyHash,
    })
    .returning();

  if (!bin) {
    throw new Error("Falha ao inserir bin");
  }

  console.log("\n=== BIN CRIADA ===");
  console.log(`code:     ${bin.code}`);
  console.log(`id:       ${bin.id}`);
  console.log(`location: ${bin.locationName}`);
  console.log(`\n*** GUARDE ESSA API KEY — APARECE APENAS UMA VEZ ***`);
  console.log(`X-Bin-Key: ${key}`);
  console.log(`\nUse no firmware ESP32 ou em testes via curl.\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
