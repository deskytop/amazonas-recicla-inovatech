/**
 * Script de fallback: gera API key + hash bcrypt e imprime SQL INSERT pronto
 * para colar no Supabase SQL Editor (Dashboard).
 *
 * Usar quando o pooler estiver indisponível (manutencao, firewall, etc) e nao
 * der pra usar o seed-bin.ts que conecta direto ao banco.
 *
 * Uso:
 *   npm run seed:bin:print
 *   # ou customizando:
 *   SEED_BIN_CODE=BIN-XYZ npm run seed:bin:print
 */
import { hashBinKey, generateBinKey } from "../lib/auth/bin-key";

async function main() {
  const code = process.env.SEED_BIN_CODE ?? "BIN-MNS-001";
  const locationName = process.env.SEED_BIN_LOCATION ?? "Estande Inov@tech — FAMETRO";
  const latitude = process.env.SEED_BIN_LAT ?? "-3.1019";
  const longitude = process.env.SEED_BIN_LON ?? "-60.0250";

  const key = generateBinKey();
  const keyHash = await hashBinKey(key);

  // Escapa aspas simples no hash (bcrypt usa $ e / mas nao ')
  const safeHash = keyHash.replace(/'/g, "''");
  const safeLocation = locationName.replace(/'/g, "''");

  const sql = `insert into public.bins (code, location_name, latitude, longitude, status, api_key_hash)
values (
  '${code}',
  '${safeLocation}',
  ${latitude},
  ${longitude},
  'active',
  '${safeHash}'
)
returning id, code;`;

  console.log("\n=== SQL PARA COLAR NO SUPABASE SQL EDITOR ===\n");
  console.log(sql);
  console.log("\n=============================================");
  console.log("\n*** GUARDE ESSA API KEY — APARECE APENAS UMA VEZ ***\n");
  console.log(`X-Bin-Key: ${key}\n`);
  console.log("Apos rodar o SQL no Dashboard, copie o `id` retornado.\n");
  console.log("A API key acima e o segredo que sera usado pelo firmware ESP32");
  console.log("e por testes curl. No banco fica apenas o hash bcrypt.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
