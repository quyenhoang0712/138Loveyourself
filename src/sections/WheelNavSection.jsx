import { useState } from 'react'

const wheelSpinDuration = 760

const wheelLinks = [
  { href: '#card-room', label: 'phòng thiệp', className: 'wheel-link-card-room', rotation: -90, color: '#9AB4EE' },
  { href: '#focus-room', label: 'phòng tập trung', className: 'wheel-link-focus-room', rotation: 180, color: '#F8DB8E' },
  { href: '#healing-room', label: 'phòng chữa lành', className: 'wheel-link-healing-room', rotation: 0, color: '#4789C8' },
  { href: '#sound-room', label: 'phòng âm thanh', className: 'wheel-link-sound-room', rotation: 90, color: '#EBAAB4' },
]

export function WheelNavSection({ onRoomNavigate }) {
  const [rotation, setRotation] = useState(0)
  const [pendingHref, setPendingHref] = useState(null)

  const rotateWheel = (direction) => {
    setRotation((currentRotation) => currentRotation + direction * 90)
  }

  const getTargetRotation = (currentRotation, targetRotation) => {
    const currentTurns = Math.round((currentRotation - targetRotation) / 360)
    let nextRotation = targetRotation + currentTurns * 360

    if (nextRotation === currentRotation) {
      nextRotation += 360
    }

    return nextRotation
  }

  const handleRoomClick = (event, link) => {
    event.preventDefault()
    if (pendingHref) return

    setPendingHref(link.href)
    setRotation((currentRotation) => getTargetRotation(currentRotation, link.rotation))

    window.setTimeout(() => {
      if (onRoomNavigate) {
        onRoomNavigate(link)
        return
      }

      window.location.hash = link.href
    }, wheelSpinDuration)
  }

  return (
    <section className="wheel-nav-section" aria-label="Love yourself navigation">
      <div className="wheel-nav-stage">
        <div className="wheel-nav-disc" style={{ '--wheel-rotation': `${rotation}deg` }}>
          <img className="wheel-nav-vector" src="/Vector.svg" alt="" aria-hidden="true" />
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
            <a
              className={`wheel-nav-link ${link.className} ${pendingHref === link.href ? 'is-pending' : ''}`}
              href={link.href}
              key={link.href}
              onClick={(event) => handleRoomClick(event, link)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
