#!/bin/bash

# Make the script executable even if Windows changed line endings
if [ "$(uname)" == "Linux" ]; then
  # Only run these commands on Linux (Vercel)
  
  echo "Downloading yt-dlp..."
  
  # Create bin directory
  mkdir -p .vercel/bin
  
  # Download yt-dlp
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o .vercel/bin/yt-dlp
  
  # Make it executable
  chmod a+rx .vercel/bin/yt-dlp
  
  echo "yt-dlp installed successfully"
fi

# Run next build
next build
