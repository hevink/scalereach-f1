"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    IconArrowLeft,
    IconVideo,
    IconScissors,
    IconBrandYoutube,
    IconUpload,
    IconExternalLink,
    IconChevronLeft,
    IconChevronRight,
    IconChevronDown,
    IconChevronUp,
    IconCalendar,
    IconClock,
    IconShieldCheck,
    IconUser,
    IconMail,
    IconAt,
    IconCreditCard,
    IconBuildingStore,
    IconRefresh,
    IconAlertCircle,
    IconCheck,
} from "@tabler/icons-react";
import { useAdminUserById, useAdminUserVideos, useAdminUserClips, useAdminUserWorkspaces } from "@/hooks/useAdmin";
import { formatDistanceToNow, format } from "date-fns";
import { AdminUserVideo, AdminUserClip, AdminUserWorkspace } from "@/lib/api/admin";

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

// Inline clips row shown when a video is expanded
function VideoClipsRow({ clips }: { clips: AdminUserClip[] }) {
    if (!clips.length) {
        return (
            <TableRow>
                <TableCell colSpan={7} className="bg-muted/30 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-8">
                        <IconScissors className="h-4 w-4 opacity-40" />
                        No clips generated for this video
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <>
            {clips.map((c) => (
                <TableRow key={c.id} className="bg-muted/20 hover:bg-muted/30">
                    <TableCell className="pl-10">
                        <div className="flex items-center gap-2">
                            <IconScissors className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate max-w-[180px]">{c.title || "Untitled clip"}</span>
                        </div>
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>
                        {c.viralityScore != null
                            ? <Badge variant="outline" className="text-xs">{c.viralityScore}%</Badge>
                            : <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDuration(c.duration)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.quality || "-"}</TableCell>
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
        </>
    );
}

// Single collapsible video row with its clips
function VideoRow({ video, allClips }: { video: AdminUserVideo; allClips: AdminUserClip[] }) {
    const [open, setOpen] = useState(false);
    const videoClips = allClips.filter((c) => c.videoId === video.id);

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setOpen((o) => !o)}
            >
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            {open
                                ? <IconChevronUp className="h-3.5 w-3.5" />
                                : <IconChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                        <div>
                            <div className="font-medium truncate max-w-[200px]">{video.title || "Untitled"}</div>
                            {video.errorMessage && (
                                <div className="text-xs text-red-500 truncate max-w-[200px]">{video.errorMessage}</div>
                            )}
                        </div>
                    </div>
                </TableCell>
                <TableCell><StatusBadge status={video.status} /></TableCell>
                <TableCell>
                    {video.sourceType === "youtube"
                        ? <IconBrandYoutube className="h-4 w-4 text-red-500" />
                        : <IconUpload className="h-4 w-4 text-blue-500" />}
                </TableCell>
                <TableCell className="text-sm">{formatDuration(video.duration)}</TableCell>
                <TableCell>
                    <Badge variant="outline" className="text-xs gap-1">
                        <IconScissors className="h-3 w-3" />
                        {video.clipCount}
                    </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{video.workspaceName || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </TableCell>
            </TableRow>
            {open && <VideoClipsRow clips={videoClips} />}
        </>
    );
}

const PLAN_COLORS: Record<string, string> = {
    free: "bg-gray-500",
    starter: "bg-blue-600",
    pro: "bg-purple-600",
    "pro-plus": "bg-orange-600",
};

const SUB_STATUS_COLORS: Record<string, string> = {
    active: "bg-green-600",
    cancelled: "bg-red-600",
    expired: "bg-red-600",
    paused: "bg-yellow-600",
};

function WorkspacesSection({ workspaces }: { workspaces: AdminUserWorkspace[] }) {
    if (!workspaces.length) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <IconBuildingStore className="h-8 w-8 opacity-30" />
                <p className="text-sm">No workspaces found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {workspaces.map((ws) => (
                <div key={ws.id} className="border rounded-lg p-4 space-y-4">
                    {/* Workspace header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{ws.name}</span>
                                <Badge className={`${PLAN_COLORS[ws.plan] || "bg-gray-500"} text-white text-xs`}>
                                    {ws.plan}
                                </Badge>
                                {ws.memberRole && (
                                    <Badge variant="outline" className="text-xs">{ws.memberRole}</Badge>
                                )}
                                {ws.subscriptionStatus && (
                                    <Badge className={`${SUB_STATUS_COLORS[ws.subscriptionStatus] || "bg-gray-500"} text-white text-xs`}>
                                        {ws.subscriptionStatus}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">/{ws.slug}</p>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                            Created {format(new Date(ws.createdAt), "MMM d, yyyy")}
                        </div>
                    </div>

                    {/* Subscription details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Billing Cycle</p>
                            <p className="font-medium capitalize">{ws.billingCycle || "—"}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Subscription ID</p>
                            <p className="font-mono text-xs truncate max-w-[140px]">{ws.subscriptionId || "—"}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Renewal Date</p>
                            <p className="font-medium">
                                {ws.subscriptionRenewalDate
                                    ? format(new Date(ws.subscriptionRenewalDate), "MMM d, yyyy")
                                    : "—"}
                            </p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs text-muted-foreground">Cancelled At</p>
                            <p className="font-medium">
                                {ws.subscriptionCancelledAt
                                    ? format(new Date(ws.subscriptionCancelledAt), "MMM d, yyyy")
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    {/* Credits & Minutes */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-muted/40 rounded-md p-3">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <IconCreditCard className="h-3 w-3" /> Credits Balance
                            </p>
                            <p className="text-lg font-bold mt-0.5">{ws.creditsBalance.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Lifetime: {ws.lifetimeCredits.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/40 rounded-md p-3">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <IconClock className="h-3 w-3" /> Minutes Remaining
                            </p>
                            <p className="text-lg font-bold mt-0.5">{ws.minutesRemaining.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">of {ws.minutesTotal.toLocaleString()} total</p>
                        </div>
                        <div className="bg-muted/40 rounded-md p-3">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <IconRefresh className="h-3 w-3" /> Minutes Used
                            </p>
                            <p className="text-lg font-bold mt-0.5">{ws.minutesUsed.toLocaleString()}</p>
                            {ws.minutesResetDate && (
                                <p className="text-xs text-muted-foreground">
                                    Resets {format(new Date(ws.minutesResetDate), "MMM d")}
                                </p>
                            )}
                        </div>
                        <div className="bg-muted/40 rounded-md p-3">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <IconVideo className="h-3 w-3" /> Content
                            </p>
                            <p className="text-lg font-bold mt-0.5">{ws.videoCount}</p>
                            <p className="text-xs text-muted-foreground">{ws.clipCount} clips</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [videoPage, setVideoPage] = useState(1);

    const { data: user, isLoading: userLoading } = useAdminUserById(id);
    // Load all videos for this user (up to 50 per page)
    const { data: videosData, isLoading: videosLoading } = useAdminUserVideos(id, videoPage, 20);
    // Load all clips for this user to match against videos (load large batch)
    const { data: clipsData, isLoading: clipsLoading } = useAdminUserClips(id, 1, 200);
    // Load workspaces with subscription data
    const { data: workspacesData, isLoading: workspacesLoading } = useAdminUserWorkspaces(id);

    const allClips = clipsData?.clips ?? [];
    const videos = videosData?.videos ?? [];

    // Stats derived from data
    const totalClips = clipsData?.total ?? 0;
    const readyClips = allClips.filter((c) => c.status === "ready").length;
    const failedVideos = videos.filter((v) => v.status === "failed").length;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Back */}
            <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                    <IconArrowLeft className="h-4 w-4" />
                    Back to Users
                </Button>
            </Link>

            {/* User Profile Card */}
            <Card>
                <CardContent className="pt-6">
                    {userLoading ? (
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    ) : user ? (
                        <div className="flex flex-col sm:flex-row gap-6">
                            {/* Avatar + name */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback className="text-2xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-xl font-semibold">{user.name || "Unknown"}</h2>
                                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role || "user"}</Badge>
                                        {user.emailVerified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                                        {user.twoFactorEnabled && <Badge variant="outline" className="text-xs">2FA</Badge>}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <IconMail className="h-3.5 w-3.5" />
                                        {user.email}
                                    </div>
                                    {user.username && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <IconAt className="h-3.5 w-3.5" />
                                            {user.username}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meta info */}
                            <div className="flex flex-wrap gap-4 sm:ml-auto text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <IconCalendar className="h-4 w-4" />
                                    Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <IconUser className="h-4 w-4" />
                                    {user.isOnboarded ? "Onboarded" : "Not onboarded"}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <IconShieldCheck className="h-4 w-4" />
                                    {user.role || "user"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">User not found</p>
                    )}
                </CardContent>
            </Card>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="text-2xl font-bold">{videosData?.total ?? "-"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <IconVideo className="h-3.5 w-3.5" /> Total Videos
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="text-2xl font-bold">{totalClips || "-"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <IconScissors className="h-3.5 w-3.5" /> Total Clips
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="text-2xl font-bold text-green-600">{readyClips || "-"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <IconScissors className="h-3.5 w-3.5" /> Ready Clips
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="text-2xl font-bold text-red-600">{failedVideos || "-"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <IconVideo className="h-3.5 w-3.5" /> Failed Videos
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Workspaces & Subscription */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <IconBuildingStore className="h-4 w-4" />
                        Workspaces & Subscriptions
                        {workspacesData && (
                            <Badge variant="secondary" className="ml-1">{workspacesData.length}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {workspacesLoading ? (
                        <div className="space-y-3">
                            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                        </div>
                    ) : (
                        <WorkspacesSection workspaces={workspacesData ?? []} />
                    )}
                </CardContent>
            </Card>

            {/* Videos + collapsible clips */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <IconVideo className="h-4 w-4" />
                        Videos
                        {videosData?.total != null && (
                            <Badge variant="secondary" className="ml-1">{videosData.total}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {videosLoading || clipsLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : !videos.length ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                            <IconVideo className="h-10 w-10 opacity-30" />
                            <p>No videos found for this user</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-muted-foreground mb-3">
                                Click a row to expand and see clips
                            </p>
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
                                    {videos.map((v) => (
                                        <VideoRow key={v.id} video={v} allClips={allClips} />
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {videosData && videosData.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm text-muted-foreground">
                                        Page {videosData.page} of {videosData.totalPages}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => setVideoPage((p) => Math.max(1, p - 1))}
                                            disabled={videoPage === 1}
                                        >
                                            <IconChevronLeft className="h-4 w-4" /> Previous
                                        </Button>
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => setVideoPage((p) => Math.min(videosData.totalPages, p + 1))}
                                            disabled={videoPage === videosData.totalPages}
                                        >
                                            Next <IconChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
