import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar/sidebar";
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
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
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
        </div>
      </main>
    </div>
  );
}
