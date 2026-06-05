import { useState } from 'react'

const wheelLinks = [
  { href: '#quote', label: 'mở thư', className: 'wheel-link-quote' },
  { href: '#decision', label: 'xin dấu hiệu', className: 'wheel-link-decision' },
  { href: '#collection', label: 'spotify', className: 'wheel-link-spotify' },
  { href: '#focus', label: 'pomodoro', className: 'wheel-link-focus' },
]

export function WheelNavSection() {
  const [rotation, setRotation] = useState(0)

  const rotateWheel = (direction) => {
    setRotation((currentRotation) => currentRotation + direction * 90)
  }

  return (
    <section className="wheel-nav-section" aria-label="Love yourself navigation">
      <div className="wheel-nav-stage">
        <div className="wheel-nav-disc" style={{ '--wheel-rotation': `${rotation}deg` }}>
          <img className="wheel-nav-vector" src="/Vector.svg" alt="" aria-hidden="true" />
          <span className="wheel-sector-art wheel-sector-art-music" aria-hidden="true">
            <img src="/nhạc.GIF" alt="" />
          </span>
          <span className="wheel-sector-art wheel-sector-art-books" aria-hidden="true">
            <img src="/sách.GIF" alt="" />
          </span>
        </div>
        <div className="wheel-spin-controls" aria-label="Xoay vòng">
          <button
            className="wheel-spin-button wheel-spin-button-left"
            type="button"
            aria-label="Xoay vòng sang trái"
            onClick={() => rotateWheel(-1)}
          >
            <svg viewBox="0 0 190 150" aria-hidden="true" focusable="false">
              <path d="M162 124C66 105 34 48 58 18" />
              <path d="M58 18L28 24" />
              <path d="M58 18L68 49" />
            </svg>
          </button>
          <button
            className="wheel-spin-button wheel-spin-button-right"
            type="button"
            aria-label="Xoay vòng sang phải"
            onClick={() => rotateWheel(1)}
          >
            <svg viewBox="0 0 190 150" aria-hidden="true" focusable="false">
              <path d="M28 124C124 105 156 48 132 18" />
              <path d="M132 18L162 24" />
              <path d="M132 18L122 49" />
            </svg>
          </button>
        </div>
        <nav className="wheel-nav-links" aria-label="Đi tới các phần">
          {wheelLinks.map((link) => (
            <a className={`wheel-nav-link ${link.className}`} href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
