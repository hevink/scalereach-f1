# Text Overlays Implementation Plan

## Overview
Add text overlay support to the clip editor: a text track in the timeline (draggable/stretchable blocks), a settings panel in the right toolbar, and text rendering on the video canvas.

## New Files

### 1. `src/components/text-overlays/types.ts`
- `TextOverlayStyle` interface: fontFamily, fontSize, textColor, bold, italic, underline, alignment, backgroundColor, backgroundOpacity, borderRadius, widthPercent
- `TextOverlay` interface: id, text, startTime, endTime, x, y, style
- `DEFAULT_TEXT_OVERLAY_STYLE` constant
- `createTextOverlay(clipDuration, currentTime)` factory function

### 2. `src/hooks/useTextOverlays.ts`
- State hook managing `overlays[]` and `selectedOverlayId`
- Actions: addOverlay, removeOverlay, updateOverlay, updateOverlayStyle, duplicateOverlay
- Derived: selectedOverlay, getVisibleOverlays(time)

### 3. `src/components/clips/timeline/text-track.tsx`
- Renders colored blocks for each text overlay on the timeline
- Each block: positioned via timeToX, draggable to move in time, left/right edge handles to stretch
- Click to select, double-click empty area to add new overlay

### 4. `src/components/text-overlays/text-overlay-panel.tsx`
- Settings panel for the right toolbar (280px wide)
- "+ Add Text" button, overlay list, selected overlay settings
- Controls: text input, font family, font size, color, bold/italic/underline, alignment, background, border radius, width

### 5. `src/components/text-overlays/draggable-text-overlay.tsx`
- Draggable text element on the video canvas
- Only visible during overlay's time range
- Shows selection border when selected

## Modified Files

### 6. `timeline/types.ts`
- Add `"text"` to TrackType union
- Add `TEXT_TRACK_HEIGHT = 40`
- Add text track to DEFAULT_TRACKS
- Add text overlay props to AdvancedTimelineProps

### 7. `timeline/track-label.tsx`
- Add "text" entries to TRACK_ICONS, TRACK_NAMES, TRACK_COLORS

### 8. `timeline/timeline-container.tsx`
- Import TextTrack, find text track, render it, update totalTracksHeight
- Pass text overlay props through

### 9. `editor-toolbar.tsx`
- Enable "Text" button (remove disabled: true)
- Add textPanel prop, render it when activePanel === "text"

### 10. `editing-layout.tsx`
- Add textPanel to EditingLayoutProps.children
- Pass textPanel to EditorToolbar

### 11. `video-canvas-editor.tsx`
- Add textOverlays props
- Render DraggableTextOverlay for visible overlays

### 12. `clips/[id]/page.tsx`
- Use useTextOverlays hook
- Pass text overlay props to VideoCanvasEditor, AdvancedTimeline, and EditingLayout

### 13. `timeline/index.ts`
- Export TextTrack

## Verification
1. `bun run check` — zero new TypeScript errors
2. Click "Text" in toolbar → panel opens with "+ Add Text"
3. Add text → block appears in timeline, text appears on video
4. Drag block edges to change timing
5. Edit text settings in panel → updates live on video
6. Drag text on video canvas to reposition
