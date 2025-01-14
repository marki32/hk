# Deployment Checklist

## Before Deploying
- [x] Local yt-dlp working
- [x] Video quality selection working
- [x] Download working with correct formats

## Vercel Setup
1. **Dependencies**
   - [x] yt-dlp installed in `.vercel/bin`
   - [x] ffmpeg installed
   - [x] Proper permissions set

2. **Configuration**
   - [x] maxDuration set to 300s for longer downloads
   - [x] memory set to 1024MB
   - [x] PYTHONPATH set correctly

3. **File Paths**
   - [x] Using correct yt-dlp path in production
   - [x] Temp file handling works in Vercel
   - [x] File cleanup working

## Common Issues & Solutions
1. **yt-dlp Not Found**
   - Check `.vercel/bin/yt-dlp` exists
   - Verify permissions (chmod a+rx)
   - Test with `yt-dlp --version`

2. **Download Fails**
   - Check ffmpeg installation
   - Verify format IDs work
   - Check temp directory permissions

3. **Timeout Issues**
   - maxDuration set to 300s
   - Using efficient format selection
   - Proper error handling

## Testing Steps
1. Deploy to Vercel
2. Test video info retrieval
3. Test each quality option
4. Verify download works
5. Check file cleanup
