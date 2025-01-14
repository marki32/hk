import { spawn } from 'child_process'
import { createReadStream, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { url, format_id } = await req.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Create temp file path
    const tempFile = join(tmpdir(), `${Date.now()}.mp4`)

    // Use local yt-dlp installation
    const ytDlpPath = process.env.VERCEL
      ? join(process.cwd(), '.vercel/bin/yt-dlp')    // On Vercel (Linux)
      : join(process.cwd(), 'bin/yt-dlp.exe')        // Local (Windows)

    // Download using exact format ID and merge to MP4
    const ytDlp = spawn(ytDlpPath, [
      url,
      '-f', format_id,
      '--merge-output-format', 'mp4',
      '-o', tempFile
    ])

    // Wait for download to complete
    await new Promise((resolve, reject) => {
      let errorOutput = ''
      
      ytDlp.stderr.on('data', chunk => {
        errorOutput += chunk.toString()
      })

      ytDlp.on('close', code => {
        if (code === 0) resolve(null)
        else reject(new Error(errorOutput))
      })
    })

    // Create stream from temp file
    const fileStream = createReadStream(tempFile)

    // Set headers for MP4 download
    const headers = new Headers()
    headers.set('Content-Type', 'video/mp4')
    headers.set('Content-Disposition', 'attachment; filename="video.mp4"')

    // Stream file to browser
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