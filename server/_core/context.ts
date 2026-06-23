import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // In development, provide a default dev user only if explicitly enabled via DEV_AUTO_LOGIN.
  if (!user && process.env.NODE_ENV !== "production" && process.env.DEV_AUTO_LOGIN === "true") {
    user = {
      id: 1,
      openId: "dev-local",
      name: "Dev User",
      email: "dev@local",
      loginMethod: "local",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as unknown as User;
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
