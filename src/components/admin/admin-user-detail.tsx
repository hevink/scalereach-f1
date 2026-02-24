"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    IconChevronLeft,
    IconChevronRight,
    IconVideo,
    IconScissors,
    IconBrandYoutube,
    IconUpload,
    IconExternalLink,
} from "@tabler/icons-react";
import { useAdminUserVideos, useAdminUserClips } from "@/hooks/useAdmin";
import { AdminUser } from "@/lib/api/admin";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
    completed: "bg-green-600",
    ready: "bg-green-600",
    failed: "bg-red-600",
    pending: "bg-gray-500",
    pending_config: "bg-gray-500",
    downloading: "bg-yellow-600",
    uploading: "bg-yellow-600",
    transcribing: "bg-yellow-600",
    analyzing: "bg-yellow-600",
    generating: "bg-yellow-600",
    detected: "bg-blue-600",
    exported: "bg-purple-600",
};

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge className={`${STATUS_COLORS[status] || "bg-gray-500"} text-white text-xs`}>
            {status.replace(/_/g, " ")}
        </Badge>
    );
}

function formatDuration(seconds: number | null) {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number | null) {
    if (!bytes) return "-";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UserVideosTab({ userId }: { userId: string }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useAdminUserVideos(userId, page, 15);

    if (isLoading) {
        return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
    }

    if (!data?.videos.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <IconVideo className="h-8 w-8 opacity-40" />
                <p className="text-sm">No videos found for this user</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{data.total} total videos</div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Clips</TableHead>
                        <TableHead>Workspace</TableHead>
                        <TableHead>Created</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.videos.map((v) => (
                        <TableRow key={v.id}>
                            <TableCell className="max-w-[180px]">
                                <div className="truncate font-medium text-sm">{v.title || "Untitled"}</div>
                                {v.errorMessage && (
                                    <div className="text-xs text-red-500 truncate max-w-[180px]">{v.errorMessage}</div>
                                )}
                            </TableCell>
                            <TableCell><StatusBadge status={v.status} /></TableCell>
                            <TableCell>
                                {v.sourceType === "youtube"
                                    ? <IconBrandYoutube className="h-4 w-4 text-red-500" />
                                    : <IconUpload className="h-4 w-4 text-blue-500" />}
                            </TableCell>
                            <TableCell className="text-sm">{formatDuration(v.duration)}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs">{v.clipCount}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{v.workspaceName || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">Page {data.page} of {data.totalPages}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                            <IconChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function UserClipsTab({ userId }: { userId: string }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useAdminUserClips(userId, page, 15);

    if (isLoading) {
        return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
    }

    if (!data?.clips.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <IconScissors className="h-8 w-8 opacity-40" />
                <p className="text-sm">No clips found for this user</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{data.total} total clips</div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Video</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.clips.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell className="max-w-[160px]">
                                <div className="truncate font-medium text-sm">{c.title || "Untitled"}</div>
                            </TableCell>
                            <TableCell><StatusBadge status={c.status} /></TableCell>
                            <TableCell>
                                {c.viralityScore != null
                                    ? <Badge variant="outline" className="text-xs">{c.viralityScore}%</Badge>
                                    : "-"}
                            </TableCell>
                            <TableCell className="text-sm">{formatDuration(c.duration)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{c.quality || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                {c.videoTitle || "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                                {c.storageUrl && (
                                    <a href={c.storageUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <IconExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </a>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">Page {data.page} of {data.totalPages}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                            <IconChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface AdminUserDetailProps {
    user: AdminUser | null;
    open: boolean;
    onClose: () => void;
}

export function AdminUserDetail({ user, open, onClose }: AdminUserDetailProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {user && (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold">{user.name || "Unknown"}</div>
                                    <div className="text-sm font-normal text-muted-foreground">{user.email}</div>
                                </div>
                                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="ml-2">
                                    {user.role || "user"}
                                </Badge>
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {user && (
                    <Tabs defaultValue="videos" className="mt-2">
                        <TabsList>
                            <TabsTrigger value="videos" className="gap-2">
                                <IconVideo className="h-4 w-4" />
                                Videos
                            </TabsTrigger>
                            <TabsTrigger value="clips" className="gap-2">
                                <IconScissors className="h-4 w-4" />
                                Clips
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="videos" className="mt-4">
                            <UserVideosTab userId={user.id} />
                        </TabsContent>
                        <TabsContent value="clips" className="mt-4">
                            <UserClipsTab userId={user.id} />
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}
