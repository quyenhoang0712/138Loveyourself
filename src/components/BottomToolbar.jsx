import { useEffect, useRef, useState } from 'react'
import './BottomToolbar.css'

const communityLink = {
  href: '#community',
  label: 'Cộng đồng',
  room: 'community',
  color: '#9AB4EE',
}

const activityLinks = [
  { href: '#card-room', label: 'Phòng thông điệp', room: 'card-room', color: '#9AB4EE' },
  { href: '#focus-room', label: 'Phòng tập trung', room: 'focus-room', color: '#9AB4EE' },
  { href: '#healing-room', label: 'Phòng thư giãn', room: 'healing-room', color: '#9AB4EE' },
  { href: '#diary-room', label: 'Phòng kỷ niệm', room: 'diary-room', color: '#9AB4EE' },
]

const activityRoomIds = new Set(activityLinks.map((link) => link.room))

const iconUrls = {
  activity: 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/icons/toolbar/activity-HIw8d3Jiz97I6z4qoUj83LCAvkO9CT.svg',
  community: 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/icons/toolbar/community-ihsQg41EF8cA5m2n6m4kS0PGQNswQ8.svg',
  home: 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/icons/toolbar/home-Q45kKqSNR4OpSArr5UMmk5MdjCrsKd.svg',
  music: 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/icons/toolbar/music-aV8fx3lbYKIS83OX2SvQiWLoWG6JRg.svg',
  profile: 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/icons/toolbar/profile-QP2iNmtxFJYjnICxSGplzWmLlU80gD.svg',
  shop: 'https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/icons/toolbar/shop-8cyf1q3ptKswtFInZM8FAfwbiZI9ZN.svg',
}

export function BottomToolbar({
  activeRoom,
  isHidden,
  isHomeActive,
  isProfileActive,
  isQuickSpotifyOpen,
  quickSpotifySrc,
  onHomeNavigate,
  onProfileNavigate,
  onQuickSpotifyToggle,
  onToggleHidden,
  onRoomNavigate,
  onShopOpen,
}) {
  const [isActivityMenuOpen, setIsActivityMenuOpen] = useState(false)
  const activityButtonRef = useRef(null)
  const activityMenuRef = useRef(null)
  const isMusicActive = Boolean(isQuickSpotifyOpen || activeRoom === 'sound-room' || activeRoom === 'play-room')
  const selectedActivityRoom = activityRoomIds.has(activeRoom) ? activeRoom : 'card-room'

  useEffect(() => {
    if (!isActivityMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (activityButtonRef.current?.contains(event.target)) return
      if (activityMenuRef.current?.contains(event.target)) return
      setIsActivityMenuOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return

      setIsActivityMenuOpen(false)
      activityButtonRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActivityMenuOpen])

  const handleActivityMenuToggle = () => {
    setIsActivityMenuOpen((isOpen) => !isOpen)
  }

  const handleActivityNavigate = (link) => {
    setIsActivityMenuOpen(false)
    onRoomNavigate(link)
  }

  const handleToolbarHiddenToggle = () => {
    setIsActivityMenuOpen(false)
    onToggleHidden()
  }

  const toolbarItems = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: iconUrls.home,
      isActive: isHomeActive && !isMusicActive && !isActivityMenuOpen,
      onClick: onHomeNavigate,
    },
    {
      id: 'community',
      label: 'Cộng đồng',
      icon: iconUrls.community,
      isActive: activeRoom === 'community' && !isMusicActive && !isActivityMenuOpen,
      onClick: () => onRoomNavigate(communityLink),
    },
    {
      id: 'activity',
      label: 'Hoạt động',
      icon: iconUrls.activity,
      isActive: isActivityMenuOpen || (activityRoomIds.has(activeRoom) && !isMusicActive),
      hasPopup: true,
      onClick: handleActivityMenuToggle,
    },
    {
      id: 'profile',
      label: 'Cá nhân',
      icon: iconUrls.profile,
      isActive: isProfileActive && !isMusicActive && !isActivityMenuOpen,
      onClick: onProfileNavigate,
    },
    {
      id: 'music',
      label: 'Âm nhạc',
      icon: iconUrls.music,
      isActive: isMusicActive && !isActivityMenuOpen,
      isPressed: Boolean(quickSpotifySrc && isQuickSpotifyOpen),
      onClick: onQuickSpotifyToggle,
    },
    {
      id: 'shop',
      label: 'Cửa hàng',
      icon: iconUrls.shop,
      onClick: onShopOpen,
    },
  ]
  const activeItemIndex = toolbarItems.findIndex((item) => item.isActive)

  return (
    <nav className={`bottom-toolbar ${isHidden ? 'is-hidden' : ''}`} aria-label="Điều hướng nhanh">
      <button
        className="bottom-toolbar-peek"
        type="button"
        aria-label={isHidden ? 'Hiện thanh điều hướng' : 'Ẩn thanh điều hướng'}
        aria-expanded={!isHidden}
        onClick={handleToolbarHiddenToggle}
      />

      {quickSpotifySrc && isQuickSpotifyOpen && !isHidden ? (
        <div className="bottom-toolbar-spotify-panel">
          <iframe
            className="bottom-toolbar-spotify-player"
            title="Spotify mini"
            src={quickSpotifySrc}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="bottom-toolbar-navigation">
        {isActivityMenuOpen && !isHidden ? (
          <div
            className="bottom-toolbar-activity-menu"
            id="bottom-toolbar-activity-menu"
            ref={activityMenuRef}
            role="menu"
            aria-label="Chọn phòng hoạt động"
          >
            {activityLinks.map((link) => (
              <button
                className={link.room === selectedActivityRoom ? 'is-active' : ''}
                type="button"
                role="menuitem"
                key={link.room}
                onClick={() => handleActivityNavigate(link)}
              >
                <span>{link.label}</span>
              </button>
            ))}
            <span className="bottom-toolbar-activity-tail" aria-hidden="true" />
          </div>
        ) : null}

        <div className="bottom-toolbar-track">
          {activeItemIndex >= 0 ? (
            <span
              className="bottom-toolbar-active-indicator"
              style={{
                width: `calc((100% - 14px - ${toolbarItems.length - 1} * 4px) / ${toolbarItems.length})`,
                transform: `translateX(calc(${activeItemIndex} * (100% + 4px)))`,
              }}
              aria-hidden="true"
            />
          ) : null}

          {toolbarItems.map((item) => (
            <button
              className={`bottom-toolbar-item ${item.isActive ? 'is-active is-indicator-active' : ''} ${item.isPressed ? 'is-pressed' : ''}`}
              type="button"
              key={item.id}
              ref={item.id === 'activity' ? activityButtonRef : undefined}
              aria-current={item.isActive && !isActivityMenuOpen ? 'page' : undefined}
              aria-pressed={item.isPressed || undefined}
              aria-haspopup={item.hasPopup ? 'menu' : undefined}
              aria-expanded={item.hasPopup ? isActivityMenuOpen : undefined}
              aria-controls={item.hasPopup && isActivityMenuOpen ? 'bottom-toolbar-activity-menu' : undefined}
              onClick={item.onClick}
            >
              <span
                className="bottom-toolbar-icon"
                style={{ '--bottom-toolbar-icon': `url("${item.icon}")` }}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
