"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmojiSelector } from "@/components/ui/emoji-selector";
import { safeClientError } from "@/lib/client-logger";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess: () => void;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: CreateTeamDialogProps) {
  const [teamName, setTeamName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  const resetForm = () => {
    setTeamName("");
    setIdentifier("");
    setIcon(null);
    setNameError(null);
    setIdentifierError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleIdentifierChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setIdentifier(upperValue);
    setIdentifierError(null);
  };

  const handleNameChange = (value: string) => {
    setTeamName(value);
    setNameError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!teamName.trim()) {
      setNameError("Team name is required");
      isValid = false;
    } else if (teamName.length > 50) {
      setNameError("Team name must be 50 characters or less");
      isValid = false;
    }

    if (identifier) {
      if (identifier.length > 10) {
        setIdentifierError("Identifier must be 10 characters or less");
        isValid = false;
      } else if (!/^[A-Z0-9]+$/.test(identifier)) {
        setIdentifierError(
          "Identifier can only contain uppercase letters and numbers"
        );
        isValid = false;
      }
    }

    if (!isValid) {
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName.trim(),
          identifier: identifier.trim() || null,
          icon: icon,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.error) {
          setIdentifierError(data.error);
          toast.error(data.error);
        } else {
          toast.error(data.error || "Failed to create team");
        }
        return;
      }

      toast.success("Team created successfully");
      handleOpenChange(false);
      onSuccess();
    } catch (error) {
      safeClientError("Error creating team:", error);
      toast.error("Failed to create team");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new team</DialogTitle>
          <DialogDescription>
            Create a new team to manage separate cycles, workflows and
            notifications
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="flex flex-col gap-6 p-0">
            <div className="flex w-full items-center justify-between">
              <Label className="font-medium text-sm" htmlFor="team-icon">
                Team icon
              </Label>
              <div>
                <EmojiSelector
                  value={icon}
                  onEmojiSelect={setIcon}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="flex w-full flex-col items-start">
              <Label
                className="font-medium text-sm"
                htmlFor="team-name"
              >
                Team name
              </Label>
              <div className="mt-2 w-full">
                <Input
                  id="team-name"
                  aria-describedby={nameError ? "team-name-error" : "team-name-helper"}
                  aria-invalid={nameError ? "true" : "false"}
                  className="h-9 w-full"
                  disabled={isCreating}
                  maxLength={50}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Engineering"
                  value={teamName}
                />
                {nameError ? (
                  <p
                    className="mt-2 text-destructive text-xs"
                    id="team-name-error"
                    role="alert"
                  >
                    {nameError}
                  </p>
                ) : (
                  <p
                    className="mt-2 text-muted-foreground text-xs"
                    id="team-name-helper"
                  >
                    Enter a name for your team
                  </p>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col items-start">
              <Label
                className="font-medium text-sm"
                htmlFor="team-identifier"
              >
                Identifier
              </Label>
              <div className="mt-2 w-full">
                <Input
                  id="team-identifier"
                  aria-describedby={
                    identifierError
                      ? "team-identifier-error"
                      : "team-identifier-helper"
                  }
                  aria-invalid={identifierError ? "true" : "false"}
                  className="h-9 w-full"
                  disabled={isCreating}
                  maxLength={10}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  placeholder="e.g. ENG"
                  value={identifier}
                />
                {identifierError ? (
                  <p
                    className="mt-2 text-destructive text-xs"
                    id="team-identifier-error"
                    role="alert"
                  >
                    {identifierError}
                  </p>
                ) : (
                  <p
                    className="mt-2 text-muted-foreground text-xs"
                    id="team-identifier-helper"
                  >
                    Used to identify issues from this team (e.g. ENG-123)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={isCreating}>
            Create team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
