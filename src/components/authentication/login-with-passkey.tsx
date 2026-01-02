"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { IconFingerprint } from "@tabler/icons-react";

export function LoginWithPasskey() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePasskeySignIn = async () => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.passkey({
        autoFill: false,
      });

      if (result.error) {
        setIsLoading(false);
        return;
      }

    } catch {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full gap-2"
      disabled={isLoading}
      loading={isLoading}
      onClick={handlePasskeySignIn}
      type="button"
      variant="outline"
    >
      <IconFingerprint/>
      Continue with Passkey
    </Button>
  );
}

