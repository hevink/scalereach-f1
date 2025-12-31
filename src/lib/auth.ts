import { passkey } from "@better-auth/passkey";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { lastLoginMethod, twoFactor, username } from "better-auth/plugins";
import { db } from "@/db";
import {
  account,
  passkey as passkeyTable,
  rateLimit,
  session,
  twoFactor as twoFactorTable,
  user,
  verification,
} from "@/db/schema";

const USERNAME_STARTS_WITH_LETTER_REGEX = /^[a-z]/i;
const USERNAME_ALPHANUMERIC_UNDERSCORE_REGEX = /^[a-z0-9_]+$/;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  appName: "Staxk",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      rateLimit,
      twoFactor: twoFactorTable,
      passkey: passkeyTable,
    },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [
    lastLoginMethod(),
    passkey({
      rpName: "Staxk",
      rpID:
        process.env.NODE_ENV === "production"
          ? new URL(process.env.BETTER_AUTH_URL || "").hostname
          : "localhost",
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.BETTER_AUTH_URL || ""
          : "http://localhost:3000",
    }),
    twoFactor({
      issuer: "Staxk",
    }),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (usernameValue) => {
        if (
          !(
            USERNAME_STARTS_WITH_LETTER_REGEX.test(usernameValue) &&
            USERNAME_ALPHANUMERIC_UNDERSCORE_REGEX.test(usernameValue)
          ) ||
          usernameValue.endsWith("_") ||
          usernameValue.includes("__")
        ) {
          return false;
        }
        return true;
      },
    }),
  ],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
  ],
  rateLimit: {
    enabled: false,
  },
  advanced: {
    cookiePrefix: "staxk",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
