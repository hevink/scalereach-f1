"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconXboxX, IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

function CheckoutCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = searchParams.get("workspace");

  const handleRetry = () => {
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}/settings/billing`);
    } else {
      router.push("/pricing");
    }
  };

  const handleGoBack = () => {
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}`);
    } else {
      router.push("/workspaces");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <IconXboxX className="size-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Payment Cancelled
        </h1>

        <p className="text-zinc-400 mb-8">
          Your payment was cancelled and you have not been charged. If you experienced any issues during checkout, please try again or contact our support team.
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 font-medium"
          >
            <IconRefresh className="size-4 mr-2" />
            Try Again
          </Button>

          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full h-12 border-zinc-700 text-white hover:bg-zinc-800"
          >
            <IconArrowLeft className="size-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <p className="text-xs text-zinc-500 mt-6">
          Need help?{" "}
          <a href="mailto:support@scalereach.com" className="text-emerald-500 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CheckoutCancelContent />
    </Suspense>
  );
}
