@echo off

REM Download yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp.exe

REM Create .vercel/bin directory
mkdir .vercel\bin 2>nul

REM Move yt-dlp to .vercel/bin
move yt-dlp.exe .vercel\bin\

REM Run next build
next build
