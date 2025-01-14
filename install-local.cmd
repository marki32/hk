@echo off
echo Installing yt-dlp for local development...

REM Create bin directory if it doesn't exist
mkdir bin 2>nul

REM Download yt-dlp
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o bin\yt-dlp.exe

echo yt-dlp installed successfully!
