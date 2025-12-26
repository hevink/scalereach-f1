import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-border border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="font-semibold text-foreground text-lg">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {session.user.name}</CardTitle>
            <CardDescription>You are now signed in.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Start building your project management dashboard.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
