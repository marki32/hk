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
    const ytDlpPath = join(process.cwd(), 'bin/yt-dlp.exe')

    // Download using optimized settings
    const ytDlp = spawn(ytDlpPath, [
      url,
      '-f', format_id,
      '--merge-output-format', 'mp4',
      '--no-check-certificates',  // Skip HTTPS certificate validation
      '--no-warnings',           // Reduce output
      '--no-progress',          // Don't show progress
      '--quiet',               // Even quieter
      '-o', tempFile
    ])

    // Wait for download with timeout
    await Promise.race([
      new Promise((resolve, reject) => {
        let errorOutput = ''
        
        ytDlp.stderr.on('data', chunk => {
          errorOutput += chunk.toString()
        })

        ytDlp.on('close', code => {
          if (code === 0) resolve(null)
          else reject(new Error(errorOutput))
        })
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Download timeout - video too large')), 55000)
      )
    ])

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
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to download video',
        details: message.includes('timeout') ? 
          'Video is too large for direct download. Please try a lower quality.' :
          message
      },
      { status: 500 }
    )
  }
}