#!/bin/bash

# Download yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp

# Make it executable
chmod a+rx yt-dlp

# Move to a directory in PATH
mkdir -p .vercel/bin
mv yt-dlp .vercel/bin/

# Install ffmpeg
apt-get update && apt-get install -y ffmpeg
