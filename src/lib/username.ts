/**
 * Generates a username from a name
 * Format: firstname_lastname_123456 (6 random digits)
 * Example: "Preet Suthar" -> "preet_suthar_123456"
 */
export function generateUsername(name: string): string {
  // Convert to lowercase and replace spaces with underscores
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, "") // Remove special characters, keep only letters, numbers, and underscores
    .replace(/_+/g, "_") // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

  // Generate 6 random digits
  const randomDigits = Math.floor(100_000 + Math.random() * 900_000).toString();

  return `${normalized}_${randomDigits}`;
}

const USERNAME_STARTS_WITH_LETTER = /^[a-z]/;
const USERNAME_VALID_CHARS = /^[a-z0-9_]+$/;

/**
 * Validates username format
 * Rules:
 * - 3-30 characters
 * - Only lowercase letters, numbers, and underscores
 * - Must start with a letter
 * - Cannot end with underscore
 */
export function validateUsernameFormat(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username || username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (username.length > 30) {
    return { valid: false, error: "Username must be 30 characters or less" };
  }

  if (!USERNAME_STARTS_WITH_LETTER.test(username)) {
    return { valid: false, error: "Username must start with a letter" };
  }

  if (!USERNAME_VALID_CHARS.test(username)) {
    return {
      valid: false,
      error:
        "Username can only contain lowercase letters, numbers, and underscores",
    };
  }

  if (username.endsWith("_")) {
    return { valid: false, error: "Username cannot end with an underscore" };
  }

  if (username.includes("__")) {
    return {
      valid: false,
      error: "Username cannot contain consecutive underscores",
    };
  }

  return { valid: true };
}
