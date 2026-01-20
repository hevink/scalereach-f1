/**
 * Error Handling Utilities
 *
 * Centralized error handling for the ScaleReach Video Clipping Frontend.
 * Provides consistent error messages, logging, and retry functionality.
 *
 * @validates Requirements 30.1, 30.2, 30.3, 30.4, 30.5
 */

import { toast } from "sonner";

// ============================================================================
// Error Types
// ============================================================================

/**
 * API Error codes that can be returned from the backend
 */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

/**
 * Structured API error with code and message
 */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, string>;
  retryable: boolean;
}

/**
 * Form validation error for inline display
 * @validates Requirement 30.2
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Error context for better error messages
 */
export interface ErrorContext {
  operation?: string;
  resource?: string;
  resourceId?: string;
}

// ============================================================================
// Error Code Mapping
// ============================================================================

/**
 * HTTP status code to error code mapping
 */
const HTTP_STATUS_TO_ERROR_CODE: Record<number, ApiErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  429: "RATE_LIMITED",
  500: "SERVER_ERROR",
  502: "SERVER_ERROR",
  503: "SERVER_ERROR",
  504: "TIMEOUT",
};

/**
 * User-friendly error messages for each error code
 * @validates Requirement 30.3
 */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: "Please sign in to continue",
  FORBIDDEN: "You don't have permission to perform this action",
  NOT_FOUND: "The requested resource was not found",
  VALIDATION_ERROR: "Please check your input and try again",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again",
  SERVER_ERROR: "Something went wrong on our end. Please try again later",
  NETWORK_ERROR: "Unable to connect. Please check your internet connection",
  TIMEOUT: "The request timed out. Please try again",
  UNKNOWN: "An unexpected error occurred. Please try again",
};

/**
 * Determines if an error is retryable
 */
const RETRYABLE_ERRORS = new Set<ApiErrorCode>([
  "NETWORK_ERROR",
  "TIMEOUT",
  "SERVER_ERROR",
  "RATE_LIMITED",
]);

// ============================================================================
// Error Parsing Functions
// ============================================================================

/**
 * Parse an error into a structured ApiError
 * @validates Requirement 30.5 - Logs errors to console
 */
export function parseError(error: unknown, context?: ErrorContext): ApiError {
  // Log the raw error for debugging
  console.error("[API Error]", {
    error,
    context,
    timestamp: new Date().toISOString(),
  });

  // Handle Axios errors
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    // Network error (no response)
    if (!error.response) {
      return {
        code: "NETWORK_ERROR",
        message: ERROR_MESSAGES.NETWORK_ERROR,
        retryable: true,
      };
    }

    // Map status code to error code
    const code = status ? HTTP_STATUS_TO_ERROR_CODE[status] || "UNKNOWN" : "UNKNOWN";

    // Extract message from response
    const message =
      data?.message ||
      data?.error ||
      error.message ||
      ERROR_MESSAGES[code];

    // Extract validation details if present
    const details = data?.details || data?.errors;

    return {
      code,
      message,
      details,
      retryable: RETRYABLE_ERRORS.has(code),
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for network-related errors
    if (
      error.message.includes("Network Error") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("net::ERR")
    ) {
      return {
        code: "NETWORK_ERROR",
        message: ERROR_MESSAGES.NETWORK_ERROR,
        retryable: true,
      };
    }

    // Check for timeout errors
    if (
      error.message.includes("timeout") ||
      error.message.includes("ETIMEDOUT")
    ) {
      return {
        code: "TIMEOUT",
        message: ERROR_MESSAGES.TIMEOUT,
        retryable: true,
      };
    }

    return {
      code: "UNKNOWN",
      message: error.message || ERROR_MESSAGES.UNKNOWN,
      retryable: false,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      code: "UNKNOWN",
      message: error,
      retryable: false,
    };
  }

  // Unknown error type
  return {
    code: "UNKNOWN",
    message: ERROR_MESSAGES.UNKNOWN,
    retryable: false,
  };
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is {
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string;
      details?: Record<string, string>;
      errors?: Record<string, string>;
    };
  };
  message: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    (("response" in error) || ("request" in error))
  );
}

// ============================================================================
// Error Display Functions
// ============================================================================

/**
 * Show a toast notification for an API error
 * @validates Requirement 30.1 - Toast notifications for API errors
 */
export function showErrorToast(
  error: unknown,
  context?: ErrorContext & { onRetry?: () => void }
): void {
  const apiError = parseError(error, context);

  // Build the title based on context
  let title = "Error";
  if (context?.operation) {
    title = `Failed to ${context.operation}`;
  }

  // Show toast with optional retry action
  if (apiError.retryable && context?.onRetry) {
    toast.error(title, {
      description: apiError.message,
      action: {
        label: "Retry",
        onClick: context.onRetry,
      },
    });
  } else {
    toast.error(title, {
      description: apiError.message,
    });
  }
}

/**
 * Show a success toast notification
 */
export function showSuccessToast(
  title: string,
  description?: string
): void {
  toast.success(title, {
    description,
  });
}

/**
 * Show a warning toast notification
 */
export function showWarningToast(
  title: string,
  description?: string
): void {
  toast.warning(title, {
    description,
  });
}

/**
 * Show an info toast notification
 */
export function showInfoToast(
  title: string,
  description?: string
): void {
  toast.info(title, {
    description,
  });
}

// ============================================================================
// Validation Error Functions
// ============================================================================

/**
 * Parse validation errors from API response
 * @validates Requirement 30.2 - Inline validation errors
 */
export function parseValidationErrors(
  error: unknown
): ValidationError[] {
  const apiError = parseError(error);

  if (apiError.code !== "VALIDATION_ERROR" || !apiError.details) {
    return [];
  }

  return Object.entries(apiError.details).map(([field, message]) => ({
    field,
    message,
  }));
}

/**
 * Get a user-friendly error message
 * @validates Requirement 30.3 - User-friendly and actionable messages
 */
export function getErrorMessage(
  error: unknown,
  fallback = "An error occurred"
): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  const apiError = parseError(error);
  return apiError.message || fallback;
}

// ============================================================================
// Retry Utilities
// ============================================================================

/**
 * Options for retry functionality
 * @validates Requirement 30.4 - Retry options for recoverable errors
 */
export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Execute a function with automatic retry on failure
 * @validates Requirement 30.4 - Retry options for recoverable errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    shouldRetry = (error) => parseError(error).retryable,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Log retry attempt
      console.warn(`[Retry] Attempt ${attempt}/${maxRetries} failed:`, error);

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(error)) {
        onRetry?.(attempt);

        // Wait before retrying with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError;
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log an error to the console with context
 * @validates Requirement 30.5 - Log errors to console
 */
export function logError(
  error: unknown,
  context?: ErrorContext & { component?: string }
): void {
  const apiError = parseError(error, context);

  console.error("[Error]", {
    code: apiError.code,
    message: apiError.message,
    details: apiError.details,
    retryable: apiError.retryable,
    context,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

/**
 * Log a warning to the console
 */
export function logWarning(message: string, data?: unknown): void {
  console.warn("[Warning]", message, data);
}

/**
 * Log debug information (only in development)
 */
export function logDebug(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Debug]", message, data);
  }
}
