import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { authSchema } from "./db/auth-schema";

export type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_SECRET_ID?: string;
};

export function createAuth(env: Env, request: Request) {
  const origin = env.BETTER_AUTH_URL || new URL(request.url).origin;
  const requestOrigin = request.headers.get("origin");
  const db = drizzle(env.DB);

  return betterAuth({
    appName: "Smotu",
    basePath: "/api/auth",
    baseURL: origin,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: authSchema,
      camelCase: true,
      transaction: false,
    }),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || env.GOOGLE_SECRET_ID || "",
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    trustedOrigins: (incomingRequest) => [
      origin,
      requestOrigin,
      incomingRequest?.headers.get("origin"),
    ],
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google", "email-password"],
      },
    },
    advanced: {
      skipTrailingSlashes: true,
      trustedProxyHeaders: true,
    },
  });
}
