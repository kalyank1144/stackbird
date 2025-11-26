import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

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

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // For now, always use guest user (no auth required)
  const user: User = GUEST_USER;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
