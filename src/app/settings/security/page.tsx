"use client";

import { useState, useCallback } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH
    ) {
      newErrors.newPassword = `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`;
    } else if (
      currentPassword.trim() &&
      newPassword.trim() === currentPassword.trim()
    ) {
      newErrors.newPassword = "New password must be different from your current password";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  }, [currentPassword, newPassword, confirmPassword]);

  const changePassword = useCallback(
    async (revokeOtherSessions: boolean) => {
      setIsLoading(true);
      setErrors({});

      try {
        const response = await fetch("/api/user/password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
            revokeOtherSessions,
          }),
        });

        let data;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          data = { error: "An error occurred. Please try again." };
        }

        if (!response.ok) {
          const errorMessage =
            data.error || "Failed to change password. Please try again.";
          
          toast.error(errorMessage);

          const errorLower = errorMessage.toLowerCase();
          if (
            errorLower.includes("incorrect") ||
            errorLower.includes("wrong") ||
            errorLower.includes("invalid password")
          ) {
            setErrors({ currentPassword: errorMessage });
            setTimeout(() => {
              const fieldElement = document.getElementById("currentPassword");
              fieldElement?.focus();
            }, 0);
          } else if (
            errorLower.includes("different") ||
            errorLower.includes("same password") ||
            (errorLower.includes("new password") && errorLower.includes("must be"))
          ) {
            setErrors({ newPassword: errorMessage });
            setTimeout(() => {
              const fieldElement = document.getElementById("newPassword");
              fieldElement?.focus();
            }, 0);
          } else if (errorLower.includes("password") && errorLower.includes("length")) {
            setErrors({ newPassword: errorMessage });
            setTimeout(() => {
              const fieldElement = document.getElementById("newPassword");
              fieldElement?.focus();
            }, 0);
          } else if (errorLower.includes("required")) {
            if (errorLower.includes("current")) {
              setErrors({ currentPassword: errorMessage });
            } else if (errorLower.includes("new")) {
              setErrors({ newPassword: errorMessage });
            }
          }
          return;
        }

        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
        setShowRevokeDialog(false);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [currentPassword, newPassword]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const validation = validateForm();
      if (!validation.isValid) {
        const firstErrorField = Object.keys(validation.errors)[0];
        if (firstErrorField) {
          setTimeout(() => {
            const fieldElement = document.getElementById(firstErrorField);
            fieldElement?.focus();
          }, 0);
        }
        return;
      }

      setShowRevokeDialog(true);
    },
    [validateForm]
  );

  const handleCurrentPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentPassword(e.target.value);
      if (errors.currentPassword) {
        setErrors((prev) => ({ ...prev, currentPassword: undefined }));
      }
    },
    [errors.currentPassword]
  );

  const handleNewPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setNewPassword(newValue);
      
      if (errors.newPassword) {
        const trimmedCurrent = currentPassword.trim();
        const trimmedNew = newValue.trim();
        if (trimmedNew !== trimmedCurrent || !trimmedCurrent) {
          setErrors((prev) => ({ ...prev, newPassword: undefined }));
        }
      }
      
      if (currentPassword.trim() && newValue.trim() === currentPassword.trim()) {
        setErrors((prev) => ({
          ...prev,
          newPassword: "New password must be different from your current password",
        }));
      }
      
      if (errors.confirmPassword && confirmPassword) {
        if (newValue === confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
        } else {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords do not match",
          }));
        }
      }
    },
    [currentPassword, confirmPassword, errors.newPassword, errors.confirmPassword]
  );

  const handleConfirmPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmPassword(e.target.value);
      if (errors.confirmPassword) {
        if (e.target.value === newPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
        } else {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: "Passwords do not match",
          }));
        }
      }
    },
    [newPassword, errors.confirmPassword]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-2xl">Security</h1>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="flex gap-0.5">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    className="flex-1"
                    value={currentPassword}
                    onChange={handleCurrentPasswordChange}
                    placeholder="Enter your current password…"
                    autoComplete="current-password"
                    disabled={isLoading}
                    aria-invalid={!!errors.currentPassword}
                    aria-describedby={
                      errors.currentPassword
                        ? "currentPassword-error"
                        : undefined
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={
                      showCurrentPassword ? "Hide password" : "Show password"
                    }
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <IconEyeOff className="size-4" />
                    ) : (
                      <IconEye className="size-4" />
                    )}
                  </Button>
                </div>
                {errors.currentPassword && (
                  <FieldError
                    id="currentPassword-error"
                    errors={[{ message: errors.currentPassword }]}
                  />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="flex gap-0.5">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    className="flex-1"
                    value={newPassword}
                    onChange={handleNewPasswordChange}
                    placeholder="Enter your new password…"
                    autoComplete="new-password"
                    disabled={isLoading}
                    aria-invalid={!!errors.newPassword}
                    aria-describedby={
                      errors.newPassword ? "newPassword-error" : undefined
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <IconEyeOff className="size-4" />
                    ) : (
                      <IconEye className="size-4" />
                    )}
                  </Button>
                </div>
                {errors.newPassword && (
                  <FieldError
                    id="newPassword-error"
                    errors={[{ message: errors.newPassword }]}
                  />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="flex gap-0.5">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="flex-1"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm your new password…"
                    autoComplete="new-password"
                    disabled={isLoading}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword
                        ? "confirmPassword-error"
                        : undefined
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <IconEyeOff className="size-4" />
                    ) : (
                      <IconEye className="size-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <FieldError
                    id="confirmPassword-error"
                    errors={[{ message: errors.confirmPassword }]}
                  />
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={isLoading} disabled={isLoading}>
                  Change Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out of Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to log out from all other devices and sessions? This will invalidate all active sessions except for this one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => changePassword(false)}
              disabled={isLoading}
            >
              Keep Me Logged In
            </Button>
            <AlertDialogAction
              onClick={() => changePassword(true)}
              disabled={isLoading}
            >
              Log Out of Other Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
