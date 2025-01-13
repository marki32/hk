import { NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function POST(req: Request): Promise<Response> {
  try {
    const { query } = await req.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    return await new Promise<Response>((resolve) => {
      const ytDlp = spawn('yt-dlp', [
        'ytsearch5:' + query,
        '--print', '%(id)s\n%(title)s\n%(thumbnail)s\n%(duration)s\n%(description)s',
        '--flat-playlist'
      ])

      let outputData = ''

      ytDlp.stdout.on('data', (data) => {
        outputData += data
      })

      ytDlp.stderr.on('data', () => {
        // Handle stderr if needed
      })

      ytDlp.on('close', (code) => {
        if (code !== 0) {
          resolve(NextResponse.json(
            { error: 'Failed to search videos' },
            { status: 500 }
          ))
          return
        }

        try {
          const lines = outputData.trim().split('\n')
          const videos = []
          
          for (let i = 0; i < lines.length; i += 5) {
            if (i + 4 < lines.length) {
              const id = lines[i]
              const thumbnailUrl = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
              
              videos.push({
                id: id,
                title: lines[i + 1],
                thumbnail: thumbnailUrl,
                duration: parseInt(lines[i + 3]),
                description: lines[i + 4],
                url: `https://youtube.com/watch?v=${id}`
              })
            }
          }

          resolve(NextResponse.json({ videos }))
        } catch {
          resolve(NextResponse.json(
            { error: 'Failed to parse search results' },
            { status: 500 }
          ))
        }
      })
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to search videos' },
      { status: 500 }
    )
  }
}
