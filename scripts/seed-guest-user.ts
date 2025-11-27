/**
 * Seed script to ensure guest user exists in database
 * Run this during deployment to initialize the guest user
 */
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const GUEST_USER = {
  openId: "guest-user",
  name: "Guest User",
  email: "guest@stackbird.local",
  loginMethod: "none",
  role: "admin" as const,
};

async function seedGuestUser() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("[Seed] DATABASE_URL not set, skipping guest user seed");
    process.exit(0); // Don't fail the build
  }

  try {
    const db = drizzle(databaseUrl);
    
    // Check if guest user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.openId, GUEST_USER.openId))
      .limit(1);
    
    if (existing.length > 0) {
      console.log("[Seed] Guest user already exists, skipping");
      process.exit(0);
    }
    
    // Insert guest user
    await db.insert(users).values({
      openId: GUEST_USER.openId,
      name: GUEST_USER.name,
      email: GUEST_USER.email,
      loginMethod: GUEST_USER.loginMethod,
      role: GUEST_USER.role,
      lastSignedIn: new Date(),
    });
    
    console.log("[Seed] Guest user created successfully");
    process.exit(0);
  } catch (error) {
    console.error("[Seed] Failed to seed guest user:", error);
    process.exit(0); // Don't fail the build
  }
}

seedGuestUser();
