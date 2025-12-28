"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChangePassword } from "./change-password";

export function SecuritySettings() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-medium text-xl">Security</h1>
      </div>
      <Card className="p-6 sm:p-6">
        <CardContent className="flex flex-col gap-6">
          <ChangePassword />
        </CardContent>
      </Card>
    </div>
  );
}
