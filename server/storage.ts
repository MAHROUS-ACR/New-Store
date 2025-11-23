import { type User, type InsertUser, users, type Discount, type InsertDiscount, discounts } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

let dbInstance: NeonHttpDatabase | null = null;
let sqlClient: any = null;

async function getDb(): Promise<NeonHttpDatabase> {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { neon } = await import("@neondatabase/serverless");
    sqlClient = neon(process.env.DATABASE_URL);
    dbInstance = drizzle(sqlClient);
  }
  return dbInstance;
}

async function getSqlClient() {
  if (!sqlClient) {
    await getDb();
  }
  return sqlClient;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createDiscount(discount: InsertDiscount): Promise<Discount>;
  getDiscountByProductId(productId: string): Promise<Discount | undefined>;
  getAllDiscounts(): Promise<Discount[]>;
  updateDiscount(id: string, discount: Partial<InsertDiscount>): Promise<Discount | undefined>;
  deleteDiscount(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const db = await getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const db = await getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    try {
      const db = await getDb();
      const result = await db
        .select()
        .from(users)
        .where(eq(users.firebaseUid, firebaseUid))
        .limit(1);
      return result && result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("Error in getUserByFirebaseUid:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await getDb();
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createDiscount(discount: InsertDiscount): Promise<Discount> {
    try {
      const db = await getDb();
      const startDate = discount.startDate instanceof Date ? discount.startDate : new Date(discount.startDate);
      const endDate = discount.endDate instanceof Date ? discount.endDate : new Date(discount.endDate);
      
      const result = await db.insert(discounts).values({
        productId: discount.productId,
        discountPercentage: discount.discountPercentage,
        startDate,
        endDate,
      }).returning();
      
      if (!result || !result[0]) {
        throw new Error("Failed to create discount");
      }
      
      const row = result[0];
      return {
        id: row.id,
        productId: row.productId,
        discountPercentage: String(row.discountPercentage),
        startDate: row.startDate instanceof Date ? row.startDate : new Date(row.startDate),
        endDate: row.endDate instanceof Date ? row.endDate : new Date(row.endDate),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      };
    } catch (error) {
      console.error("Error creating discount:", error);
      throw error;
    }
  }

  async getDiscountByProductId(productId: string): Promise<Discount | undefined> {
    try {
      const db = await getDb();
      const now = new Date();
      const result = await db
        .select()
        .from(discounts)
        .where(
          and(
            eq(discounts.productId, productId),
            lte(discounts.startDate, now),
            gte(discounts.endDate, now)
          )
        )
        .limit(1);
      
      if (!result || result.length === 0) return undefined;
      
      const row = result[0];
      return {
        id: row.id,
        productId: row.productId,
        discountPercentage: String(row.discountPercentage),
        startDate: row.startDate instanceof Date ? row.startDate : new Date(row.startDate),
        endDate: row.endDate instanceof Date ? row.endDate : new Date(row.endDate),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      };
    } catch (error) {
      console.error("Error getting discount:", error);
      return undefined;
    }
  }

  async getAllDiscounts(): Promise<Discount[]> {
    try {
      const db = await getDb();
      const results = await db.select().from(discounts);
      return (results || []).map((d: any) => ({
        id: d.id,
        productId: d.productId,
        discountPercentage: String(d.discountPercentage),
        startDate: d.startDate instanceof Date ? d.startDate : new Date(d.startDate),
        endDate: d.endDate instanceof Date ? d.endDate : new Date(d.endDate),
        createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt),
      }));
    } catch (error) {
      console.error("Error getting all discounts:", error);
      return [];
    }
  }

  async updateDiscount(id: string, discount: Partial<InsertDiscount>): Promise<Discount | undefined> {
    try {
      const db = await getDb();
      const updateData: any = {};
      
      if (discount.discountPercentage !== undefined) {
        updateData.discountPercentage = discount.discountPercentage;
      }
      if (discount.startDate !== undefined) {
        updateData.startDate = discount.startDate instanceof Date ? discount.startDate : new Date(discount.startDate);
      }
      if (discount.endDate !== undefined) {
        updateData.endDate = discount.endDate instanceof Date ? discount.endDate : new Date(discount.endDate);
      }
      
      if (Object.keys(updateData).length === 0) return undefined;
      
      const result = await db
        .update(discounts)
        .set(updateData)
        .where(eq(discounts.id, id))
        .returning();
      
      if (!result || !result[0]) return undefined;
      
      const row = result[0];
      return {
        id: row.id,
        productId: row.productId,
        discountPercentage: String(row.discountPercentage),
        startDate: row.startDate instanceof Date ? row.startDate : new Date(row.startDate),
        endDate: row.endDate instanceof Date ? row.endDate : new Date(row.endDate),
        createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      };
    } catch (error) {
      console.error("Error updating discount:", error);
      return undefined;
    }
  }

  async deleteDiscount(id: string): Promise<void> {
    try {
      const db = await getDb();
      await db.delete(discounts).where(eq(discounts.id, id));
    } catch (error) {
      console.error("Error deleting discount:", error);
      throw error;
    }
  }
}

export const storage = new DbStorage();
