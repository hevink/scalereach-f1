"use client";

import { useEffect } from "react";

interface WorkspaceTrackerProps {
  slug: string;
}

export function WorkspaceTracker({ slug }: WorkspaceTrackerProps) {
  useEffect(() => {
    if (slug) {
      localStorage.setItem("lastWorkspace", slug);
    }
  }, [slug]);

  return null;
}
