import { useEffect, useRef, useState } from 'react'
import { socket } from '@/utils/Socket'
import { createSendTransport, createRecvTransport, closeTransports } from '@/services/mediaSoup'
import { useLiveStore } from '@/appStore/useLiveStore'

const useLiveStream = (isHost: boolean, streamId: string, active: boolean) => {
  const [comments, setComments] = useState<string[]>([])
  const [viewers, setViewers] = useState<number>(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const setLive = useLiveStore((s) => s.setLive)

  // Handle stream lifecycle (start, join, leave)
  useEffect(() => {
    if (!active) return

    socket.emit(isHost ? 'live:start' : 'live:join', { streamId })
    if (isHost) setLive(true)

    socket.on('live:comment', (msg: string) => {
      setComments((prev) => [...prev, msg])
    })

    socket.on('live:viewers', (count: number) => {
      setViewers(count)
    })

    return () => {
      socket.emit('live:leave', { streamId })
      socket.off('live:comment')
      socket.off('live:viewers')
      setLive(false)

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      closeTransports()
    }
  }, [isHost, streamId, active])

  // Handle Media and MediaSoup
  useEffect(() => {
    if (!active) return

    const setupStream = async () => {
      try {
        if (isHost) {
          const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          setStream(localStream)
          await createSendTransport(socket, localStream)
        } else {
          await createRecvTransport(socket, streamId, videoRef)
        }
      } catch (error) {
        console.error('Error setting up stream:', error)
      }
    }

    setupStream()
  }, [isHost, streamId, active])

  const sendComment = (text: string) => {
    socket.emit('live:comment', { streamId, message: text })
  }

  return {
    stream,
    viewers,
    comments,
    sendComment,
    videoRef, // for viewer to use
  }
}

export default useLiveStream
