import "dotenv/config";
import { db } from "../lib/db/client";
import { rewards } from "../lib/db/schema";
import { INITIAL_REWARDS } from "../lib/domain/rewards";

async function main() {
  const inserted = await db
    .insert(rewards)
    .values([...INITIAL_REWARDS])
    .returning();
  console.log(`Inseridas ${inserted.length} recompensas:`);
  for (const r of inserted) {
    console.log(`  - ${r.title} (${r.costPoints} pts)`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
