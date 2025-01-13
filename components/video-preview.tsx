'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface VideoPreviewProps {
  videoId: string
  title: string
}

export default function VideoPreview({ videoId, title }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const [showThumbnail, setShowThumbnail] = useState(true)

  // Get high quality thumbnail
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
  const fallbackThumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallbackThumbnailUrl
  }

  const handlePlayClick = () => {
    setIsLoading(true)
    setShowThumbnail(false)
    setIsPlaying(true)
  }

  const handlePauseClick = () => {
    setShowThumbnail(true)
    setIsPlaying(false)
  }

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      {showThumbnail ? (
        <>
          <Image
            src={thumbnailUrl}
            alt={title}
            onError={handleThumbnailError}
            fill
            className="object-cover"
            priority
          />
          <button
            onClick={handlePlayClick}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors group"
          >
            <Play className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
          </button>
        </>
      ) : (
        <>
          <iframe
            ref={videoRef}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&start=0&end=30`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={`absolute inset-0 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsLoading(false)}
          />
          {isPlaying && (
            <button
              onClick={handlePauseClick}
              className="absolute bottom-4 right-4 bg-black/80 p-2 rounded-full hover:bg-black transition-colors"
            >
              <Pause className="w-6 h-6 text-white" />
            </button>
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
