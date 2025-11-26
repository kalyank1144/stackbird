import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { subscriptions, credits, usageLogs, type InsertSubscription, type InsertCredits, type InsertUsageLog } from "../drizzle/schema";

/**
 * Plan configurations
 */
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    credits: 50, // 50 tokens per day
    resetPeriod: "daily" as const,
    maxProjects: 1,
    features: [
      "50 tokens per day",
      "Budget models (DeepSeek, GPT-4o-mini)",
      "1 active project",
      "Basic templates",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    price: 19,
    priceYearly: 190,
    credits: 5000, // 5,000 tokens per month
    resetPeriod: "monthly" as const,
    maxProjects: 10,
    features: [
      "5,000 tokens per month",
      "All AI models (including Claude Opus 4.5)",
      "10 active projects",
      "All templates",
      "Unlimited code execution",
      "GitHub integration",
      "Email support",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

/**
 * Initialize credits for a new user
 */
export async function initializeUserCredits(userId: number, plan: PlanType = "free"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const planConfig = PLANS[plan];
  const resetDate = plan === "free" 
    ? new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const creditData: InsertCredits = {
    userId,
    remaining: planConfig.credits,
    total: planConfig.credits,
    resetDate,
    plan,
  };

  await db.insert(credits).values(creditData);
}

/**
 * Get user's current credits
 */
export async function getUserCredits(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(credits)
    .where(eq(credits.userId, userId))
    .limit(1);

  if (result.length === 0) {
    // Initialize credits if not exists
    await initializeUserCredits(userId);
    return await getUserCredits(userId);
  }

  const userCredits = result[0]!;

  // Check if credits need to be reset
  if (new Date() > userCredits.resetDate) {
    await resetUserCredits(userId);
    return await getUserCredits(userId);
  }

  return userCredits;
}

/**
 * Reset user's credits based on their plan
 */
export async function resetUserCredits(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userCredits = await db
    .select()
    .from(credits)
    .where(eq(credits.userId, userId))
    .limit(1);

  if (userCredits.length === 0) return;

  const currentPlan = userCredits[0]!.plan;
  const planConfig = PLANS[currentPlan];
  
  const newResetDate = currentPlan === "free"
    ? new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db
    .update(credits)
    .set({
      remaining: planConfig.credits,
      total: planConfig.credits,
      resetDate: newResetDate,
      updatedAt: new Date(),
    })
    .where(eq(credits.userId, userId));
}

/**
 * Deduct credits from user
 */
export async function deductCredits(
  userId: number,
  amount: number,
  action: "ai_message" | "code_execution" | "file_operation",
  metadata?: Record<string, any>
): Promise<{ success: boolean; remaining: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userCredits = await getUserCredits(userId);

  if (userCredits.remaining < amount) {
    return { success: false, remaining: userCredits.remaining };
  }

  // Deduct credits
  await db
    .update(credits)
    .set({
      remaining: userCredits.remaining - amount,
      updatedAt: new Date(),
    })
    .where(eq(credits.userId, userId));

  // Log usage
  const logData: InsertUsageLog = {
    userId,
    action,
    creditsUsed: amount,
    metadata: metadata ? JSON.stringify(metadata) : null,
  };

  await db.insert(usageLogs).values(logData);

  return { success: true, remaining: userCredits.remaining - amount };
}

/**
 * Check if user has enough credits
 */
export async function hasEnoughCredits(userId: number, required: number = 1): Promise<boolean> {
  const userCredits = await getUserCredits(userId);
  return userCredits.remaining >= required;
}

/**
 * Get user's subscription
 */
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Create or update subscription
 */
export async function upsertSubscription(data: InsertSubscription): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserSubscription(data.userId);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, data.userId));
  } else {
    await db.insert(subscriptions).values(data);
  }

  // Update credits plan
  const plan = data.plan as PlanType;
  const planConfig = PLANS[plan];
  const resetDate = data.plan === "free"
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db
    .update(credits)
    .set({
      plan: data.plan,
      remaining: planConfig.credits,
      total: planConfig.credits,
      resetDate,
      updatedAt: new Date(),
    })
    .where(eq(credits.userId, data.userId));
}

/**
 * Get usage stats for user
 */
export async function getUserUsageStats(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await db
    .select()
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        // Note: MySQL doesn't have a direct >= operator for timestamps in drizzle
        // We'll fetch all and filter in memory for simplicity
      )
    )
    .orderBy(desc(usageLogs.createdAt));

  const filtered = logs.filter(log => log.createdAt >= since);

  const stats = {
    totalCreditsUsed: filtered.reduce((sum, log) => sum + log.creditsUsed, 0),
    aiMessages: filtered.filter(log => log.action === "ai_message").length,
    codeExecutions: filtered.filter(log => log.action === "code_execution").length,
    fileOperations: filtered.filter(log => log.action === "file_operation").length,
  };

  return stats;
}

/**
 * Check if user can create more projects
 */
export async function canCreateProject(userId: number, currentProjectCount: number): Promise<boolean> {
  const userCredits = await getUserCredits(userId);
  const plan = userCredits.plan as PlanType;
  const planConfig = PLANS[plan];
  return currentProjectCount < planConfig.maxProjects;
}
