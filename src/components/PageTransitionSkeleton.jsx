import { useEffect } from 'react'

export function PageTransitionSkeleton({ color, label, phase = 'loading' }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div
      className={`page-transition-skeleton ${phase === 'leaving' ? 'is-leaving' : ''}`}
      style={{ '--page-transition-accent': color }}
      role="status"
      aria-live="polite"
      aria-busy={phase !== 'leaving'}
    >
      <div className="page-transition-skeleton-header" aria-hidden="true">
        <span className="page-transition-skeleton-block page-transition-skeleton-nav" />
        <span className="page-transition-skeleton-block page-transition-skeleton-brand" />
        <span className="page-transition-skeleton-block page-transition-skeleton-account" />
      </div>

      <div className="page-transition-skeleton-content" aria-hidden="true">
        <section className="page-transition-skeleton-copy">
          <span className="page-transition-skeleton-block page-transition-skeleton-eyebrow" />
          <span className="page-transition-skeleton-block page-transition-skeleton-title is-wide" />
          <span className="page-transition-skeleton-block page-transition-skeleton-title" />

          <div className="page-transition-skeleton-paragraph">
            <span className="page-transition-skeleton-block" />
            <span className="page-transition-skeleton-block" />
            <span className="page-transition-skeleton-block" />
          </div>
        </section>

        <div className="page-transition-skeleton-grid">
          <span className="page-transition-skeleton-block page-transition-skeleton-card is-featured" />
          <span className="page-transition-skeleton-block page-transition-skeleton-card" />
          <span className="page-transition-skeleton-block page-transition-skeleton-card" />
        </div>
      </div>

      <p className="page-transition-skeleton-status">
        Đang chuẩn bị <strong>{label || 'trang mới'}</strong>
        <span aria-hidden="true">...</span>
      </p>
    </div>
  )
}
