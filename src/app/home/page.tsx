"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex gap-2">
        <Button onClick={() => router.push("/login")}>Sign in</Button>
        <Button onClick={() => router.push("/signup")} variant="outline">
          Sign up
        </Button>
      </div>
    </div>
  );
}
