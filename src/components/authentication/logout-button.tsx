"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { authClient } from "@/lib/auth-client";
import { analytics } from "@/lib/analytics";
import { Loader2 } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      analytics.logout();
      await authClient.signOut({
        fetchOptions: {
          onError: (ctx) => {
            console.error("[LOGOUT] Error:", ctx.error);
          },
        },
      });
    } catch (error) {
      console.error("[LOGOUT] Exception:", error);
      toast.error("Error during logout");
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <Button
      className={cn("h-10 px-3.5", className)}
      variant="destructive"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log out"}
    </Button>
  );
}
