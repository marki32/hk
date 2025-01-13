import { NextResponse } from 'next/server'
import { spawn } from 'child_process'

interface VideoFormat {
  height?: number
  format_id: string
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    return await new Promise<Response>((resolve) => {
      const ytDlp = spawn('yt-dlp', [
        '--print', '%(title)s\n%(thumbnail)s\n%(duration)s\n%(formats)j',
        url
      ])

      let outputData = ''

      ytDlp.stdout.on('data', (data) => {
        outputData += data
      })

      ytDlp.on('close', (code) => {
        if (code !== 0) {
          resolve(NextResponse.json(
            { error: 'Failed to get video info' },
            { status: 500 }
          ))
          return
        }

        try {
          const [title, thumbnail, duration, formatsStr] = outputData.split('\n')
          const formats = JSON.parse(formatsStr)
          
          // Only get standard quality formats with both video and audio
          const standardQualities = [1080, 720, 480, 360]
          const videoFormats = standardQualities
            .map(quality => {
              const format = formats.find((f: VideoFormat) => f.height === quality)
              if (format) {
                return {
                  quality: `${quality}p`,
                  format_id: format.format_id
                }
              }
              return null
            })
            .filter(Boolean)

          resolve(NextResponse.json({ 
            title,
            thumbnail,
            duration: parseInt(duration),
            formats: videoFormats 
          }))
        } catch {
          resolve(NextResponse.json(
            { error: 'Failed to parse video info' },
            { status: 500 }
          ))
        }
      })
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to get video info' },
      { status: 500 }
    )
  }
}
