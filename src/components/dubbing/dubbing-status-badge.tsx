"use client";

import {
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconWaveSquare,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

interface DubbingStatusBadgeProps {
  status: string;
  progress?: number;
}

export function DubbingStatusBadge({ status, progress }: DubbingStatusBadgeProps) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          <IconCheck className="size-3" />
          Dubbed
        </Badge>
      );
    case "generating_tts":
      return (
        <Badge variant="secondary" className="gap-1">
          <IconLoader2 className="size-3 animate-spin" />
          Generating TTS{progress ? ` ${progress}%` : ""}
        </Badge>
      );
    case "mixing_audio":
      return (
        <Badge variant="secondary" className="gap-1">
          <IconWaveSquare className="size-3 animate-pulse" />
          Mixing{progress ? ` ${progress}%` : ""}
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <IconClock className="size-3" />
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <IconAlertCircle className="size-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
