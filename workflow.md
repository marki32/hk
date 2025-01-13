# YouTube Downloader Workflow

## Overview
This document explains how the YouTube downloader works, including the API routes and video format handling.

## Components

### 1. Video Info Route (`/app/api/video-info/route.ts`)

When user pastes a YouTube URL:

```typescript
// Get video info using yt-dlp
yt-dlp --dump-json [URL]
```

Returns:
- Video title
- Thumbnail
- Duration
- Available quality options:

| Quality | Format ID | Label |
|---------|-----------|-------|
| 2160p | 313+140 | 4K Ultra HD |
| 1440p | 271+140 | 2K Quad HD |
| 1080p | 137+140 | Full HD |
| 720p | 22 | HD |
| 480p | 135+140 | SD |
| 360p | 18 | 360p |

Format ID explanation:
- Numbers like `313`, `271`, `137` = Video streams
- `140` = Audio stream
- `22` and `18` = Combined video+audio streams
- `+` means combine video and audio

### 2. Download Route (`/app/api/download/route.ts`)

When user clicks download:

1. Create temp file:
```typescript
const tempFile = join(tmpdir(), `${Date.now()}.mp4`)
```

2. Download using yt-dlp:
```bash
yt-dlp [URL] -f [format_id] --merge-output-format mp4 -o [tempFile]
```

3. Stream to browser:
- Read temp file
- Set headers for MP4 download
- Stream file content
- Delete temp file after download

## Why This Works

1. **No 403 Errors**
   - Downloads to temp file first
   - Then streams from local file
   - Avoids direct streaming issues

2. **Quality Selection**
   - Uses exact format IDs
   - Combines video+audio when needed
   - Falls back to best available if format unavailable

3. **Clean Downloads**
   - Waits for download to complete
   - Proper MP4 merging
   - Automatic cleanup of temp files

## Format ID Details

- **4K (2160p)**: `313+140`
  - 313 = 4K video stream
  - 140 = High quality audio

- **2K (1440p)**: `271+140`
  - 271 = 2K video stream
  - 140 = High quality audio

- **1080p**: `137+140`
  - 137 = 1080p video stream
  - 140 = High quality audio

- **720p**: `22`
  - Already includes both video and audio

- **480p**: `135+140`
  - 135 = 480p video stream
  - 140 = High quality audio

- **360p**: `18`
  - Already includes both video and audio

## Error Handling

1. **Video Info Errors**
   - Invalid URL handling
   - Parse errors for JSON data
   - Missing video errors

2. **Download Errors**
   - Format unavailable fallback
   - Temp file cleanup
   - Stream errors

## Dependencies

- yt-dlp: For video info and downloading
- ffmpeg: For merging video and audio (used by yt-dlp)
