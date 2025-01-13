'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import VideoPreview from './video-preview'
import Header from './header'
import Image from 'next/image'

interface Format {
  quality: string
  format_id: string
}

interface VideoInfo {
  title: string
  thumbnail: string
  duration: number
  formats: Format[]
}

interface SearchResult {
  id: string
  title: string
  thumbnail: string
  duration: number
  url: string
}

export default function YouTubeDownloader() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formats, setFormats] = useState<Format[]>([])
  const [selectedFormat, setSelectedFormat] = useState('')
  const [loadingFormats, setLoadingFormats] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const getFormats = async () => {
      if (!url) {
        setFormats([])
        setVideoInfo(null)
        return
      }

      try {
        setLoadingFormats(true)
        setError('')
        const response = await fetch('/api/video-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          throw new Error('Failed to get video formats')
        }

        const data = await response.json()
        setVideoInfo(data)
        setFormats(data.formats)
        if (data.formats.length > 0) {
          setSelectedFormat(data.formats[0].format_id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get video formats')
        setVideoInfo(null)
      } finally {
        setLoadingFormats(false)
      }
    }

    const timeoutId = setTimeout(getFormats, 500)
    return () => clearTimeout(timeoutId)
  }, [url])

  const handleDownload = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          format_id: selectedFormat
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to download')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = 'video.mp4'
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download, please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setSearching(true)
      setError('')
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (!response.ok) {
        throw new Error('Failed to search videos')
      }

      const data = await response.json()
      setSearchResults(data.videos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search videos')
    } finally {
      setSearching(false)
    }
  }

  const selectVideo = (videoUrl: string) => {
    setUrl(videoUrl)
    setSearchResults([])
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-gray-100">
      <Header />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search YouTube videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-gray-800/50 border-gray-700 focus:border-red-500 focus:ring-red-500"
              />
              <Button 
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="bg-red-600 hover:bg-red-700 transition-colors duration-200"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Loader2 className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((video) => (
                  <div 
                    key={video.id}
                    onClick={() => selectVideo(video.url)}
                    className="group bg-gray-800/50 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-700/50 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="aspect-video relative">
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-red-400 transition-colors">
                        {video.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* URL Input */}
            <div className="relative mt-8">
              <Input
                type="text"
                placeholder="Or paste YouTube URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-gray-800/50 border-gray-700 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            {/* Video Info with Preview */}
            {videoInfo && (
              <div className="bg-gray-800/50 rounded-xl overflow-hidden backdrop-blur-sm border border-gray-700/50">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-white mb-4">{videoInfo.title}</h3>
                  <VideoPreview 
                    videoId={url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/)?.[1] || ''}
                    title={videoInfo.title}
                  />
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                    <span>Duration: {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Quality Selection */}
                {formats.length > 0 && (
                  <div className="border-t border-gray-700/50 p-4 bg-black/20">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Quality
                    </label>
                    <select 
                      value={selectedFormat}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="w-full p-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-red-500 focus:ring-red-500"
                      disabled={loadingFormats}
                    >
                      {formats.map((format) => (
                        <option key={format.format_id} value={format.format_id}>
                          {format.quality}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Download Button */}
                <div className="p-4 bg-black/20 border-t border-gray-700/50">
                  <Button
                    onClick={handleDownload}
                    disabled={!url || loading || loadingFormats}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors duration-200"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span>Downloading...</span>
                      </div>
                    ) : (
                      'Download Video'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loadingFormats && (
            <div className="text-center bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-red-500" />
              <p className="text-gray-300 mt-2">Getting video info...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mt-4 bg-red-900/50 backdrop-blur-sm border border-red-700">
              <AlertDescription className="text-white">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  )
}
