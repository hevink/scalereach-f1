"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { IconFingerprint } from "@tabler/icons-react";
import { toast } from "sonner";
import type { ComponentProps } from "react";

interface LoginWithPasskeyProps {
  variant?: ComponentProps<typeof Button>["variant"];
  showHelperText?: boolean;
}

export function LoginWithPasskey({ variant = "outline", showHelperText = false }: LoginWithPasskeyProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePasskeySignIn = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.passkey({
        autoFill: false,
      });

      if (result.error) {
        setIsLoading(false);
        if (
          result.error.message?.toLowerCase().includes("cancel") ||
          result.error.message?.toLowerCase().includes("notallowed") ||
          result.error.message?.toLowerCase().includes("abort")
        ) {
          toast.error("Passkey authentication was cancelled");
        } else if (
          result.error.message?.toLowerCase().includes("invalid") ||
          result.error.message?.toLowerCase().includes("wrong") ||
          result.error.message?.toLowerCase().includes("failed")
        ) {
          toast.error("Invalid passkey. Please try again.");
        } else {
          toast.error(result.error.message || "Passkey authentication failed");
        }
        return;
      }
    } catch (error) {
      setIsLoading(false);
      if (
        error instanceof DOMException &&
        (error.name === "NotAllowedError" ||
          error.name === "AbortError" ||
          error.message.toLowerCase().includes("cancel"))
      ) {
        toast.error("Passkey authentication was cancelled");
      } else if (error instanceof Error) {
        if (
          error.message.toLowerCase().includes("invalid") ||
          error.message.toLowerCase().includes("wrong") ||
          error.message.toLowerCase().includes("failed")
        ) {
          toast.error("Invalid passkey. Please try again.");
        } else {
          toast.error(error.message || "Something went wrong. Please try again.");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        className="w-full gap-2"
        disabled={isLoading}
        loading={isLoading}
        onClick={handlePasskeySignIn}
        type="button"
        variant={variant}
      >
        <IconFingerprint/>
        Sign in with Passkey
      </Button>
      {showHelperText && (
        <p className="text-center font-medium py-4 text-muted-foreground text-sm">
          You last used Passkey to sign in
        </p>
      )}
    </div>
  );
}

