import { NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

interface YouTubeSearchItem {
  id: {
    videoId: string
  }
  snippet: {
    title: string
    description: string
    thumbnails: {
      medium: {
        url: string
      }
    }
  }
}

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  description: string
  url: string
  duration?: number
}

interface YouTubeVideoDetails {
  id: string
  contentDetails: {
    duration: string
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { query } = await req.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
        query
      )}&type=video&key=${YOUTUBE_API_KEY}`
    )

    if (!response.ok) {
      throw new Error('YouTube API request failed')
    }

    const data = await response.json()
    const videos: YouTubeVideo[] = data.items.map((item: YouTubeSearchItem) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      description: item.snippet.description,
      url: `https://youtube.com/watch?v=${item.id.videoId}`
    }))

    // Get video durations in a separate request
    const videoIds = videos.map((v: YouTubeVideo) => v.id).join(',')
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    )

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json()
      videos.forEach((video: YouTubeVideo) => {
        const details = detailsData.items.find((item: YouTubeVideoDetails) => item.id === video.id)
        if (details) {
          // Convert ISO 8601 duration to seconds
          const duration = details.contentDetails.duration
            .replace('PT', '')
            .replace('H', '*3600+')
            .replace('M', '*60+')
            .replace('S', '')
            .split('+')
            .filter(Boolean)
            .reduce((acc: number, curr: string) => acc + eval(curr), 0)
          
          video.duration = duration
        }
      })
    }

    return NextResponse.json({ videos })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json(
      { error: 'Failed to search videos' },
      { status: 500 }
    )
  }
}
