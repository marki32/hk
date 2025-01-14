#!/bin/bash

# Create bin directory
mkdir -p .vercel/bin

# Download yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o .vercel/bin/yt-dlp

# Make it executable
chmod a+rx .vercel/bin/yt-dlp

# Install ffmpeg if needed
which ffmpeg || (apt-get update && apt-get install -y ffmpeg)
