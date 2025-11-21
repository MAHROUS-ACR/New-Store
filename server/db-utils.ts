import { sql } from "drizzle-orm";

let dbInstance: any = null;

export async function getDb() {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { neon } = await import("@neondatabase/serverless");
    const neonSql = neon(process.env.DATABASE_URL);
    dbInstance = drizzle(neonSql);
  }
  return dbInstance;
}

export async function queryUser(firebaseUid: string) {
  try {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    const { neon } = await import("@neondatabase/serverless");
    const neonSql = neon(process.env.DATABASE_URL);
    const result = await neonSql`SELECT * FROM users WHERE firebase_uid = ${firebaseUid} LIMIT 1`;
    if (result && result.length > 0) {
      const row = result[0];
      return {
        id: row.id,
        firebaseUid: row.firebase_uid,
        email: row.email,
        username: row.username,
        createdAt: row.created_at,
      };
    }
    return null;
  } catch (error) {
    console.error("Error querying user:", error);
    return null;
  }
}
