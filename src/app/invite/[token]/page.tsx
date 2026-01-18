"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconX, IconUsers, IconAlertCircle } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvitationByToken, useAcceptInvitation, useDeclineInvitation } from "@/hooks/useWorkspace";
import { authClient } from "@/lib/auth-client";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();
    const { data: session, isPending: isSessionLoading } = authClient.useSession();
    const { data: invitation, isLoading, error } = useInvitationByToken(token);
    const acceptInvitation = useAcceptInvitation();
    const declineInvitation = useDeclineInvitation();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isSessionLoading && !session) {
            router.push(`/login?redirect=/invite/${token}`);
        }
    }, [session, isSessionLoading, router, token]);

    const handleAccept = async () => {
        const result = await acceptInvitation.mutateAsync(token);
        if (result.workspace?.slug) {
            router.push(`/${result.workspace.slug}`);
        } else {
            router.push("/workspaces");
        }
    };

    const handleDecline = async () => {
        await declineInvitation.mutateAsync(token);
        router.push("/workspaces");
    };

    if (isSessionLoading || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <Skeleton className="mx-auto size-16 rounded-full" />
                        <Skeleton className="mx-auto mt-4 h-6 w-48" />
                        <Skeleton className="mx-auto mt-2 h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (error || !invitation) {
        const errorMessage = (error as any)?.response?.data?.error || "This invitation is invalid or has expired.";

        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
                            <IconAlertCircle className="size-8 text-destructive" />
                        </div>
                        <CardTitle className="mt-4">Invalid Invitation</CardTitle>
                        <CardDescription>{errorMessage}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => router.push("/workspaces")}>
                            Go to Workspaces
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Check if the logged-in user's email matches the invitation
    const emailMismatch = session?.user?.email?.toLowerCase() !== invitation.email.toLowerCase();

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto">
                        {invitation.workspace.logo ? (
                            <Avatar className="size-16">
                                <AvatarImage src={invitation.workspace.logo} alt={invitation.workspace.name} />
                                <AvatarFallback className="text-2xl">
                                    {invitation.workspace.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <IconUsers className="size-8 text-primary" />
                            </div>
                        )}
                    </div>
                    <CardTitle className="mt-4">Join {invitation.workspace.name}</CardTitle>
                    <CardDescription>
                        {invitation.inviter.name} has invited you to join as a <strong className="capitalize">{invitation.role}</strong>
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {emailMismatch ? (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                            <p className="text-sm text-destructive">
                                This invitation was sent to <strong>{invitation.email}</strong>, but you're logged in as <strong>{session?.user?.email}</strong>.
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Please log in with the correct email address to accept this invitation.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-lg border bg-muted/50 p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                You'll be able to access all workspace resources and collaborate with the team.
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex gap-3">
                    {emailMismatch ? (
                        <>
                            <Button variant="outline" className="flex-1" onClick={() => router.push("/workspaces")}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={() => router.push(`/login?redirect=/invite/${token}`)}>
                                Switch Account
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleDecline}
                                disabled={declineInvitation.isPending || acceptInvitation.isPending}
                                loading={declineInvitation.isPending}
                            >
                                <IconX className="size-4 mr-2" />
                                Decline
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleAccept}
                                disabled={acceptInvitation.isPending || declineInvitation.isPending}
                                loading={acceptInvitation.isPending}
                            >
                                <IconCheck className="size-4 mr-2" />
                                Accept
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
