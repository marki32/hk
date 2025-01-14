#!/bin/bash

# Make the script executable even if Windows changed line endings
if [ "$(uname)" == "Linux" ]; then
  # Only run these commands on Linux (Vercel)
  
  # Download yt-dlp
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp

  # Make it executable
  chmod a+rx yt-dlp

  # Create bin directory and move yt-dlp
  mkdir -p .vercel/bin
  mv yt-dlp .vercel/bin/

  # Install ffmpeg
  apt-get update && apt-get install -y ffmpeg
fi

# Run next build
next build
