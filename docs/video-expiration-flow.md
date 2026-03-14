# Video Expiration Flow

## Overview

Videos in ScaleReach have a limited storage lifetime based on the user's workspace plan. When a video expires, it is automatically cleaned up — all associated files (video, audio, thumbnails, clips, exports, dubbing) are deleted from R2 storage and the database records are removed.

---

## Expiration Duration by Plan

| Plan     | Storage Duration | Notes                  |
| -------- | ---------------- | ---------------------- |
| Free     | 14 days          | One-time 50 minutes    |
| Starter  | 90 days (3 mo)   | Monthly 200 minutes    |
| Pro      | 180 days (6 mo)  | Monthly 400 minutes    |
| Agency   | 180 days (6 mo)  | Monthly 5,000 minutes  |

The expiration date is calculated at video creation time using `getVideoExpiryDate(plan)` from `plan-config.ts`.

---

## How `expiresAt` Gets Set

When a video is created (via upload, YouTube import, or URL), the controller calls:

```ts
expiresAt: getVideoExpiryDate(workspace?.plan || "free")
```

This sets `expiresAt = now + storageDuration` (in seconds) based on the plan. The value is stored in the `video.expires_at` column (nullable timestamp, indexed).

Entry points that set expiration:
- `upload.controller.ts` — direct file upload
- `uppy-upload.controller.ts` — Uppy chunked upload
- `video.controller.ts` — YouTube URL import

---

## What Happens When a Video Expires

### 1. Storage Cleanup Job (`storage-cleanup.job.ts`)

A background job runs every 24 hours that finds and deletes expired videos:

- Queries all videos where `expiresAt <= now`
- Processes in batches of 20 to avoid memory spikes
- For each expired video, it:
  1. Collects all R2 storage keys (video file, audio, thumbnail)
  2. Collects all associated clip R2 keys (rendered clip, raw clip, clip thumbnail)
  3. Collects all export R2 keys
  4. Collects all dubbing/dubbed clip audio R2 keys
  5. Deletes all R2 files (best-effort, continues if some are already gone)
  6. Deletes the video DB record (cascades to clips, exports, dubbings via foreign keys)
- Errors on individual videos don't abort the batch — it continues with the next video

**Schedule:**
- Runs 30 seconds after server startup
- Then repeats every 24 hours

### 2. What Gets Deleted

| Asset                | Storage     | Deletion Method              |
| -------------------- | ----------- | ---------------------------- |
| Video file           | R2          | `R2Service.deleteFile()`     |
| Audio file           | R2          | `R2Service.deleteFile()`     |
| Video thumbnail      | R2          | `R2Service.deleteFile()`     |
| Clip files (rendered + raw) | R2  | `R2Service.deleteFile()`     |
| Clip thumbnails      | R2          | `R2Service.deleteFile()`     |
| Export files         | R2          | `R2Service.deleteFile()`     |
| Dubbing audio        | R2          | `R2Service.deleteFile()`     |
| Dubbed clip audio    | R2          | `R2Service.deleteFile()`     |
| Video DB record      | PostgreSQL  | Cascade delete               |
| Clip DB records      | PostgreSQL  | Cascade delete               |
| Export DB records    | PostgreSQL  | Cascade delete               |
| Dubbing DB records   | PostgreSQL  | Cascade delete               |

### 3. Access After Expiration

There is **no real-time access check** on the `getVideoById` endpoint — it does not reject requests for expired videos. Instead, the video simply disappears once the cleanup job runs. Between expiration time and the next cleanup run (up to 24 hours), the video may still be accessible.

---

## Export Expiration (Separate)

Exported clips have their own expiration, separate from the video:
- Exports expire **24 hours** after completion
- The frontend shows a countdown like "23h 45m remaining" or "Expired"
- This is displayed in the `ExportProgress` component

---

## Frontend Display

- **Video card**: Shows the expiration date in the video metadata (e.g., "Expires: Mar 26")
- **Export progress**: Shows a live countdown timer for export download availability

---

## Manual Deletion

Users can also manually delete videos at any time via `DELETE /api/videos/:id`. This follows the same cleanup logic:
1. Verifies workspace membership or ownership
2. Deletes all R2 files (video, clips, exports, dubbing)
3. Removes pending processing/clip generation jobs from the queue
4. Deletes the video DB record (cascades)

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `scalereach-tmkoc/src/config/plan-config.ts` | Plan storage durations + `getVideoExpiryDate()` |
| `scalereach-tmkoc/src/jobs/storage-cleanup.job.ts` | Daily cleanup job |
| `scalereach-tmkoc/src/controllers/video.controller.ts` | Manual delete + YouTube import expiry |
| `scalereach-tmkoc/src/controllers/upload.controller.ts` | Upload expiry setting |
| `scalereach-tmkoc/src/controllers/uppy-upload.controller.ts` | Uppy upload expiry setting |
| `scalereach-tmkoc/src/db/schema/project.schema.ts` | `video` table schema with `expiresAt` column |
| `scalereach-f1/src/components/video/video-card.tsx` | Frontend expiry display |
| `scalereach-f1/src/components/export/export-progress.tsx` | Export countdown display |
