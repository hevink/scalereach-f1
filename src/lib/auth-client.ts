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
