import { useState } from 'react'
import { assetUrl } from '../utils/assets'

const wheelSpinDuration = 760
const wheelLeftButtonUrl = assetUrl('wheel/nuttrai.svg')
const wheelRightButtonUrl = assetUrl('wheel/nutphai.svg')

const wheelLinks = [
  { href: '#community', label: 'Phòng cộng đồng', className: 'wheel-link-community-room', rotation: -90, color: '#4789C8' },
  { href: '#healing-room', label: 'Phòng thư giãn', className: 'wheel-link-healing-room', rotation: 180, color: '#F8DB8E' },
  { href: '#card-room', label: 'Phòng thông điệp', className: 'wheel-link-card-room', rotation: 0, color: '#F8DB8E' },
  { href: '#focus-room', label: 'Phòng tập trung', className: 'wheel-link-focus-room', rotation: 90, color: '#4789C8' },
]

function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360
}

export function WheelNavSection({ onRoomNavigate }) {
  const [rotation, setRotation] = useState(0)
  const [pendingHref, setPendingHref] = useState(null)
  const activeRotation = normalizeRotation(rotation)

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
          <img className="wheel-nav-vector" src={assetUrl('Vector.gif')} alt="" aria-hidden="true" />
        </div>
        <div className="wheel-spin-controls" aria-label="Xoay vòng">
          <button
            className="wheel-spin-button wheel-spin-button-left"
            type="button"
            aria-label="Xoay vòng sang trái"
            onClick={() => rotateWheel(-1)}
          >
            <img src={wheelLeftButtonUrl} alt="" aria-hidden="true" />
          </button>
          <button
            className="wheel-spin-button wheel-spin-button-right"
            type="button"
            aria-label="Xoay vòng sang phải"
            onClick={() => rotateWheel(1)}
          >
            <img src={wheelRightButtonUrl} alt="" aria-hidden="true" />
          </button>
        </div>
        <nav className="wheel-nav-links" aria-label="Đi tới các phần">
          {wheelLinks.map((link) => {
            const isActive = activeRotation === normalizeRotation(link.rotation)

            return (
              <a
                className={`wheel-nav-link ${link.className} ${isActive ? 'is-active' : ''} ${pendingHref === link.href ? 'is-pending' : ''}`}
                href={link.href}
                key={link.href}
                onClick={(event) => handleRoomClick(event, link)}
              >
                {link.label}
              </a>
            )
          })}
        </nav>
      </div>

      <div className="wheel-nav-note">
        <span aria-hidden="true" />
        <p>
          Nếu hôm nay bạn đang hơi rối hoặc không biết nên chọn gì, ghé vào đây thử nhé. Có quote mỗi ngày
          và phần “xin dấu hiệu” để bạn có thêm một gợi ý nho nhỏ cho điều mình đang nghĩ.
        </p>
        <span aria-hidden="true" />
      </div>
    </section>
  )
}
