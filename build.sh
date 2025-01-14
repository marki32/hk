#!/bin/bash

echo "Starting build process..."

# Create bin directory
mkdir -p .vercel/bin
echo "Created .vercel/bin directory"

# Download yt-dlp
echo "Downloading yt-dlp..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o .vercel/bin/yt-dlp
echo "Download complete"

# Make it executable with full permissions
chmod 777 .vercel/bin/yt-dlp
echo "Set permissions for yt-dlp"

# Verify installation
echo "Verifying yt-dlp installation..."
ls -l .vercel/bin/yt-dlp
./.vercel/bin/yt-dlp --version

# Run next build
echo "Starting Next.js build..."
next build
