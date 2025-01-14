import { spawn } from 'child_process'
import { NextResponse } from 'next/server'
import { join } from 'path'
import { existsSync } from 'fs'

interface VideoFormat {
  quality: string
  format_id: string
  label: string
}

interface YtDlpResponse {
  title: string
  thumbnail: string
  duration: number
  formats: Array<{
    format_id: string
    ext: string
    height?: number
    acodec?: string
  }>
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Use local yt-dlp installation
    let ytDlpPath = process.env.VERCEL
      ? join(process.cwd(), '.vercel/bin/yt-dlp')    // On Vercel (Linux)
      : join(process.cwd(), 'bin/yt-dlp.exe')        // Local (Windows)

    console.log('Environment:', {
      VERCEL: process.env.VERCEL,
      CWD: process.cwd(),
      PATH: process.env.PATH
    })
    
    console.log('Checking yt-dlp at:', ytDlpPath)

    // Check if yt-dlp exists
    try {
      if (!existsSync(ytDlpPath)) {
        console.error('yt-dlp not found at:', ytDlpPath)
        // Try finding it in PATH
        const alternativePath = process.env.VERCEL 
          ? '/var/task/.vercel/bin/yt-dlp'
          : ytDlpPath
        
        if (existsSync(alternativePath)) {
          console.log('Found yt-dlp at alternative path:', alternativePath)
          ytDlpPath = alternativePath
        } else {
          return NextResponse.json(
            { error: 'yt-dlp not found' },
            { status: 500 }
          )
        }
      }
    } catch (err) {
      console.error('Error checking yt-dlp:', err)
      return NextResponse.json(
        { error: 'Error checking yt-dlp installation' },
        { status: 500 }
      )
    }

    console.log('Spawning yt-dlp with path:', ytDlpPath)

    // Get video info using yt-dlp with format info
    const ytDlp = spawn(ytDlpPath, [
      '--dump-json',
      '--no-check-certificates',
      url
    ])

    let data = ''
    let errorOutput = ''

    ytDlp.stdout.on('data', chunk => {
      data += chunk
    })

    ytDlp.stderr.on('data', chunk => {
      errorOutput += chunk
      console.error('yt-dlp error:', chunk.toString())
    })

    const info = await new Promise<YtDlpResponse>((resolve, reject) => {
      ytDlp.on('close', code => {
        console.log('yt-dlp exited with code:', code)
        if (code === 0) {
          try {
            resolve(JSON.parse(data))
          } catch (err) {
            console.error('Failed to parse JSON:', err)
            reject(new Error('Failed to parse video info'))
          }
        } else {
          console.error('Failed with error:', errorOutput)
          reject(new Error('Failed to get video info'))
        }
      })
    })

    // Get available format IDs
    const availableFormats = new Set(info.formats.map(f => f.format_id))
    console.log('Available formats:', Array.from(availableFormats))
    
    // Check for audio format
    const hasAudio140 = info.formats.some(f => f.format_id === '140' && f.acodec !== 'none')
    console.log('Has audio 140:', hasAudio140)

    // Define all possible formats
    const allFormats: VideoFormat[] = [
      { quality: '2160p', format_id: '313+140', label: '4K Ultra HD' },
      { quality: '1440p', format_id: '271+140', label: '2K Quad HD' },
      { quality: '1080p', format_id: '137+140', label: 'Full HD' },
      { quality: '720p', format_id: '22', label: 'HD' },
      { quality: '480p', format_id: '135+140', label: 'SD' },
      { quality: '360p', format_id: '18', label: '360p' }
    ]

    // Filter to only available formats
    const formats = allFormats.filter(format => {
      if (format.format_id.includes('+')) {
        const [video] = format.format_id.split('+')
        return availableFormats.has(video) && hasAudio140
      } else {
        return availableFormats.has(format.format_id)
      }
    })

    console.log('Final formats:', formats)

    return NextResponse.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats
    })

  } catch (err) {
    console.error('Video info error:', err)
    return NextResponse.json(
      { 
        error: 'Failed to get video info',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
