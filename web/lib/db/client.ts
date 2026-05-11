import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// `prepare: false` is required for PgBouncer transaction-mode pooler.
// `max: 1` prevents creating multiple connections in serverless environments (Vercel Functions).
const client = postgres(connectionString, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });
