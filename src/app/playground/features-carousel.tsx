"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Captions, TrendingUp, Share2, Maximize, Palette, Plus, Type, type LucideIcon } from "lucide-react";

interface Feature {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    visual: ReactNode;
}

function getFeatures(): Feature[] {
    return [
        {
            id: "ai-detection",
            title: "AI-Powered Clip Detection",
            description: "Automatically identifies the most engaging moments in your videos using advanced AI analysis.",
            icon: Sparkles,
            visual: <AIDetectionVisual />,
        },
        {
            id: "multi-platform",
            title: "Multi-Platform Export",
            description: "One-click export optimized for TikTok, Instagram Reels, YouTube Shorts, and more.",
            icon: Share2,
            visual: <MultiPlatformVisual />,
        },
        {
            id: "viral-score",
            title: "Viral Score Prediction",
            description: "AI-powered scoring system that predicts clip performance based on engagement patterns.",
            icon: TrendingUp,
            visual: <ViralScoreVisual />,
        },
        {
            id: "captions",
            title: "Auto-Generated Captions",
            description: "Accurate transcription with word-level timing, customizable styles, and animated text effects.",
            icon: Captions,
            visual: <CaptionsVisual />,
        },
        {
            id: "auto-reframe",
            title: "Auto-Reframing",
            description: "Smart cropping that follows the action. Support for 9:16, 1:1, and 16:9 aspect ratios.",
            icon: Maximize,
            visual: <AutoReframeVisual />,
        },
        {
            id: "brand-kit",
            title: "Brand Kit Customization",
            description: "Save your colors, fonts, and logos. Apply consistent branding across all your clips.",
            icon: Palette,
            visual: <BrandKitVisual />,
        },
    ];
}

export function FeaturesCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const features = getFeatures();

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % Math.ceil(features.length / 3));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + Math.ceil(features.length / 3)) % Math.ceil(features.length / 3));
    };

    const visibleFeatures = features.slice(currentIndex * 3, currentIndex * 3 + 3);

    return (
        <section className="bg-background @container py-24 max-lg:px-1">
            <div className="relative mx-auto" role="region" aria-roledescription="carousel">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-wrap items-end justify-between gap-4 border-x border-dashed px-6 pb-6 pt-24 lg:px-8 lg:pb-12">
                        <h2 className="text-foreground max-w-xl text-balance text-4xl font-semibold lg:text-5xl">
                            Everything you need to create viral clips
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={prevSlide}
                                className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 duration-200 hover:bg-muted/50 dark:ring-foreground/15 dark:hover:bg-muted/50 size-8 rounded-full"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Previous slide</span>
                            </button>
                            <button
                                onClick={nextSlide}
                                className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 duration-200 hover:bg-muted/50 dark:ring-foreground/15 dark:hover:bg-muted/50 size-8 rounded-full"
                            >
                                <ArrowRight className="h-4 w-4" />
                                <span className="sr-only">Next slide</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:grid lg:grid-cols-[1fr_auto_1fr]">
                    <div aria-hidden="true" className="border-y border-dashed max-lg:hidden" />
                    <div className="mx-auto border lg:max-w-6xl">
                        <div className="overflow-hidden px-4">
                            <div className="flex -ml-4 *:bg-card *:not-dark:bg-card/50 *:p-8 *:pt-12 md:divide-x md:*:basis-1/2 lg:*:basis-1/3">
                                {visibleFeatures.map((feature) => (
                                    <FeatureCard key={feature.id} feature={feature} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div aria-hidden="true" className="border-y border-dashed max-lg:hidden" />
                </div>

                <div className="mx-auto w-full max-w-6xl border-x border-dashed pb-24" />
            </div>
        </section>
    );
}

function FeatureCard({ feature }: { feature: Feature }) {
    const Icon = feature.icon;
    return (
        <div
            role="group"
            aria-roledescription="slide"
            className="min-w-0 shrink-0 grow-0 basis-full pl-4 grid-rows-subgrid row-span-2 grid gap-12"
        >
            <div className="m-auto scale-90 self-center">
                {feature.visual}
            </div>
            <p className="text-foreground/65 self-end text-balance font-medium lg:max-w-xs">
                <strong className="text-foreground font-medium">{feature.title}</strong>
                {" "}{feature.description}
            </p>
        </div>
    );
}


// Visual Components for each feature
function AIDetectionVisual() {
    return (
        <div aria-hidden="true" className="min-w-sm relative">
            <div className="perspective-dramatic flex flex-col gap-4">
                <div className="mask-radial-[100%_100%] mask-radial-from-75% mask-radial-at-top-left rotate-x-5 rotate-z-6 -rotate-4 pl-6 pt-1">
                    <div className="ring-border bg-background/75 shadow-black/6.5 rounded-tl-2xl px-2 pt-4 shadow-lg ring-1">
                        <div className="text-muted-foreground mb-3 flex items-center gap-2.5 px-3 font-medium">
                            <Sparkles className="size-4 text-primary" />
                            AI Detection
                        </div>
                        <div className="bg-muted/50 ring-border flex flex-col gap-3 rounded-tl-xl px-5 pt-5 pb-4 shadow ring-1">
                            <div className="flex items-center gap-3">
                                <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm">Analyzing video content...</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Found 12 potential clips</span>
                                    <span className="text-primary font-medium">87% complete</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full w-[87%] bg-gradient-to-r from-primary to-emerald-500 rounded-full" />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">Hook detected</div>
                                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-xs rounded-md">High engagement</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CaptionsVisual() {
    return (
        <div aria-hidden="true" className="min-w-xs mx-auto w-full">
            <div className="relative">
                <div className="mask-b-from-65% before:bg-background before:border-border after:border-border after:bg-background/50 before:z-1 group relative -mx-4 px-4 pt-6 before:absolute before:inset-x-6 before:bottom-0 before:top-4 before:rounded-2xl before:border after:absolute after:inset-x-9 after:bottom-0 after:top-2 after:rounded-2xl after:border">
                    <div className="bg-card ring-border relative z-10 overflow-hidden rounded-2xl p-6 text-sm shadow-xl shadow-black/10 ring-1">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="space-y-0.5">
                                <Captions className="size-5 text-primary" />
                                <div className="mt-3 font-mono text-xs text-muted-foreground">TRANSCRIPT</div>
                                <div className="mt-1 text-lg font-semibold">Auto Captions</div>
                                <div className="text-xs font-medium text-emerald-500">98% Accuracy</div>
                            </div>
                            <div className="bg-muted ring-border w-16 space-y-2 rounded-md p-2 shadow-md ring-1">
                                <div className="flex items-center gap-1">
                                    <div className="bg-foreground/15 size-2.5 rounded-full" />
                                    <div className="bg-foreground/15 h-[3px] w-4 rounded-full" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1">
                                        <div className="bg-primary/50 h-[3px] w-2.5 rounded-full" />
                                        <div className="bg-primary/30 h-[3px] w-6 rounded-full" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="bg-foreground/15 h-[3px] w-2.5 rounded-full" />
                                        <div className="bg-foreground/15 h-[3px] w-6 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="bg-yellow-400/50 h-[3px] w-full rounded-full" />
                                    <div className="flex items-center gap-1">
                                        <div className="bg-foreground/15 h-[3px] w-2/3 rounded-full" />
                                        <div className="bg-foreground/15 h-[3px] w-1/3 rounded-full" />
                                    </div>
                                </div>
                                <Type className="ml-auto size-3 text-muted-foreground" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="grid grid-cols-[auto_1fr] items-center">
                                <span className="text-muted-foreground w-16 block text-xs">00:00</span>
                                <span className="bg-primary/20 h-2 w-3/4 rounded-full px-2" />
                            </div>
                            <div className="grid grid-cols-[auto_1fr] items-center">
                                <span className="text-muted-foreground w-16 block text-xs">00:03</span>
                                <span className="bg-yellow-400/30 h-2 w-1/2 rounded-full px-2" />
                            </div>
                            <div className="grid grid-cols-[auto_1fr] items-center">
                                <span className="text-muted-foreground w-16 block text-xs">00:05</span>
                                <span className="bg-border h-2 w-2/3 rounded-full px-2" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ViralScoreVisual() {
    return (
        <div aria-hidden="true" className="min-w-xs max-w-xs mx-auto">
            <div className="mask-b-from-65% before:bg-background before:border-border after:border-border after:bg-background/50 before:z-1 group relative px-2 pt-4 before:absolute before:inset-x-4 before:bottom-0 before:top-2 before:rounded-xl before:border after:absolute after:inset-x-6 after:bottom-0 after:top-1 after:rounded-xl after:border">
                <div className="bg-card ring-border relative z-10 rounded-xl p-4 shadow-xl shadow-black/10 ring-1">
                    <div className="text-foreground font-medium flex items-center gap-2">
                        <TrendingUp className="size-4 text-emerald-500" />
                        <span><span className="bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 text-emerald-700 dark:text-emerald-300 rounded">Viral</span> Score</span>
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs">AI-predicted performance breakdown</div>

                    <div className="relative mb-3 mt-3 flex">
                        <div className="h-4 w-[40%] rounded-l-md bg-emerald-500" />
                        <div className="h-4 w-[35%] bg-blue-500 duration-300 group-hover:w-[40%]" />
                        <div className="h-4 w-[25%] rounded-r-md bg-purple-500 duration-300 group-hover:w-[20%]" />
                    </div>

                    <div className="flex gap-1 border-b border-dashed pb-2">
                        <div className="w-1/2">
                            <div className="text-foreground text-lg font-medium">85</div>
                            <div className="text-muted-foreground text-xs">Overall Score</div>
                        </div>
                        <div className="w-1/2">
                            <div className="text-emerald-500 text-lg font-medium">High</div>
                            <div className="text-muted-foreground text-xs">Viral Potential</div>
                        </div>
                    </div>

                    <div className="mt-2 space-y-1">
                        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                            <div className="size-1.5 rounded-full bg-emerald-500" />
                            <div className="line-clamp-1 text-xs font-medium">Hook Strength <span className="text-muted-foreground">(40%)</span></div>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                            <div className="size-1.5 rounded-full bg-blue-500" />
                            <div className="line-clamp-1 text-xs font-medium">Pacing <span className="text-muted-foreground">(35%)</span></div>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                            <div className="size-1.5 rounded-full bg-purple-500" />
                            <div className="line-clamp-1 text-xs font-medium">Engagement <span className="text-muted-foreground">(25%)</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MultiPlatformVisual() {
    return (
        <div aria-hidden="true" className="mx-auto max-w-sm">
            <div className="bg-foreground/5 group rounded-2xl">
                <div className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium">
                    <Share2 className="size-3.5 opacity-50" />
                    Platforms
                </div>
                <div className="relative">
                    <div className="absolute inset-0 scale-100 opacity-100 blur-lg transition-all duration-300">
                        <div className="bg-linear-to-r/increasing animate-hue-rotate absolute inset-x-6 bottom-0 top-12 -translate-y-3 from-pink-400 to-purple-400" />
                    </div>
                    <div className="bg-card ring-foreground/10 relative overflow-hidden rounded-2xl border border-transparent px-6 py-3 shadow-md shadow-black/5 ring-1">
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-dashed py-3 last:border-b-0">
                            <div className="bg-muted border-foreground/5 flex size-12 items-center justify-center rounded-lg border">
                                <TikTokIcon />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-medium">TikTok</h3>
                                <p className="text-muted-foreground line-clamp-1 text-sm">9:16 vertical, optimized for FYP</p>
                            </div>
                            <div className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 duration-200 hover:bg-muted/50 dark:ring-foreground/15 dark:hover:bg-muted/50 size-9">
                                <Plus className="size-4" />
                            </div>
                        </div>
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-dashed py-3 last:border-b-0">
                            <div className="bg-muted border-foreground/5 flex size-12 items-center justify-center rounded-lg border">
                                <InstagramReelsIcon />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-medium">Instagram Reels</h3>
                                <p className="text-muted-foreground line-clamp-1 text-sm">9:16 vertical, 90 sec max</p>
                            </div>
                            <div className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 duration-200 hover:bg-muted/50 dark:ring-foreground/15 dark:hover:bg-muted/50 size-9">
                                <Plus className="size-4" />
                            </div>
                        </div>
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-dashed py-3 last:border-b-0">
                            <div className="bg-muted border-foreground/5 flex size-12 items-center justify-center rounded-lg border">
                                <YouTubeShortsIcon />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-medium">YouTube Shorts</h3>
                                <p className="text-muted-foreground line-clamp-1 text-sm">9:16 vertical, 60 sec max</p>
                            </div>
                            <div className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors shadow-sm shadow-black/15 border border-transparent bg-card ring-1 ring-foreground/10 duration-200 hover:bg-muted/50 dark:ring-foreground/15 dark:hover:bg-muted/50 size-9">
                                <Plus className="size-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TikTokIcon() {
    return (
        <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    );
}

function InstagramReelsIcon() {
    return (
        <svg className="size-5" viewBox="0 0 24 24" fill="none">
            <defs>
                <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFDC80" />
                    <stop offset="25%" stopColor="#F77737" />
                    <stop offset="50%" stopColor="#E1306C" />
                    <stop offset="75%" stopColor="#C13584" />
                    <stop offset="100%" stopColor="#833AB4" />
                </linearGradient>
            </defs>
            <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
    );
}

function YouTubeShortsIcon() {
    return (
        <svg className="size-5" viewBox="0 0 24 24" fill="#FF0000">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    );
}

function AutoReframeVisual() {
    return (
        <div aria-hidden="true" className="min-w-2xs max-w-2xs mx-auto">
            <div className="flex items-end justify-center gap-3">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-14 bg-gradient-to-b from-primary/20 to-primary/40 rounded-md ring-2 ring-primary flex items-center justify-center">
                        <span className="text-[8px] font-bold text-primary">9:16</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Vertical</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="size-12 bg-gradient-to-br from-emerald-500/20 to-emerald-500/40 rounded-md ring-2 ring-emerald-500 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-emerald-600">1:1</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Square</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-9 bg-gradient-to-r from-blue-500/20 to-blue-500/40 rounded-md ring-2 ring-blue-500 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-blue-600">16:9</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Landscape</span>
                </div>
            </div>
            <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs">
                    <Maximize className="size-3" />
                    <span>Smart face tracking enabled</span>
                </div>
            </div>
        </div>
    );
}

function BrandKitVisual() {
    return (
        <div aria-hidden="true" className="min-w-2xs max-w-2xs mx-auto">
            <div className="ring-border bg-background/75 shadow-black/6.5 rounded-xl p-4 shadow-lg ring-1">
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="size-4 text-pink-500" />
                    <span className="font-medium text-sm">Brand Kit</span>
                </div>
                <div className="space-y-4">
                    <div>
                        <span className="text-xs text-muted-foreground mb-2 block">Colors</span>
                        <div className="flex gap-2">
                            <div className="size-8 rounded-lg bg-[#6366f1] ring-2 ring-offset-2 ring-[#6366f1]" />
                            <div className="size-8 rounded-lg bg-[#ec4899]" />
                            <div className="size-8 rounded-lg bg-[#14b8a6]" />
                            <div className="size-8 rounded-lg bg-[#f59e0b]" />
                            <div className="size-8 rounded-lg bg-foreground/10 flex items-center justify-center text-muted-foreground">+</div>
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground mb-2 block">Font</span>
                        <div className="bg-muted rounded-lg p-2 text-sm font-semibold">
                            Inter Bold
                        </div>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground mb-2 block">Logo</span>
                        <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                            <div className="size-8 bg-gradient-to-br from-primary to-emerald-500 rounded-md" />
                            <span className="text-sm">logo.png</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
