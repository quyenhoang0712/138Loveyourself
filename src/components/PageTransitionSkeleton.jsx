import { useEffect, useState } from 'react'
import loadingArtwork from '../assets/loading.svg'

const initialProgress = 15
const maximumWaitingProgress = 90
const waitingProgressDuration = 900
const progressUpdateMilliseconds = 50

export function PageTransitionSkeleton({ color, label, phase = 'loading' }) {
  const [progress, setProgress] = useState(initialProgress)
  const displayedProgress = phase === 'leaving' ? 100 : progress

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (phase === 'leaving') return undefined

    const startedAt = performance.now()

    const progressInterval = window.setInterval(() => {
      const elapsed = performance.now() - startedAt
      const waitingProgress = initialProgress
        + ((maximumWaitingProgress - initialProgress) * elapsed) / waitingProgressDuration
      setProgress(Math.min(maximumWaitingProgress, Math.round(waitingProgress)))
    }, progressUpdateMilliseconds)

    return () => window.clearInterval(progressInterval)
  }, [phase])

  return (
    <div
      className={`page-transition-skeleton ${phase === 'leaving' ? 'is-leaving' : ''}`}
      style={{ '--page-transition-accent': color, '--page-load-progress': `${displayedProgress}%` }}
      role="status"
      aria-live="polite"
      aria-busy={phase !== 'leaving'}
    >
      <div className="page-transition-loading-art" aria-hidden="true">
        <span className="page-transition-loading-track">
          <span className="page-transition-loading-fill" />
        </span>
        <img src={loadingArtwork} alt="" />
      </div>

      <span className="page-transition-skeleton-status">
        Đang tải {label || 'trang mới'}: {displayedProgress}%
      </span>
    </div>
  )
}
