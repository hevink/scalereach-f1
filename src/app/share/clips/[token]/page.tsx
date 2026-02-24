import type { Metadata } from "next";
import ShareViewer from "./share-viewer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://scalereach.ai";

interface SharePageProps {
    params: Promise<{ token: string }>;
}

async function fetchShareData(token: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/share/${token}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
    const { token } = await params;
    const data = await fetchShareData(token);

    if (!data) {
        return {
            title: "Shared Clips - ScaleReach",
            description: "View and download viral clips created with ScaleReach.",
        };
    }

    const clipWord = data.clipCount === 1 ? "clip" : "clips";
    const title = `I found ${data.clipCount} viral ${clipWord} using ScaleReach.ai 🔥`;
    const description = `From "${data.videoTitle}" — AI picked the best moments so you don't have to. Watch & download the ${clipWord} now.`;
    const ogImage = data.videoThumbnailUrl || data.thumbnailUrl || data.clips?.[0]?.thumbnailUrl || "/og-image.png";
    const shareUrl = `${APP_URL}/share/clips/${token}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            siteName: "ScaleReach",
            url: shareUrl,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
            creator: "@scalereach",
        },
    };
}

export default async function SharePage({ params }: SharePageProps) {
    const { token } = await params;
    return <ShareViewer token={token} />;
}
