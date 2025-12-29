const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["jpeg", "jpg", "png", "gif", "webp"];
const MIME_TYPE_REGEX = /data:image\/([^;]+);base64,/;
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  value?: string | null;
  mimeType?: string;
  sizeBytes?: number;
}

export function validateBase64Image(
  base64String: string | null
): ImageValidationResult {
  if (base64String === null) {
    return { valid: true, value: null };
  }

  if (typeof base64String !== "string") {
    return { valid: false, error: "Image must be a string (base64) or null" };
  }

  if (!base64String.startsWith("data:image/")) {
    return {
      valid: false,
      error:
        "Invalid image format. Must be a base64 data URI starting with 'data:image/'",
    };
  }

  const mimeMatch = base64String.match(MIME_TYPE_REGEX);
  if (!mimeMatch) {
    return {
      valid: false,
      error: "Invalid base64 image format. Missing MIME type or base64 prefix",
    };
  }

  const mimeType = mimeMatch[1].toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported image type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  const base64Data = base64String.split(",")[1];
  if (!base64Data) {
    return {
      valid: false,
      error: "Invalid base64 format. Missing image data",
    };
  }

  if (!BASE64_REGEX.test(base64Data)) {
    return {
      valid: false,
      error: "Invalid base64 encoding",
    };
  }

  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);

  if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
    const maxSizeMB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);
    const actualSizeMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Image too large. Maximum size is ${maxSizeMB}MB. Your image is ${actualSizeMB}MB`,
      sizeBytes: sizeInBytes,
    };
  }

  if (sizeInBytes < 100) {
    return {
      valid: false,
      error: "Image too small. File may be corrupted",
      sizeBytes: sizeInBytes,
    };
  }

  return {
    valid: true,
    value: base64String,
    mimeType,
    sizeBytes: sizeInBytes,
  };
}
