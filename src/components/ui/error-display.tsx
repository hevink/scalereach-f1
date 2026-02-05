"use client";

import * as React from "react";
import {
    IconAlertTriangle,
    IconRefresh,
    IconWifi,
    IconLock,
    IconBan,
    IconSearch,
    IconClock,
    IconServer,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Error type for display purposes
 */
export type ErrorType =
    | "network"
    | "unauthorized"
    | "forbidden"
    | "not-found"
    | "timeout"
    | "server"
    | "validation"
    | "generic";

/**
 * ErrorDisplayProps interface
 * @validates Requirements 30.1, 30.3, 30.4
 */
export interface ErrorDisplayProps {
    /** Error type for icon and styling */
    type?: ErrorType;
    /** Error title */
    title?: string;
    /** Error description/message */
    description?: string;
    /** Callback for retry action */
    onRetry?: () => void;
    /** Whether retry is in progress */
    isRetrying?: boolean;
    /** Additional className */
    className?: string;
    /** Size variant */
    size?: "sm" | "md" | "lg";
}

/**
 * Configuration for each error type
 */
const ERROR_CONFIG: Record<
    ErrorType,
    {
        icon: typeof IconAlertTriangle;
        defaultTitle: string;
        defaultDescription: string;
        iconClassName: string;
    }
> = {
    network: {
        icon: IconWifi,
        defaultTitle: "Connection Error",
        defaultDescription:
            "Unable to connect to the server. Please check your internet connection and try again.",
        iconClassName: "text-amber-500",
    },
    unauthorized: {
        icon: IconLock,
        defaultTitle: "Authentication Required",
        defaultDescription: "Please sign in to access this content.",
        iconClassName: "text-amber-500",
    },
    forbidden: {
        icon: IconBan,
        defaultTitle: "Access Denied",
        defaultDescription: "You don't have permission to access this resource.",
        iconClassName: "text-destructive",
    },
    "not-found": {
        icon: IconSearch,
        defaultTitle: "Not Found",
        defaultDescription: "The requested resource could not be found.",
        iconClassName: "text-muted-foreground",
    },
    timeout: {
        icon: IconClock,
        defaultTitle: "Request Timeout",
        defaultDescription:
            "The request took too long to complete. Please try again.",
        iconClassName: "text-amber-500",
    },
    server: {
        icon: IconServer,
        defaultTitle: "Server Error",
        defaultDescription:
            "Something went wrong on our end. Please try again later.",
        iconClassName: "text-destructive",
    },
    validation: {
        icon: IconAlertTriangle,
        defaultTitle: "Validation Error",
        defaultDescription: "Please check your input and try again.",
        iconClassName: "text-amber-500",
    },
    generic: {
        icon: IconAlertTriangle,
        defaultTitle: "Something Went Wrong",
        defaultDescription: "An unexpected error occurred. Please try again.",
        iconClassName: "text-destructive",
    },
};

/**
 * Size configurations
 */
const SIZE_CONFIG = {
    sm: {
        container: "py-6",
        iconSize: "size-8",
        iconWrapper: "size-12",
        title: "text-sm",
        description: "text-xs",
        button: "h-8 text-xs",
    },
    md: {
        container: "py-8",
        iconSize: "size-10",
        iconWrapper: "size-16",
        title: "text-base",
        description: "text-sm",
        button: "h-9 text-sm",
    },
    lg: {
        container: "py-12",
        iconSize: "size-12",
        iconWrapper: "size-20",
        title: "text-lg",
        description: "text-base",
        button: "h-10",
    },
};

/**
 * ErrorDisplay Component
 *
 * A reusable error display component with:
 * - Type-specific icons and styling
 * - User-friendly error messages (Requirement 30.3)
 * - Retry button for recoverable errors (Requirement 30.4)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorDisplay
 *   type="network"
 *   onRetry={() => refetch()}
 * />
 *
 * // Custom message
 * <ErrorDisplay
 *   type="server"
 *   title="Failed to load clips"
 *   description="We couldn't load your clips. Please try again."
 *   onRetry={handleRetry}
 *   isRetrying={isLoading}
 * />
 * ```
 *
 * @validates Requirements 30.3, 30.4
 */
export function ErrorDisplay({
    type = "generic",
    title,
    description,
    onRetry,
    isRetrying = false,
    className,
    size = "md",
}: ErrorDisplayProps) {
    const config = ERROR_CONFIG[type];
    const sizeConfig = SIZE_CONFIG[size];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-4 text-center",
                sizeConfig.container,
                className
            )}
            role="alert"
            aria-live="polite"
        >
            {/* Icon */}
            <div
                className={cn(
                    "flex items-center justify-center rounded-full bg-muted",
                    sizeConfig.iconWrapper
                )}
            >
                <Icon className={cn(sizeConfig.iconSize, config.iconClassName)} />
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-1">
                <h3 className={cn("font-medium", sizeConfig.title)}>
                    {title || config.defaultTitle}
                </h3>
                <p
                    className={cn(
                        "max-w-md text-muted-foreground",
                        sizeConfig.description
                    )}
                >
                    {description || config.defaultDescription}
                </p>
            </div>

            {/* Retry Button - Requirement 30.4 */}
            {onRetry && (
                <Button
                    variant="outline"
                    onClick={onRetry}
                    disabled={isRetrying}
                    className={cn("gap-2", sizeConfig.button)}
                >
                    <IconRefresh
                        className={cn("size-4", isRetrying && "animate-spin")}
                    />
                    {isRetrying ? "Retrying..." : "Try Again"}
                </Button>
            )}
        </div>
    );
}

/**
 * InlineError Component
 *
 * A compact inline error message for form fields
 * @validates Requirement 30.2 - Inline validation errors
 */
export interface InlineErrorProps {
    /** Error message to display */
    message?: string | null;
    /** Additional className */
    className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
    if (!message) return null;

    return (
        <p
            className={cn(
                "flex items-center gap-1 text-destructive text-sm",
                className
            )}
            role="alert"
        >
            <IconAlertTriangle className="size-3.5 shrink-0" />
            <span>{message}</span>
        </p>
    );
}

/**
 * Determine error type from error object
 */
export function getErrorType(error: unknown): ErrorType {
    if (!error) return "generic";

    // Check for enhanced error with code
    if (typeof error === "object" && error !== null && "code" in error) {
        const code = (error as { code?: string }).code;
        switch (code) {
            case "NETWORK_ERROR":
                return "network";
            case "UNAUTHORIZED":
                return "unauthorized";
            case "FORBIDDEN":
                return "forbidden";
            case "NOT_FOUND":
                return "not-found";
            case "TIMEOUT":
                return "timeout";
            case "SERVER_ERROR":
                return "server";
            case "VALIDATION_ERROR":
                return "validation";
            default:
                return "generic";
        }
    }

    // Check for status code
    if (typeof error === "object" && error !== null && "status" in error) {
        const status = (error as { status?: number }).status;
        switch (status) {
            case 401:
                return "unauthorized";
            case 403:
                return "forbidden";
            case 404:
                return "not-found";
            case 408:
            case 504:
                return "timeout";
            case 500:
            case 502:
            case 503:
                return "server";
            default:
                return "generic";
        }
    }

    // Check error message for network issues
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
            message.includes("network") ||
            message.includes("fetch") ||
            message.includes("connection")
        ) {
            return "network";
        }
        if (message.includes("timeout")) {
            return "timeout";
        }
    }

    return "generic";
}

export default ErrorDisplay;
