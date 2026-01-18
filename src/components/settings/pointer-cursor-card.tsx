"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useUserPreferences, useUpdatePreferences } from "@/hooks/useUser";

export function PointerCursorCard() {
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreferences = useUpdatePreferences();
  const [usePointerCursors, setUsePointerCursors] = useState(false);

  // Sync local state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setUsePointerCursors(preferences.usePointerCursors ?? false);
    }
  }, [preferences]);

  const handleToggle = (checked: boolean) => {
    const previousValue = usePointerCursors;
    setUsePointerCursors(checked);

    if (checked) {
      document.body.setAttribute("data-pointer-cursors", "true");
    } else {
      document.body.removeAttribute("data-pointer-cursors");
    }

    updatePreferences.mutate(
      { usePointerCursors: checked },
      {
        onError: (error) => {
          setUsePointerCursors(previousValue);

          if (previousValue) {
            document.body.setAttribute("data-pointer-cursors", "true");
          } else {
            document.body.removeAttribute("data-pointer-cursors");
          }

          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update preference. Please try again."
          );
        },
      }
    );
  };

  useEffect(() => {
    if (!isLoading) {
      if (usePointerCursors) {
        document.body.setAttribute("data-pointer-cursors", "true");
      } else {
        document.body.removeAttribute("data-pointer-cursors");
      }
    }
  }, [usePointerCursors, isLoading]);

  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Customize your application preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="pointer-cursors" id="pointer-cursors-label">
                Use pointer cursors
              </Label>
              <p className="text-muted-foreground text-sm">
                Change the cursor to a pointer when hovering over any
                interactive elements.
              </p>
            </div>
            {isLoading ? (
              <Skeleton className="h-[18.4px] w-[30px]" />
            ) : (
              <Switch
                aria-describedby="pointer-cursors-label"
                aria-label="Use pointer cursors"
                checked={usePointerCursors}
                id="pointer-cursors"
                onCheckedChange={handleToggle}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
