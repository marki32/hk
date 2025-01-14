#!/bin/bash

# Make the script executable even if Windows changed line endings
if [ "$(uname)" == "Linux" ]; then
  # Only run these commands on Linux (Vercel)
  
  echo "Setting up yt-dlp and ffmpeg..."
  
  # Create bin directory
  mkdir -p .vercel/bin
  
  # Download yt-dlp
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o .vercel/bin/yt-dlp
  
  # Make it executable
  chmod a+rx .vercel/bin/yt-dlp
  
  # Install ffmpeg
  apt-get update && apt-get install -y ffmpeg
  
  echo "yt-dlp version:"
  .vercel/bin/yt-dlp --version
  
  echo "ffmpeg version:"
  ffmpeg -version
fi

# Run next build
next build
