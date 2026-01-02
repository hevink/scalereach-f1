import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ERRORS = {
  UNAUTHORIZED: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  NO_FILE: NextResponse.json({ error: "No file provided" }, { status: 400 }),
  INVALID_TYPE: NextResponse.json(
    {
      error: "Invalid file type. Please upload a JPG, PNG, WebP, or GIF image.",
    },
    { status: 400 }
  ),
  FILE_TOO_LARGE: NextResponse.json(
    { error: "File size must be less than 5MB" },
    { status: 400 }
  ),
  NOT_FOUND: NextResponse.json({ error: "User not found" }, { status: 404 }),
  SERVER_ERROR: NextResponse.json(
    { error: "Failed to upload avatar" },
    { status: 500 }
  ),
};

const SUCCESS_RESPONSE_OPTIONS = { status: 200 };

export async function POST(request: Request) {
  try {
    const [formData, session] = await Promise.all([
      request.formData(),
      auth.api.getSession({ headers: request.headers }),
    ]);

    if (!session?.user) {
      return ERRORS.UNAUTHORIZED;
    }

    const file = formData.get("avatar") as File | null;

    if (!file) {
      return ERRORS.NO_FILE;
    }

    const fileSize = file.size;

    if (fileSize > MAX_FILE_SIZE) {
      return ERRORS.FILE_TOO_LARGE;
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return ERRORS.INVALID_TYPE;
    }

    const [arrayBuffer, userId] = await Promise.all([
      file.arrayBuffer(),
      Promise.resolve(session.user.id),
    ]);

    const processedImage = await sharp(arrayBuffer)
      .resize(512, 512, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const dataUrl = `data:image/webp;base64,${processedImage.toString("base64")}`;

    const [updatedUser] = await db
      .update(user)
      .set({ image: dataUrl })
      .where(eq(user.id, userId))
      .returning({ image: user.image });

    if (!updatedUser) {
      return ERRORS.NOT_FOUND;
    }

    return NextResponse.json(
      { imageUrl: updatedUser.image },
      SUCCESS_RESPONSE_OPTIONS
    );
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return ERRORS.SERVER_ERROR;
  }
}
