import { NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function POST(req: Request) {
  try {
    const { url, format_id } = await req.json()

    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    if (!youtubeRegex.test(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    // Create a TransformStream for streaming the video
    const { readable, writable } = new TransformStream()

    // Start streaming process with format that includes both video and audio
    const ytDlp = spawn('yt-dlp', [
      '--format', format_id ? `${format_id}+bestaudio[ext=m4a]` : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]',
      '--merge-output-format', 'mp4',
      '-o', '-',
      url
    ])

    // Handle potential errors
    ytDlp.stderr.on('data', (data) => {
      console.error(`yt-dlp error: ${data}`)
    })

    // Stream the video data
    const writer = writable.getWriter()
    
    ytDlp.stdout.on('data', async (chunk) => {
      try {
        await writer.write(chunk)
      } catch (error) {
        console.error('Error writing chunk:', error)
      }
    })

    ytDlp.on('error', (error) => {
      console.error('yt-dlp process error:', error)
      writer.close()
    })

    ytDlp.stdout.on('end', () => {
      writer.close()
    })

    // Set response headers for streaming
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'video/mp4')
    responseHeaders.set('Content-Disposition', 'attachment; filename="video.mp4"')
    responseHeaders.set('Transfer-Encoding', 'chunked')

    return new Response(readable, {
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    )
  }
}