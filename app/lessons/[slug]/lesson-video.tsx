'use client'

import {useEffect, useRef} from 'react'

import {captureEvent} from '../../lib/posthog-client'

type LessonVideoProps = {
  courseId?: string
  courseSlug?: string
  embedUrl: string
  lessonId: string
  lessonSlug: string
  startSeconds: number
  title: string
}

type YouTubePlayer = {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
}

type YouTubeApi = {
  Player: new (element: HTMLIFrameElement, options: {events: {onReady: () => void; onStateChange: (event: {data: number}) => void}}) => YouTubePlayer
  PlayerState: {ENDED: number; PLAYING: number}
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | undefined

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousReadyHandler = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previousReadyHandler?.()
        if (window.YT?.Player) resolve(window.YT)
      }

      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        document.head.append(script)
      }
    })
  }

  return youtubeApiPromise
}

export function LessonVideo({courseId, courseSlug, embedUrl, lessonId, lessonSlug, startSeconds, title}: LessonVideoProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    let isDisposed = false
    let player: YouTubePlayer | undefined
    let progressTimer: number | undefined
    let hasPlayed = false
    let hasReportedResume = false
    let hasCompleted = false
    const reportedMilestones = new Set<number>()

    const baseProperties = {
      course_id: courseId,
      course_slug: courseSlug,
      lesson_id: lessonId,
      lesson_slug: lessonSlug,
      video_provider: 'youtube',
    }

    const stopProgressTracking = () => {
      if (progressTimer !== undefined) {
        window.clearInterval(progressTimer)
        progressTimer = undefined
      }
    }

    const reportProgress = () => {
      if (!player) return

      const durationSeconds = Math.round(player.getDuration())
      const currentSeconds = Math.round(player.getCurrentTime())
      if (!durationSeconds || durationSeconds < 0) return

      const watchedPercent = Math.min(100, Math.floor((currentSeconds / durationSeconds) * 100))
      for (const milestone of [25, 50, 75, 90, 100]) {
        if (watchedPercent >= milestone && !reportedMilestones.has(milestone)) {
          reportedMilestones.add(milestone)
          captureEvent('lesson_video_watch_depth_reached', {
            ...baseProperties,
            current_seconds: currentSeconds,
            duration_seconds: durationSeconds,
            watch_depth_percent: milestone,
          })
        }
      }
    }

    void loadYouTubeApi().then((youtube) => {
      if (isDisposed) return

      player = new youtube.Player(frame, {
        events: {
          onReady: () => undefined,
          onStateChange: ({data}) => {
            if (!player) return

            if (data === youtube.PlayerState.PLAYING) {
              const currentSeconds = Math.round(player.getCurrentTime())
              if (!hasPlayed) {
                hasPlayed = true
                captureEvent('lesson_video_played', {
                  ...baseProperties,
                  requested_start_seconds: startSeconds,
                  start_seconds: currentSeconds,
                  resumed: startSeconds > 0,
                })
              }
              if (startSeconds > 0 && !hasReportedResume) {
                hasReportedResume = true
                captureEvent('lesson_resume_used', {...baseProperties, requested_start_seconds: startSeconds})
              }
              stopProgressTracking()
              progressTimer = window.setInterval(reportProgress, 1_000)
            }

            if (data === youtube.PlayerState.ENDED) {
              stopProgressTracking()
              reportProgress()
              if (!hasCompleted) {
                hasCompleted = true
                captureEvent('lesson_completed', {
                  ...baseProperties,
                  duration_seconds: Math.round(player.getDuration()),
                  completion_position_seconds: Math.round(player.getCurrentTime()),
                })
              }
            }
          },
        },
      })
    })

    return () => {
      isDisposed = true
      stopProgressTracking()
      player?.destroy()
    }
  }, [courseId, courseSlug, lessonId, lessonSlug, startSeconds])

  return <div className="lesson-video"><iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen ref={frameRef} src={embedUrl} title={`${title} video`} /></div>
}
