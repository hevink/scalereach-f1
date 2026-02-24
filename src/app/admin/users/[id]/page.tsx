"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    IconArrowLeft,
    IconVideo,
    IconScissors,
    IconBrandYoutube,
    IconUpload,
    IconExternalLink,
    IconChevronLeft,
    IconChevronRight,
} from "@tabler/icons-react";
import { useAdminUserById, useAdminUserVideos, useAdminUserClips } from "@/hooks/useAdmin";
import { formatDistanceToNow } from "date-fns";

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

function VideosTab({ userId }: { userId: string }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useAdminUserVideos(userId, page, 20);

    if (isLoading) {
        return <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
    }

    if (!data?.videos.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <IconVideo className="h-10 w-10 opacity-30" />
                <p>No videos found for this user</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{data.total} total videos</p>
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
                            <TableCell className="max-w-[220px]">
                                <div className="truncate font-medium">{v.title || "Untitled"}</div>
                                {v.errorMessage && (
                                    <div className="text-xs text-red-500 truncate">{v.errorMessage}</div>
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
                                <Badge variant="outline">{v.clipCount}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{v.workspaceName || "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <IconChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                            Next <IconChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ClipsTab({ userId }: { userId: string }) {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useAdminUserClips(userId, page, 20);

    if (isLoading) {
        return <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
    }

    if (!data?.clips.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <IconScissors className="h-10 w-10 opacity-30" />
                <p>No clips found for this user</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{data.total} total clips</p>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>From Video</TableHead>
                        <TableHead>Workspace</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.clips.map((c) => (
                        <TableRow key={c.id}>
                            <TableCell className="max-w-[180px]">
                                <div className="truncate font-medium">{c.title || "Untitled"}</div>
                            </TableCell>
                            <TableCell><StatusBadge status={c.status} /></TableCell>
                            <TableCell>
                                {c.viralityScore != null
                                    ? <Badge variant="outline">{c.viralityScore}%</Badge>
                                    : "-"}
                            </TableCell>
                            <TableCell className="text-sm">{formatDuration(c.duration)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{c.quality || "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">
                                {c.videoTitle || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{c.workspaceName || "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
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
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <IconChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                            Next <IconChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: user, isLoading } = useAdminUserById(id);

    return (
        <div className="flex">
            {/* Sidebar */}
            <aside className="w-56 border-r bg-muted/30 min-h-[calc(100vh-3.5rem)] p-4 space-y-1">
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 mb-4">
                        <IconArrowLeft className="h-4 w-4" />
                        Back to Admin
                    </Button>
                </Link>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User Detail
                </div>
                <Link href={`/admin/users/${id}?tab=videos`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <IconVideo className="h-4 w-4" /> Videos
                    </Button>
                </Link>
                <Link href={`/admin/users/${id}?tab=clips`}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <IconScissors className="h-4 w-4" /> Clips
                    </Button>
                </Link>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-6 space-y-6">
                {/* User header */}
                <Card>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-56" />
                                </div>
                            </div>
                        ) : user ? (
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback className="text-lg">{user.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-semibold">{user.name || "Unknown"}</h2>
                                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role || "user"}</Badge>
                                        {user.emailVerified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                                    </div>
                                    <p className="text-muted-foreground">{user.email}</p>
                                    {user.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">User not found</p>
                        )}
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="videos">
                    <TabsList>
                        <TabsTrigger value="videos" className="gap-2">
                            <IconVideo className="h-4 w-4" /> Videos
                        </TabsTrigger>
                        <TabsTrigger value="clips" className="gap-2">
                            <IconScissors className="h-4 w-4" /> Clips
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="videos" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Videos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <VideosTab userId={id} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="clips" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Clips</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ClipsTab userId={id} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
