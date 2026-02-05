"use client";

import { useRouter, useParams } from "next/navigation";
import { IconBrandYoutube, IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface YouTubeUploadFormProps {
    projectId?: string;
    onSuccess?: (videoId: string) => void;
}

export function YouTubeUploadForm({ projectId, onSuccess }: YouTubeUploadFormProps) {
    const router = useRouter();
    const params = useParams();
    const workspaceSlug = params["workspace-slug"] as string;

    const handleClick = () => {
        router.push(`/${workspaceSlug}/configure`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <IconBrandYoutube className="size-5 text-red-500" />
                    Upload YouTube Video
                </CardTitle>
                <CardDescription>
                    Generate viral clips from your YouTube videos
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleClick} className="w-full" size="lg">
                    Get Started
                    <IconArrowRight className="ml-2 size-4" />
                </Button>
            </CardContent>
        </Card>
    );
}
