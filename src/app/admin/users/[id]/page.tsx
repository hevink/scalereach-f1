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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    IconArrowLeft, IconVideo, IconScissors, IconBrandYoutube, IconUpload,
    IconExternalLink, IconChevronLeft, IconChevronRight, IconChevronDown,
    IconChevronUp, IconCalendar, IconClock, IconShieldCheck, IconUser,
    IconMail, IconAt, IconCreditCard, IconBuildingStore, IconRefresh,
    IconAlertCircle, IconAlertTriangle, IconCheck, IconX,
} from "@tabler/icons-react";
import { useAdminUserById, useAdminUserVideos, useAdminUserClips, useAdminUserWorkspaces } from "@/hooks/useAdmin";
import { formatDistanceToNow, format } from "date-fns";
import { AdminUserVideo, AdminUserClip, AdminUserWorkspace } from "@/lib/api/admin";

const STATUS_COLORS: Record<string, string> = {
    completed: "bg-emerald-600",
    ready: "bg-emerald-600",
    failed: "bg-red-600",
    pending: "bg-gray-500",
    pending_config: "bg-gray-500",
    downloading: "bg-amber-600",
    uploading: "bg-amber-600",
    transcribing: "bg-amber-600",
    analyzing: "bg-amber-600",
    generating: "bg-amber-600",
    detected: "bg-blue-600",
    exported: "bg-purple-600",
};

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge className={`${STATUS_COLORS[status] || "bg-gray-500"} text-white text-xs capitalize`}>
            {status.replace(/_/g, " ")}
        </Badge>
    );
}

function formatDuration(seconds: number | null) {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Failed Clips Summary ──────────────────────────────────────────────────────
function FailedClipsAlert({ clips }: { clips: AdminUserClip[] }) {
    const failed = clips.filter((c) => c.status === "failed");
    if (!failed.length) return null;

    return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                    <IconAlertTriangle className="h-4 w-4" />
                    {failed.length} Failed Clip{failed.length > 1 ? "s" : ""} Detected
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {failed.map((c) => (
                        <div key={c.id} className="flex items-start gap-2 text-sm bg-white dark:bg-red-950/40 rounded-md p-2.5 border border-red-100 dark:border-red-900">
                            <IconX className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{c.title || "Untitled clip"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                    {c.duration ? ` · ${formatDuration(c.duration)}` : ""}
                                </p>
                            </div>
                            {c.storageUrl && (
                                <a href={c.storageUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                        <IconExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Inline clips row ──────────────────────────────────────────────────────────
function VideoClipsRow({ clips }: { clips: AdminUserClip[] }) {
    if (!clips.length) {
        return (
            <TableRow>
                <TableCell colSpan={7} className="bg-muted/30 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pl-10">
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
                <TableRow key={c.id} className={`${c.status === "failed" ? "bg-red-50/50 dark:bg-red-950/10" : "bg-muted/20"} hover:bg-muted/30`}>
                    <TableCell className="pl-10">
                        <div className="flex items-center gap-2">
                            {c.status === "failed"
                                ? <IconAlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                : <IconScissors className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                            <span className="text-sm truncate max-w-[160px]">{c.title || "Untitled clip"}</span>
                        </div>
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>
                        {c.viralityScore != null
                            ? <Badge variant="outline" className="text-xs">{c.viralityScore}%</Badge>
                            : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDuration(c.duration)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.quality || "—"}</TableCell>
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

function VideoRow({ video, allClips }: { video: AdminUserVideo; allClips: AdminUserClip[] }) {
    const [open, setOpen] = useState(false);
    const videoClips = allClips.filter((c) => c.videoId === video.id);
    const failedClips = videoClips.filter((c) => c.status === "failed").length;

    return (
        <>
            <TableRow
                className={`cursor-pointer hover:bg-muted/50 ${video.status === "failed" ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
                onClick={() => setOpen((o) => !o)}
            >
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            {open ? <IconChevronUp className="h-3.5 w-3.5" /> : <IconChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                        <div className="min-w-0">
                            <div className="font-medium truncate max-w-[180px] text-sm">{video.title || "Untitled"}</div>
                            {video.errorMessage && (
                                <div className="text-xs text-red-500 truncate max-w-[180px] flex items-center gap-1">
                                    <IconAlertCircle className="h-3 w-3 shrink-0" />
                                    {video.errorMessage}
                                </div>
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
                    <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs gap-1">
                            <IconScissors className="h-3 w-3" />
                            {video.clipCount}
                        </Badge>
                        {failedClips > 0 && (
                            <Badge className="bg-red-600 text-white text-xs">{failedClips} failed</Badge>
                        )}
                    </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{video.workspaceName || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </TableCell>
            </TableRow>
            {open && <VideoClipsRow clips={videoClips} />}
        </>
    );
}

const PLAN_COLORS: Record<string, string> = {
    free: "bg-gray-500", starter: "bg-blue-600", pro: "bg-purple-600", "pro-plus": "bg-orange-600",
};
const SUB_STATUS_COLORS: Record<string, string> = {
    active: "bg-emerald-600", cancelled: "bg-red-600", expired: "bg-red-600", paused: "bg-amber-600",
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
                <div key={ws.id} className="border rounded-xl p-4 space-y-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{ws.name}</span>
                                <Badge className={`${PLAN_COLORS[ws.plan] || "bg-gray-500"} text-white text-xs`}>{ws.plan}</Badge>
                                {ws.memberRole && <Badge variant="outline" className="text-xs">{ws.memberRole}</Badge>}
                                {ws.subscriptionStatus && (
                                    <Badge className={`${SUB_STATUS_COLORS[ws.subscriptionStatus] || "bg-gray-500"} text-white text-xs`}>
                                        {ws.subscriptionStatus}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">/{ws.slug}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Created {format(new Date(ws.createdAt), "MMM d, yyyy")}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Billing Cycle</p>
                            <p className="font-medium capitalize">{ws.billingCycle || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Subscription ID</p>
                            <p className="font-mono text-xs truncate">{ws.subscriptionId || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Renewal Date</p>
                            <p className="font-medium">
                                {ws.subscriptionRenewalDate ? format(new Date(ws.subscriptionRenewalDate), "MMM d, yyyy") : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Cancelled At</p>
                            <p className="font-medium">
                                {ws.subscriptionCancelledAt ? format(new Date(ws.subscriptionCancelledAt), "MMM d, yyyy") : "—"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { icon: IconCreditCard, label: "Credits Balance", value: ws.creditsBalance.toLocaleString(), sub: `Lifetime: ${ws.lifetimeCredits.toLocaleString()}` },
                            { icon: IconClock, label: "Minutes Left", value: ws.minutesRemaining.toLocaleString(), sub: `of ${ws.minutesTotal.toLocaleString()} total` },
                            { icon: IconRefresh, label: "Minutes Used", value: ws.minutesUsed.toLocaleString(), sub: ws.minutesResetDate ? `Resets ${format(new Date(ws.minutesResetDate), "MMM d")}` : undefined },
                            { icon: IconVideo, label: "Content", value: ws.videoCount.toString(), sub: `${ws.clipCount} clips` },
                        ].map(({ icon: Icon, label, value, sub }) => (
                            <div key={label} className="bg-muted/40 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Icon className="h-3 w-3" /> {label}
                                </p>
                                <p className="text-lg font-bold mt-0.5 tabular-nums">{value}</p>
                                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                            </div>
                        ))}
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
    const { data: videosData, isLoading: videosLoading } = useAdminUserVideos(id, videoPage, 20);
    const { data: clipsData, isLoading: clipsLoading } = useAdminUserClips(id, 1, 200);
    const { data: workspacesData, isLoading: workspacesLoading } = useAdminUserWorkspaces(id);

    const allClips = clipsData?.clips ?? [];
    const videos = videosData?.videos ?? [];

    const totalClips = clipsData?.total ?? 0;
    const readyClips = allClips.filter((c) => c.status === "ready").length;
    const failedClips = allClips.filter((c) => c.status === "failed").length;
    const failedVideos = videos.filter((v) => v.status === "failed").length;

    return (
        <div className="space-y-5 max-w-7xl mx-auto">
            {/* Back */}
            <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                    <IconArrowLeft className="h-4 w-4" />
                    Back to Users
                </Button>
            </Link>

            {/* User Profile Card */}
            <Card>
                <CardContent className="pt-5">
                    {userLoading ? (
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                    ) : user ? (
                        <div className="flex flex-col sm:flex-row gap-5">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback className="text-2xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-xl font-semibold">{user.name || "Unknown"}</h2>
                                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role || "user"}</Badge>
                                        {user.emailVerified && <Badge variant="outline" className="text-xs gap-1"><IconCheck className="h-3 w-3" />Verified</Badge>}
                                        {user.twoFactorEnabled && <Badge variant="outline" className="text-xs">2FA</Badge>}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <IconMail className="h-3.5 w-3.5" /> {user.email}
                                    </div>
                                    {user.username && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <IconAt className="h-3.5 w-3.5" /> {user.username}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 sm:ml-auto text-sm text-muted-foreground">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Videos", value: videosData?.total, icon: IconVideo, color: "" },
                    { label: "Total Clips", value: totalClips, icon: IconScissors, color: "" },
                    { label: "Ready Clips", value: readyClips, icon: IconCheck, color: "text-emerald-600" },
                    { label: "Failed Clips", value: failedClips, icon: IconAlertTriangle, color: "text-red-600" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className={failedClips > 0 && label === "Failed Clips" ? "border-red-200 dark:border-red-900" : ""}>
                        <CardContent className="pt-4 pb-4">
                            <div className={`text-2xl font-bold tabular-nums ${color}`}>{value ?? "—"}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Failed clips alert */}
            {!clipsLoading && <FailedClipsAlert clips={allClips} />}

            {/* Tabs for Workspaces / Videos */}
            <Tabs defaultValue="workspaces">
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="workspaces" className="flex-1 sm:flex-none gap-1.5">
                        <IconBuildingStore className="h-4 w-4" />
                        Workspaces
                        {workspacesData && <Badge variant="secondary" className="ml-1 text-xs">{workspacesData.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="flex-1 sm:flex-none gap-1.5">
                        <IconVideo className="h-4 w-4" />
                        Videos
                        {videosData?.total != null && <Badge variant="secondary" className="ml-1 text-xs">{videosData.total}</Badge>}
                        {failedVideos > 0 && <Badge className="ml-1 bg-red-600 text-white text-xs">{failedVideos} failed</Badge>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="workspaces" className="mt-4">
                    <Card>
                        <CardContent className="pt-5">
                            {workspacesLoading ? (
                                <div className="space-y-3">
                                    {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                                </div>
                            ) : (
                                <WorkspacesSection workspaces={workspacesData ?? []} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="videos" className="mt-4">
                    <Card>
                        <CardContent className="pt-5">
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
                                        Click a row to expand and see clips. Failed clips are highlighted in red.
                                    </p>
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
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
                                    </div>

                                    {videosData && videosData.totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <span className="text-sm text-muted-foreground">
                                                Page {videosData.page} of {videosData.totalPages}
                                            </span>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm"
                                                    onClick={() => setVideoPage((p) => Math.max(1, p - 1))}
                                                    disabled={videoPage === 1}>
                                                    <IconChevronLeft className="h-4 w-4" /> Previous
                                                </Button>
                                                <Button variant="outline" size="sm"
                                                    onClick={() => setVideoPage((p) => Math.min(videosData.totalPages, p + 1))}
                                                    disabled={videoPage === videosData.totalPages}>
                                                    Next <IconChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
