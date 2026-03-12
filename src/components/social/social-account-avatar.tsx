"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";
import {
    YouTubeIcon,
    TikTokIcon,
    InstagramIcon,
    TwitterIcon,
    LinkedInIcon,
    FacebookIcon,
    ThreadsIcon,
} from "@/components/icons/platform-icons";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
    tiktok: TikTokIcon,
    instagram: InstagramIcon,
    instagram_reels: InstagramIcon,
    facebook: FacebookIcon,
    facebook_reels: FacebookIcon,
    youtube: YouTubeIcon,
    youtube_shorts: YouTubeIcon,
    twitter: TwitterIcon,
    linkedin: LinkedInIcon,
    threads: ThreadsIcon,
};

const PLATFORM_BADGE_COLORS: Record<string, string> = {
    tiktok: "bg-black",
    instagram: "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600",
    instagram_reels: "bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600",
    facebook: "bg-blue-600",
    facebook_reels: "bg-blue-600",
    youtube: "bg-red-500",
    youtube_shorts: "bg-red-500",
    twitter: "bg-black",
    linkedin: "bg-blue-600",
    threads: "bg-black",
};

interface SocialAccountAvatarProps {
    avatarUrl: string | null;
    accountName: string;
    platform: string;
    /** Show platform badge overlay. Default: true */
    showBadge?: boolean;
    /** Avatar size variant */
    size?: "sm" | "default" | "lg";
    className?: string;
}

export function SocialAccountAvatar({
    avatarUrl,
    accountName,
    platform,
    showBadge = true,
    size = "default",
    className,
}: SocialAccountAvatarProps) {
    const Icon = PLATFORM_ICONS[platform];
    const badgeColor = PLATFORM_BADGE_COLORS[platform] || "bg-muted";
    const initial = accountName?.charAt(0)?.toUpperCase() || "?";

    return (
        <Avatar size={size} className={className}>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={accountName} />}
            <AvatarFallback>{initial}</AvatarFallback>
            {showBadge && Icon && (
                <AvatarBadge className={cn("text-white", badgeColor)}>
                    <Icon className="size-2" />
                </AvatarBadge>
            )}
        </Avatar>
    );
}
