"use client";

import { useState } from "react";

export function HowItWorks() {
    return (
        <section className="py-24 pt-32 overflow-hidden">
            <div className="mx-auto max-w-6xl px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="text-primary text-sm font-medium tracking-wide uppercase inline-block animate-fade-in">
                        How It Works
                    </span>
                    <h2 className="text-foreground mt-3 text-3xl font-semibold tracking-tight md:text-4xl animate-slide-up [animation-delay:100ms]">
                        Turn long videos into viral clips in 3 steps
                    </h2>
                    <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg animate-slide-up [animation-delay:200ms]">
                        Our AI analyzes your content, finds the most engaging moments, and creates ready-to-post short-form videos.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid gap-8 md:grid-cols-3">
                    <StepUpload />
                    <StepAnalysis />
                    <StepExport />
                </div>

                {/* CTA */}
                <div className="mt-16 text-center animate-slide-up [animation-delay:600ms]">
                    <a
                        href="#"
                        className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium shadow-lg hover:bg-primary/90 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        Try It Free
                        <ArrowRightIcon className="size-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </a>
                    <p className="text-muted-foreground text-sm mt-3">No credit card required</p>
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-bar {
                    0%, 100% { transform: scaleY(0.3); }
                    50% { transform: scaleY(1); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 75%; }
                }
                @keyframes scan-line {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
                .animate-slide-up {
                    opacity: 0;
                    animation: slide-up 0.6s ease-out forwards;
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-progress {
                    animation: progress 2s ease-out forwards;
                }
                .animate-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </section>
    );
}

function StepUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleClick = () => {
        setIsUploading(true);
        setTimeout(() => setIsUploading(false), 3000);
    };

    return (
        <div className="group relative animate-slide-up [animation-delay:300ms]">
            <div className="mb-6">
                <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    1
                </div>
            </div>
            <h3 className="text-foreground text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                Upload Your Video
            </h3>
            <p className="text-muted-foreground mb-6">
                Drop your long-form content — podcasts, streams, interviews, or any video up to 4 hours.
            </p>

            {/* Upload Card Visual */}
            <div className="relative [perspective:1000px]">
                <div
                    className={`bg-card border rounded-xl p-6 shadow-lg transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(2deg)_rotateX(-2deg)] group-hover:shadow-2xl cursor-pointer ${isDragging ? 'border-primary border-2 scale-[1.02]' : ''}`}
                    onDragEnter={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={() => setIsDragging(false)}
                    onClick={handleClick}
                >
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}`}>
                        <div className={`mx-auto w-fit p-3 bg-primary/10 rounded-full mb-4 transition-all duration-500 ${isDragging ? 'scale-125 bg-primary/20' : 'group-hover:scale-110'}`}>
                            <UploadIcon className={`size-6 text-primary transition-transform duration-300 ${isDragging ? 'animate-bounce' : ''}`} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 transition-colors duration-300 group-hover:text-foreground">
                            {isDragging ? 'Drop it here!' : 'Drag & drop your video'}
                        </p>
                        <p className="text-xs text-muted-foreground/60">MP4, MOV, WEBM up to 4 hours</p>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 flex items-center gap-3">
                        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300 ${isUploading ? 'animate-progress' : 'w-0'}`}
                            >
                                <div className="w-full h-full animate-shimmer" />
                            </div>
                        </div>
                        <span className={`text-xs font-medium transition-all duration-300 ${isUploading ? 'text-primary' : 'text-muted-foreground'}`}>
                            {isUploading ? '75%' : '0%'}
                        </span>
                    </div>

                    {/* File info (shows when uploading) */}
                    <div className={`mt-3 flex items-center gap-2 overflow-hidden transition-all duration-500 ${isUploading ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <VideoFileIcon className="size-4 text-primary" />
                        <span className="text-xs text-muted-foreground truncate">podcast_episode_42.mp4</span>
                        <span className="text-xs text-muted-foreground/60 ml-auto">1.2 GB</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepAnalysis() {
    const [activeClip, setActiveClip] = useState<number | null>(null);

    return (
        <div className="group relative animate-slide-up [animation-delay:400ms]">
            <div className="mb-6">
                <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    2
                </div>
            </div>
            <h3 className="text-foreground text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                AI Finds Viral Moments
            </h3>
            <p className="text-muted-foreground mb-6">
                Our AI analyzes speech, emotions, and engagement patterns to identify the best clips.
            </p>

            {/* AI Analysis Card Visual */}
            <div className="relative [perspective:1000px]">
                <div className="bg-card border rounded-xl p-6 shadow-lg transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(2deg)_rotateX(-2deg)] group-hover:shadow-2xl">
                    {/* Status indicator */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative">
                            <div className="size-2 rounded-full bg-green-500" />
                            <div className="absolute inset-0 size-2 rounded-full bg-green-500 animate-ping" />
                        </div>
                        <span className="text-xs text-muted-foreground">AI Processing</span>
                        <div className="ml-auto flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="size-1.5 rounded-full bg-primary/40 animate-bounce"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Waveform visualization */}
                    <div className="relative flex items-end gap-0.5 h-20 mb-4 px-1">
                        {/* Scan line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-primary/50 top-1/2 animate-pulse" />

                        {[40, 65, 45, 80, 55, 90, 70, 85, 50, 75, 60, 95, 45, 70, 55, 80, 65, 45, 75, 60, 50, 85, 70, 55].map((height, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-primary to-primary/40 rounded-t transition-all duration-500 hover:from-primary hover:to-primary/80 cursor-pointer"
                                style={{
                                    height: `${height}%`,
                                    animationDelay: `${i * 50}ms`,
                                    animation: 'pulse-bar 1.5s ease-in-out infinite',
                                    animationDelay: `${i * 80}ms`
                                }}
                            />
                        ))}
                    </div>

                    {/* Detected clips */}
                    <div className="space-y-2">
                        {[
                            { time: "2:34", score: 98, label: "Hook moment" },
                            { time: "8:12", score: 94, label: "Key insight" },
                            { time: "15:47", score: 91, label: "Emotional peak" }
                        ].map((clip, index) => (
                            <ClipDetected
                                key={index}
                                {...clip}
                                isActive={activeClip === index}
                                onClick={() => setActiveClip(activeClip === index ? null : index)}
                                delay={index * 100}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepExport() {
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    const togglePlatform = (platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 2000);
    };

    return (
        <div className="group relative animate-slide-up [animation-delay:500ms]">
            <div className="mb-6">
                <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    3
                </div>
            </div>
            <h3 className="text-foreground text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                Export & Share
            </h3>
            <p className="text-muted-foreground mb-6">
                Get clips with auto-captions, optimized for TikTok, Reels, Shorts, and LinkedIn.
            </p>

            {/* Export Card Visual */}
            <div className="relative [perspective:1000px]">
                <div className="bg-card border rounded-xl p-6 shadow-lg transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(2deg)_rotateX(-2deg)] group-hover:shadow-2xl">
                    {/* Mini video previews */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {["TikTok", "Reels", "Shorts"].map((platform, index) => (
                            <VideoPreview
                                key={platform}
                                platform={platform}
                                isSelected={selectedPlatforms.includes(platform)}
                                onClick={() => togglePlatform(platform)}
                                delay={index * 100}
                            />
                        ))}
                    </div>

                    {/* Export options */}
                    <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${isExporting ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'}`}>
                        <div className="flex items-center gap-2">
                            <DownloadIcon className={`size-4 transition-all duration-300 ${isExporting ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">
                                {selectedPlatforms.length > 0 ? `${selectedPlatforms.length * 4} clips selected` : '12 clips ready'}
                            </span>
                        </div>
                        <button
                            onClick={handleExport}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300 ${
                                isExporting
                                    ? 'bg-green-500 text-white scale-95'
                                    : 'bg-primary text-primary-foreground hover:scale-105 hover:shadow-md active:scale-95'
                            }`}
                        >
                            {isExporting ? (
                                <span className="flex items-center gap-1">
                                    <CheckIcon className="size-3" />
                                    Done!
                                </span>
                            ) : 'Export All'}
                        </button>
                    </div>

                    {/* Format badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {['1080p', 'Auto-captions', '9:16'].map((badge, i) => (
                            <span
                                key={badge}
                                className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 cursor-default"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClipDetected({
    time,
    score,
    label,
    isActive,
    onClick,
    delay
}: {
    time: string;
    score: number;
    label: string;
    isActive: boolean;
    onClick: () => void;
    delay: number;
}) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-300 ${
                isActive
                    ? 'bg-primary/10 scale-[1.02] shadow-sm'
                    : 'bg-muted/50 hover:bg-muted hover:scale-[1.01]'
            }`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`size-8 rounded flex items-center justify-center transition-all duration-300 ${
                isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/20'
            }`}>
                <PlayIcon className={`size-3 transition-transform duration-300 ${isActive ? 'scale-110' : ''} ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate transition-colors duration-300 ${isActive ? 'text-primary' : ''}`}>
                    {label}
                </p>
                <p className="text-xs text-muted-foreground">{time}</p>
            </div>
            <div className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-all duration-300 ${
                isActive
                    ? 'bg-green-500 text-white scale-110'
                    : 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
            }`}>
                {score}%
            </div>
        </div>
    );
}

function VideoPreview({
    platform,
    isSelected,
    onClick,
    delay
}: {
    platform: string;
    isSelected: boolean;
    onClick: () => void;
    delay: number;
}) {
    return (
        <div
            onClick={onClick}
            className={`aspect-[9/16] rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-300 ${
                isSelected
                    ? 'bg-primary/20 border-2 border-primary scale-[1.05] shadow-lg'
                    : 'bg-gradient-to-br from-muted to-muted/50 border hover:border-primary/50 hover:scale-[1.02]'
            }`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`size-6 rounded-full flex items-center justify-center mb-1 transition-all duration-300 ${
                isSelected ? 'bg-primary text-primary-foreground scale-110' : 'bg-primary/20'
            }`}>
                {isSelected ? (
                    <CheckIcon className="size-3 text-primary-foreground" />
                ) : (
                    <PlayIcon className="size-2.5 text-primary" />
                )}
            </div>
            <span className={`text-[10px] transition-colors duration-300 ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {platform}
            </span>
        </div>
    );
}

// Icons
function UploadIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
    );
}

function PlayIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

function DownloadIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    );
}

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function VideoFileIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m22 8-6 4 6 4V8Z" />
            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
        </svg>
    );
}
