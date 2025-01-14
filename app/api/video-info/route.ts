import { spawn } from 'child_process'
import { NextResponse } from 'next/server'
import { join } from 'path'

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
    const ytDlpPath = join(process.cwd(), 'bin/yt-dlp.exe')

    // Get video info using yt-dlp with format info
    const ytDlp = spawn(ytDlpPath, [
      '--dump-json',
      '--no-check-certificates',
      url
    ])

    let data = ''
    ytDlp.stdout.on('data', chunk => {
      data += chunk
    })

    const info = await new Promise<YtDlpResponse>((resolve, reject) => {
      ytDlp.on('close', code => {
        if (code === 0) {
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error('Failed to parse video info'))
          }
        } else {
          reject(new Error('Failed to get video info'))
        }
      })
    })

    // Get available format IDs
    const availableFormats = new Set(info.formats.map(f => f.format_id))
    
    // Check for audio format
    const hasAudio140 = info.formats.some(f => f.format_id === '140' && f.acodec !== 'none')

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
        // For combined formats, check both parts
        const [video] = format.format_id.split('+')
        return availableFormats.has(video) && hasAudio140
      } else {
        // For single formats like 22 or 18
        return availableFormats.has(format.format_id)
      }
    })

    console.log('Available formats:', formats)

    return NextResponse.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      formats
    })

  } catch (err) {
    console.error('Video info error:', err)
    return NextResponse.json(
      { error: 'Failed to get video info' },
      { status: 500 }
    )
  }
}
