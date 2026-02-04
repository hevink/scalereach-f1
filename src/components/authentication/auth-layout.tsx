"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { LogoIcon } from "@/components/ui/logo";
import { useSession } from "@/lib/auth-client";

const PLATFORMS = [
  { name: "TikTok", logo: "/model/tiktok.svg" },
  { name: "YouTube Shorts", logo: "/model/youtube.svg" },
  { name: "Instagram Reels", logo: "/model/instagram.svg" },
  { name: "X / Twitter", logo: "/model/x.svg", logoDark: "/model/x-dark.svg" },
];

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [currentModelIndex, setCurrentModelIndex] = useState(0);

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/workspaces");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentModelIndex((prev) => (prev + 1) % PLATFORMS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <Spinner />
      </div>
    );
  }

  if (session?.user) return null;

  const currentPlatform = PLATFORMS[currentModelIndex];

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-16 relative overflow-hidden bg-zinc-100 dark:bg-transparent">
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-grass.webp')",
            backgroundSize: "100% 60%",
            backgroundPosition: "bottom center",
          }}
        />
        <div className="relative z-10 w-full max-w-xl transition-all duration-500">
          <div className="mb-12">
            <Link href="/" className="flex items-center gap-3">
              <LogoIcon size={40} />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">Scale Reach</span>
            </Link>
          </div>
          <div>
            <h1 className="text-5xl font-medium mb-1 leading-tight text-zinc-900 dark:text-white">
              Go viral on{" "}
              <span className="relative italic font-serif inline-flex items-center h-[1em] min-w-[280px]">
                {PLATFORMS.map((platform, index) => (
                  <span
                    key={platform.name}
                    className="absolute left-0 top-0 whitespace-nowrap inline-flex items-center gap-2 transition-all duration-500"
                    style={{
                      opacity: index === currentModelIndex ? 1 : 0,
                      transform: index === currentModelIndex ? "translateY(0)" : "translateY(10px)",
                    }}
                  >
                    {platform.logoDark ? (
                      <>
                        <Image alt={platform.name} width={40} height={40} className="flex-shrink-0 dark:hidden" src={platform.logo} />
                        <Image alt={platform.name} width={40} height={40} className="flex-shrink-0 hidden dark:block" src={platform.logoDark} />
                      </>
                    ) : (
                      <Image alt={platform.name} width={40} height={40} className="flex-shrink-0" src={platform.logo} />
                    )}
                    <span>{platform.name}</span>
                  </span>
                ))}
              </span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 mt-10">
              Turn your long-form videos into viral clips with AI. No editing skills required.
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 mt-8 border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full relative flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-400 dark:from-zinc-800 dark:via-neutral-900 dark:to-black flex items-center justify-center text-zinc-900 dark:text-white font-semibold ring-1 ring-black/10 dark:ring-white/10">
                    H
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Hevin K</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">How do I create viral clips from my podcast?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <Image alt="AI Assistant" width={24} height={24} className="flex-shrink-0" src={currentPlatform.logo} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Just paste your YouTube link and our AI will find the most engaging moments, add captions, and format them for any platform!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-4 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon size={38} />
            </Link>
          </div>
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{title}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
