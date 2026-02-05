"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { analytics } from "@/lib/analytics";

export default function LogoutPage() {
  const router = useRouter();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    hasLoggedOut.current = true;

    const logout = async () => {
      try {
        analytics.logout();
        const result = await authClient.signOut({
          fetchOptions: {
            onError: (ctx) => {
              console.error("[LOGOUT] Error:", ctx.error);
            },
          },
        });
        console.log("[LOGOUT] Result:", result);
      } catch (error) {
        console.error("[LOGOUT] Exception:", error);
        toast.error("Error during logout");
      } finally {
        // Always redirect to login, even if signOut fails
        router.push("/login");
        router.refresh();
      }
    };

    logout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
      </div>
    </div>
  );
}
