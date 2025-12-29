type LogLevel = "error" | "warn" | "info" | "debug";

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    if (process.env.NODE_ENV === "production") {
      return error.message;
    }
    return error.toString();
  }
  return String(error);
}

function sanitizeObject(obj: unknown): string {
  if (typeof obj === "string") {
    return obj;
  }
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

export function safeLog(
  level: LogLevel,
  message: string,
  error?: unknown
): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (error !== undefined) {
    const sanitizedError = sanitizeError(error);
    if (isProduction) {
      console[level](message, sanitizedError);
    } else {
      console[level](message, error);
    }
  } else {
    console[level](message);
  }
}

export function safeError(message: string, error?: unknown): void {
  safeLog("error", message, error);
}

export function safeWarn(message: string, error?: unknown): void {
  safeLog("warn", message, error);
}

export function safeInfo(message: string, data?: unknown): void {
  if (data !== undefined) {
    const sanitized = sanitizeObject(data);
    console.info(message, sanitized);
  } else {
    console.info(message);
  }
}
