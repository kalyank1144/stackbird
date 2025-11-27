import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { upsertUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User; // Always present (guest user if not authenticated)
};

// Default guest user for no-auth mode
const GUEST_USER: User = {
  id: 1,
  openId: "guest-user",
  name: "Guest User",
  email: "guest@stackbird.local",
  loginMethod: "none",
  role: "admin", // Give admin access for testing
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// Track if guest user has been initialized
let guestUserInitialized = false;

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Ensure guest user exists in database (only once on first request)
  if (!guestUserInitialized) {
    try {
      await upsertUser({
        openId: GUEST_USER.openId,
        name: GUEST_USER.name,
        email: GUEST_USER.email,
        loginMethod: GUEST_USER.loginMethod,
        role: GUEST_USER.role,
        lastSignedIn: GUEST_USER.lastSignedIn,
      });
      guestUserInitialized = true;
      console.log("[Auth] Guest user initialized in database");
    } catch (error) {
      console.error("[Auth] Failed to initialize guest user:", error);
    }
  }

  // For now, always use guest user (no auth required)
  const user: User = GUEST_USER;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
