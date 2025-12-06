/**
 * Database Connection Setup
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G3 - Logic API
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle ORM with schema
export const db = drizzle(pool, { schema });

// Export schema for use in API routes
export * from "./schema";
