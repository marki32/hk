@echo off
SETLOCAL

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

    REM Run next build
    next build
) ELSE (
    REM On Vercel, use the shell script instead
    bash build.sh
)
