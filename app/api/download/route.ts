import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { createReadStream, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import type { ReadStream } from 'fs'

export async function POST(req: Request) {
  try {
    const { url, format_id } = await req.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Create a temp file path
    const tempFile = join(tmpdir(), `${Date.now()}.mp4`)

    // Get yt-dlp path based on environment
    const ytDlpPath = process.env.NODE_ENV === 'production' 
      ? join(process.cwd(), '.vercel/bin/yt-dlp')
      : 'yt-dlp'

    // Download to temp file first
    const ytDlp = spawn(ytDlpPath, [
      url,
      '-f', format_id || '22/best',  // Use selected format or fallback to 720p
      '--merge-output-format', 'mp4', // Always merge to MP4
      '-o', tempFile
    ])

    // Wait for download to finish
    await new Promise((resolve, reject) => {
      ytDlp.on('close', (code) => {
        if (code === 0) resolve(null)
        else reject(new Error('Download failed'))
      })
    })

    // Create stream from temp file
    const fileStream: ReadStream = createReadStream(tempFile)

    // Set response headers
    const headers = new Headers()
    headers.set('Content-Type', 'video/mp4')
    headers.set('Content-Disposition', 'attachment; filename="video.mp4"')

    // Return file stream
    const response = new Response(fileStream as unknown as ReadableStream, { headers })

    // Delete temp file after streaming
    response.clone().blob().then(() => {
      try {
        unlinkSync(tempFile)
      } catch (err) {
        console.error('Error deleting temp file:', err)
      }
    })

    return response
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Failed to download video' },
      { status: 500 }
    )
  }
}