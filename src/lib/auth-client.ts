import { passkeyClient } from "@better-auth/passkey/client";
import {
  lastLoginMethodClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    usernameClient(),
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/two-factor-verify";
      },
    }),
    lastLoginMethodClient(),
  ],
});

export const { signIn, signOut, signUp, useSession } = authClient;

// Extended user type with custom fields from backend
export interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  username?: string | null;
  displayUsername?: string | null;
  twoFactorEnabled?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  isOnboarded: boolean;
  preferences: Record<string, unknown>;
}
