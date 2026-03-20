"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { analytics } from "@/lib/analytics";

// Dodo Payments appends query params to return_url after checkout:
// ?payment_id=xxx&status=succeeded (for payments)
// ?subscription_id=xxx&status=active (for subscriptions)
// If user cancels, status will be different (e.g., "cancelled", "failed", "requires_payment_method")

const SUCCESS_STATUSES = new Set([
  "succeeded",
  "active",
  "processing",
]);

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = searchParams.get("workspace");
  const planId = searchParams.get("plan") || "unknown";
  const planName = searchParams.get("planName") || planId;
  const dodoStatus = searchParams.get("status");
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // If Dodo returned a non-success status, redirect to cancel page
    if (dodoStatus && !SUCCESS_STATUSES.has(dodoStatus.toLowerCase())) {
      const cancelUrl = workspaceSlug
        ? `/checkout/cancel?workspace=${workspaceSlug}`
        : "/checkout/cancel";
      router.replace(cancelUrl);
      return;
    }

    // Payment is successful (or no status param = legacy/direct visit)
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    setShowConfetti(true);

    analytics.subscriptionStarted({
      planId,
      planName,
      price: 0,
    });

    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [dodoStatus, workspaceSlug, router, planId, planName]);

  // Don't render success UI if we're about to redirect to cancel
  if (dodoStatus && !SUCCESS_STATUSES.has(dodoStatus.toLowerCase())) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Redirecting...</div>
      </div>
    );
  }

  const handleContinue = () => {
    if (workspaceSlug) {
      router.push(`/${workspaceSlug}`);
    } else {
      router.push("/workspaces");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <div className="max-w-md w-full mx-auto p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="size-32">
            <DotLottieReact
              src="/Success Animation.lottie"
              loop={false}
              autoplay
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Payment Successful!
        </h1>

        <p className="text-zinc-400 mb-8">
          Thank you for your purchase. Your credits have been added to your account and you're ready to start creating amazing clips.
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full h-12 font-medium"
          >
            Continue to Dashboard
          </Button>

          {workspaceSlug && (
            <Button
              variant="outline"
              onClick={() => router.push(`/${workspaceSlug}/pricing`)}
              className="w-full h-12 border-zinc-700 text-white hover:bg-zinc-800"
            >
              View Billing Details
            </Button>
          )}
        </div>

        <p className="text-xs text-zinc-500 mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
