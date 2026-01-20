import axios, { type AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/**
 * Response interceptor for API calls
 * Handles error logging and message extraction
 * @validates Requirement 30.5 - Log errors to console for debugging
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string; details?: Record<string, string> }>) => {
    // Log the error for debugging (Requirement 30.5)
    console.error("[API Error]", {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      timestamp: new Date().toISOString(),
    });

    // Extract user-friendly error message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An error occurred";

    // Create enhanced error with additional context
    const enhancedError = new Error(message) as Error & {
      status?: number;
      code?: string;
      details?: Record<string, string>;
      retryable?: boolean;
    };

    // Attach additional error information
    enhancedError.status = error.response?.status;
    enhancedError.details = error.response?.data?.details;

    // Determine if error is retryable
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    enhancedError.retryable =
      !error.response || retryableStatuses.includes(error.response.status);

    // Set error code based on status
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          enhancedError.code = "VALIDATION_ERROR";
          break;
        case 401:
          enhancedError.code = "UNAUTHORIZED";
          break;
        case 403:
          enhancedError.code = "FORBIDDEN";
          break;
        case 404:
          enhancedError.code = "NOT_FOUND";
          break;
        case 429:
          enhancedError.code = "RATE_LIMITED";
          break;
        default:
          enhancedError.code = error.response.status >= 500 ? "SERVER_ERROR" : "UNKNOWN";
      }
    } else {
      enhancedError.code = "NETWORK_ERROR";
    }

    return Promise.reject(enhancedError);
  }
);
