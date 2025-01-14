@echo off

IF "%VERCEL_ENV%"=="" (
    REM Local Windows build
    echo Running local Windows build...

    REM Create bin directory if it doesn't exist
    IF NOT EXIST "bin" mkdir bin

    REM Download yt-dlp if not exists
    IF NOT EXIST "bin\yt-dlp.exe" (
        echo Downloading yt-dlp...
        curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o bin\yt-dlp.exe
    )
) ELSE (
    REM Vercel build
    echo Running Vercel build...

    REM Create .vercel/bin directory
    mkdir .vercel\bin 2>nul

    REM Download yt-dlp for Linux
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o .vercel/bin/yt-dlp
    
    REM Make it executable
    bash -c "chmod a+rx .vercel/bin/yt-dlp"

    REM Install ffmpeg
    apt-get update && apt-get install -y ffmpeg
)

REM Run next build
next build
