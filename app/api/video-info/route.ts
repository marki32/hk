import { spawn } from 'child_process'
import { join } from 'path'

interface VideoFormat {
  quality: string
  format_id: string
  label: string
}

interface YtDlpFormat {
  format_id: string
  ext: string
  resolution: string
  filesize: number
  tbr: number
  protocol: string
  vcodec: string
  acodec: string
  width: number
  height: number
}

interface YtDlpResponse {
  title: string
  thumbnail: string
  duration: number
  formats: YtDlpFormat[]
}

interface RequestBody {
  url: string
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { url } = await req.json() as RequestBody

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get yt-dlp path based on environment
    const ytDlpPath = process.env.NODE_ENV === 'production' 
      ? join(process.cwd(), '.vercel/bin/yt-dlp')
      : 'yt-dlp'

    // Get video info using yt-dlp
    const ytDlp = spawn(ytDlpPath, [
      '--dump-json',
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

    // Simple quality options that always work
    const formats: VideoFormat[] = [
      { quality: '2160p', format_id: '313+140', label: '4K Ultra HD' },
      { quality: '1440p', format_id: '271+140', label: '2K Quad HD' },
      { quality: '1080p', format_id: '137+140', label: 'Full HD' },
      { quality: '720p', format_id: '22', label: 'HD' },
      { quality: '480p', format_id: '135+140', label: 'SD' },
      { quality: '360p', format_id: '18', label: '360p' }
    ]

    return new Response(
      JSON.stringify({
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        formats
      }),
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (err) {
    console.error('Video info error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to get video info' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
