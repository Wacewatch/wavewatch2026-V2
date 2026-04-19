import { NextRequest, NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

// YouTube playlist - NCS electronic music
const PLAYLIST_VIDEOS = [
  'K4DyBUG242c', // NCS - Elektronomia - Sky High
  'bM7SZ5SBzyY', // NCS - Alan Walker - Fade
  'J2X5mJ3HDYE', // NCS - DEAF KEV - Invincible
  'lP26UCnoH9s', // NCS - Tobu - Hope
  'IUGzY-ihqWc', // NCS - Tobu - Candyland
  '36YnV9STBqc', // NCS - Elektronomia - Energy
  'pt2JJsj0AcE', // NCS - Different Heaven - Nekozilla
  'LHvYrn3FAgI', // NCS - Tobu - Infectious
  'VtKbiyyVZks', // NCS - Disfigure - Blank
  'Tvt0kYBt1WI', // NCS - Aero Chord - Surface
]

let currentTrackIndex = 0

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const videoId = searchParams.get('v') || PLAYLIST_VIDEOS[currentTrackIndex]

  // Rotate to next track for next request
  currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST_VIDEOS.length

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`

    // Check if video is valid
    const info = await ytdl.getInfo(url)

    // Get audio-only format
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestaudio',
      filter: 'audioonly'
    })

    if (!format) {
      return NextResponse.json({ error: 'No audio format found' }, { status: 404 })
    }

    // Create stream
    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly',
    })

    // Convert Node.js stream to Web stream
    const webStream = new ReadableStream({
      async start(controller) {
        stream.on('data', (chunk) => {
          controller.enqueue(chunk)
        })
        stream.on('end', () => {
          controller.close()
        })
        stream.on('error', (err) => {
          controller.error(err)
        })
      },
    })

    return new Response(webStream, {
      headers: {
        'Content-Type': format.mimeType || 'audio/webm',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('YouTube audio stream error:', error)
    return NextResponse.json(
      { error: 'Failed to stream audio', details: String(error) },
      { status: 500 }
    )
  }
}

// Return playlist info
export async function POST(request: NextRequest) {
  try {
    const playlist = await Promise.all(
      PLAYLIST_VIDEOS.map(async (videoId) => {
        try {
          const info = await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${videoId}`)
          return {
            id: videoId,
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
          }
        } catch {
          return { id: videoId, title: 'Unknown', duration: '0' }
        }
      })
    )

    return NextResponse.json({ playlist, currentIndex: currentTrackIndex })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get playlist info' }, { status: 500 })
  }
}
