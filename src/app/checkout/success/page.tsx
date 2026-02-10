"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { analytics } from "@/lib/analytics";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = searchParams.get("workspace");
  const planId = searchParams.get("plan") || "unknown";
  const planName = searchParams.get("planName") || planId;
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    // Track subscription started
    analytics.subscriptionStarted({
      planId,
      planName,
      price: 0, // Price not available from URL params
    });

    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
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
