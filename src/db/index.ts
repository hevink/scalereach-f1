import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// biome-ignore lint/performance/noNamespaceImport: Needed for drizzle schema typing
import * as schema from "./schema";

declare global {
  var dbPool: Pool | undefined;
}

const pool =
  globalThis.dbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idleTimeoutMillis: process.env.NODE_ENV === "production" ? 10_000 : 30_000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30_000,
    query_timeout: 30_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.dbPool = pool;
}

export const db = drizzle(pool, { schema });
