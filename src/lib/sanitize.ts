export function sanitizeText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input.replace(/<[^>]*>/g, "");

  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  sanitized = sanitized.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);

  return sanitized;
}

export function sanitizeForStorage(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input.replace(/<[^>]*>/g, "");

  // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally removing control characters for security
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  sanitized = sanitized.trim();

  return sanitized;
}

export function sanitizeWorkspaceName(name: unknown): string | null {
  if (typeof name !== "string") {
    return null;
  }

  const sanitized = sanitizeForStorage(name);

  if (sanitized.length === 0 || sanitized.length > 50) {
    return null;
  }

  return sanitized;
}

export function sanitizeWorkspaceDescription(
  description: unknown
): string | null {
  if (description === null || description === undefined) {
    return null;
  }

  if (typeof description !== "string") {
    return null;
  }

  const sanitized = sanitizeForStorage(description);

  if (sanitized.length > 500) {
    return null;
  }

  return sanitized.length > 0 ? sanitized : null;
}
