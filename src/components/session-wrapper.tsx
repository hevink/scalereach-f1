"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { SessionProvider } from "./session-provider";
import { authClient } from "@/lib/auth-client";

export function SessionWrapper({ children }: { children: ReactNode }) {
  const [initialSession, setInitialSession] = useState<
    { session: any; user: any } | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authClient
      .getSession()
      .then((result) => {
        setInitialSession(result.data ?? null);
      })
      .catch(() => {
        setInitialSession(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <SessionProvider initialSession={initialSession}>{children}</SessionProvider>
  );
}
