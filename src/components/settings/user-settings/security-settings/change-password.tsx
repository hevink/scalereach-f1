"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    InputGroup,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .trim(),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from your current password",
        path: ["newPassword"],
    });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export function ChangePassword() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewAndConfirmPassword, setShowNewAndConfirmPassword] = useState(false);

    const form = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = form;

    const onSubmit = async (data: ChangePasswordFormData) => {
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/user/change-password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to change password");
            }

            toast.success("Password changed successfully");
            reset();
            router.refresh();
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error(
                error instanceof Error ? error.message : "Failed to change password"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleShowNewAndConfirmPassword = () => {
        setShowNewAndConfirmPassword((prev) => !prev);
    };

    return (
        <div className="flex w-full flex-col items-start gap-6">
            <Label className="font-medium text-base" htmlFor="current-password">
                Change password
            </Label>
            <form
                className="flex w-full flex-col gap-4"
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="flex w-full flex-col gap-2">
                    <Label
                        className="font-normal text-sm"
                        htmlFor="current-password"
                    >
                        Current password
                    </Label>
                    <InputGroup>
                        <InputGroupInput
                            autoComplete="current-password"
                            id="current-password"
                            {...register("currentPassword")}
                            aria-describedby={
                                errors.currentPassword ? "current-password-error" : undefined
                            }
                            aria-invalid={errors.currentPassword ? "true" : "false"}
                            disabled={isSubmitting}
                            placeholder="Enter your current password"
                            type={showCurrentPassword ? "text" : "password"}
                        />
                        <InputGroupButton
                            aria-label={
                                showCurrentPassword ? "Hide password" : "Show password"
                            }
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            tabIndex={-1}
                            type="button"
                            size={'icon-sm'}
                            variant="ghost"
                            className="hover:bg-transparent"
                        >
                            {showCurrentPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </InputGroupButton>
                    </InputGroup>
                    {errors.currentPassword && (
                        <p
                            className="mt-1 text-destructive text-xs"
                            id="current-password-error"
                            role="alert"
                        >
                            {errors.currentPassword.message}
                        </p>
                    )}
                </div>

                <div className="flex w-full flex-col gap-2">
                    <Label className="font-normal text-sm" htmlFor="new-password">
                        New password
                    </Label>
                    <InputGroup>
                        <InputGroupInput
                            autoComplete="new-password"
                            id="new-password"
                            {...register("newPassword")}
                            aria-describedby={
                                errors.newPassword ? "new-password-error" : undefined
                            }
                            aria-invalid={errors.newPassword ? "true" : "false"}
                            disabled={isSubmitting}
                            placeholder="Enter your new password"
                            type={showNewAndConfirmPassword ? "text" : "password"}
                        />
                        <InputGroupButton
                            aria-label={showNewAndConfirmPassword ? "Hide password" : "Show password"}
                            onClick={handleToggleShowNewAndConfirmPassword}
                            tabIndex={-1}
                            type="button"
                            size={'icon-sm'}
                            variant="ghost"
                            className="hover:bg-transparent"
                        >
                            {showNewAndConfirmPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </InputGroupButton>
                    </InputGroup>
                    {errors.newPassword && (
                        <p
                            className="mt-1 text-destructive text-xs"
                            id="new-password-error"
                            role="alert"
                        >
                            {errors.newPassword.message}
                        </p>
                    )}
                </div>

                <div className="flex w-full flex-col gap-2">
                    <Label
                        className="font-normal text-sm"
                        htmlFor="confirm-password"
                    >
                        Confirm new password
                    </Label>
                    <InputGroup>
                        <InputGroupInput
                            autoComplete="new-password"
                            id="confirm-password"
                            {...register("confirmPassword")}
                            aria-describedby={
                                errors.confirmPassword ? "confirm-password-error" : undefined
                            }
                            aria-invalid={errors.confirmPassword ? "true" : "false"}
                            disabled={isSubmitting}
                            placeholder="Confirm your new password"
                            type={showNewAndConfirmPassword ? "text" : "password"}
                        />
                        <InputGroupButton
                            aria-label={
                                showNewAndConfirmPassword ? "Hide password" : "Show password"
                            }
                            onClick={handleToggleShowNewAndConfirmPassword}
                            type="button"
                            size={'icon-sm'}
                            tabIndex={-1}
                            variant="ghost"
                            className="hover:bg-transparent"
                        >
                            {showNewAndConfirmPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </InputGroupButton>
                    </InputGroup>
                    {errors.confirmPassword && (
                        <p
                            className="mt-1 text-destructive text-xs"
                            id="confirm-password-error"
                            role="alert"
                        >
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end">
                    <Button
                        className="h-9"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner className="size-4" />
                            </>
                        ) : (
                            "Change password"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

