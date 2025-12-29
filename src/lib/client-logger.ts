export function safeClientError(message: string, error: unknown): void {
  if (process.env.NODE_ENV === "production") {
    console.error(message, "An error occurred");
  } else {
    console.error(message, error);
  }
}

export function devLog(message: string, data?: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    if (data !== undefined) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
}
