"use client";

import Image from "next/image";

export function DocumentFlowCard() {
    return (
        <section className="bg-background py-24">
            <div className="mx-auto max-w-5xl px-6">
                <div className="flex flex-col items-center relative">
                    {/* SVG Lines Container - Behind everything */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 400 600"
                        preserveAspectRatio="xMidYMid meet"
                        fill="none"
                    >
                        {/* Line from Podcast to Logo */}
                        <path
                            d="M200 140 V240"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                            className="text-border"
                        />
                        {/* Animated beam - Podcast to Logo */}
                        <path
                            d="M200 140 V240"
                            stroke="url(#beamDown1)"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />

                        {/* Lines from Logo to 3 Shorts */}
                        {/* Left branch */}
                        <path
                            d="M200 300 V340 Q200 360 120 360 V480"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                            className="text-border"
                            fill="none"
                        />
                        {/* Center branch */}
                        <path
                            d="M200 300 V480"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                            className="text-border"
                        />
                        {/* Right branch */}
                        <path
                            d="M200 300 V340 Q200 360 280 360 V480"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                            className="text-border"
                            fill="none"
                        />

                        {/* Animated beams - Logo to Shorts */}
                        <path
                            d="M200 300 V340 Q200 360 120 360 V480"
                            stroke="url(#beamPink)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <path
                            d="M200 300 V480"
                            stroke="url(#beamRed)"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <path
                            d="M200 300 V340 Q200 360 280 360 V480"
                            stroke="url(#beamGray)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            fill="none"
                        />

                        <defs>
                            <linearGradient id="beamDown1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="transparent" />
                                <animate attributeName="y1" values="-1;1" dur="1.5s" repeatCount="indefinite" />
                                <animate attributeName="y2" values="0;2" dur="1.5s" repeatCount="indefinite" />
                            </linearGradient>
                            <linearGradient id="beamPink" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="transparent" />
                                <animate attributeName="y1" values="-1;1" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
                                <animate attributeName="y2" values="0;2" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
                            </linearGradient>
                            <linearGradient id="beamRed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="transparent" />
                                <animate attributeName="y1" values="-1;1" dur="1.5s" repeatCount="indefinite" begin="0.7s" />
                                <animate attributeName="y2" values="0;2" dur="1.5s" repeatCount="indefinite" begin="0.7s" />
                            </linearGradient>
                            <linearGradient id="beamGray" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="transparent" />
                                <animate attributeName="y1" values="-1;1" dur="1.5s" repeatCount="indefinite" begin="0.9s" />
                                <animate attributeName="y2" values="0;2" dur="1.5s" repeatCount="indefinite" begin="0.9s" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Podcast Thumbnail */}
                    <div className="relative z-10">
                        <div className="relative w-80 md:w-[420px] aspect-video rounded-2xl overflow-hidden ring-1 ring-border bg-card">
                            <Image
                                src="https://i.ytimg.com/vi/qsFWaQA_1g0/maxresdefault.jpg"
                                alt="Raj Shamani Podcast"
                                fill
                                className="object-cover"
                            />

                            {/* Play button */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="size-16 rounded-full bg-white/95 flex items-center justify-center">
                                    <svg className="size-7 text-black ml-1" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/80">
                                <span className="text-xs text-white font-semibold">45:32</span>
                            </div>

                            {/* Badge */}
                            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-red-500">
                                <span className="text-[10px] text-white font-bold uppercase tracking-wide">Podcast</span>
                            </div>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="h-24" />

                    {/* Logo */}
                    <div className="relative z-10">
                        <div className="size-16 md:size-20 rounded-2xl bg-primary flex items-center justify-center ring-1 ring-border">
                            <Image
                                src="/logo.svg"
                                alt="Logo"
                                width={32}
                                height={32}
                                className="brightness-0 invert md:w-10 md:h-10"
                            />
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="h-32" />

                    {/* Three Shorts */}
                    <div className="flex gap-6 md:gap-10 relative z-10">
                        <ShortClipCard
                            platform="instagram"
                            imageSrc="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80"
                            duration="0:32"
                        />
                        <ShortClipCard
                            platform="youtube"
                            imageSrc="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80"
                            duration="0:58"
                        />
                        <ShortClipCard
                            platform="x"
                            imageSrc="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80"
                            duration="0:45"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function ShortClipCard({
    platform,
    imageSrc,
    duration
}: {
    platform: "instagram" | "youtube" | "x";
    imageSrc: string;
    duration: string;
}) {
    const platformConfig = {
        instagram: {
            icon: "/model/instagram.svg",
            bg: "bg-pink-500",
        },
        youtube: {
            icon: "/model/youtube.svg",
            bg: "bg-red-500",
        },
        x: {
            icon: "/model/x.svg",
            bg: "bg-neutral-800",
        },
    };

    const config = platformConfig[platform];

    return (
        <div className="relative group">
            <div className="relative w-24 md:w-32 aspect-[9/16] rounded-xl overflow-hidden ring-1 ring-border bg-card transition-transform duration-300 group-hover:scale-[1.02]">
                <Image
                    src={imageSrc}
                    alt={`${platform} short`}
                    fill
                    className="object-cover"
                />

                {/* Platform badge */}
                <div className={`absolute top-2 right-2 size-7 rounded-full ${config.bg} flex items-center justify-center`}>
                    <Image
                        src={config.icon}
                        alt={platform}
                        width={14}
                        height={14}
                        className="brightness-0 invert"
                    />
                </div>

                {/* Duration */}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70">
                    <span className="text-[10px] text-white font-medium">{duration}</span>
                </div>

                {/* Hover play */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="size-10 rounded-full bg-white/95 flex items-center justify-center">
                        <svg className="size-4 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
