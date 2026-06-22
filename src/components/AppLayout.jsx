import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ambientSoundOptions,
  heroVideoUrl,
  iceCubeSeconds,
  iceStackLayout,
  maxIceCubes,
  
  shareTextColors,
} from '../config/appConfig'
import { AmbientVisualEffect } from './AmbientVisualEffect'
import { CloseIcon, SoundOffIcon } from './icons'
import { ShareSheet, Toast } from './ShareSheet'
import { SiteHeader } from './SiteHeader'
import { AmbientSection } from '../sections/AmbientSection'
import { CommunitySection } from '../sections/CommunitySection'
import { DecisionSection } from '../sections/DecisionSection'
import { DiarySection } from '../sections/DiarySection'
import { FocusSection } from '../sections/FocusSection'
import { HealingSection } from '../sections/HealingSection'
import { IntroVideoSection } from '../sections/IntroVideoSection'
import { PlaylistSection } from '../sections/PlaylistSection'
import { AnalyticsReport } from '../sections/AnalyticsReport'
import { QuoteSection } from '../sections/QuoteSection'
import { RoomSection } from '../sections/RoomSection'
import { UserProfileReport } from '../sections/UserProfileReport'
import { WheelNavSection } from '../sections/WheelNavSection'
import {
  getVisitorProfile,
  getAnalyticsIds,
  identifyVisitor,
  getReturnStreak,
  returnStreakChangedEventName,
  sendAnalyticsHeartbeat,
  startAnalyticsSession,
  trackAnalyticsEvent,
  updateReturnStreak,
} from '../utils/analytics'

const roomRoutes = ['card-room', 'focus-room', 'healing-room', 'sound-room', 'play-room', 'community', 'diary-room']
const roomTransitionDuration = 1300
const roomTransitionRouteDelay = 1300
const visitorProfileStorageKey = 'love-yourself-visitor-profile'
const welcomeGuideLastSeenStorageKey = 'love-yourself-guide-last-seen'
const returnStreakPopupSeenStorageKey = 'love-yourself-return-streak-popup-seen'
const welcomeGuideReminderDelay = 12 * 60 * 60 * 1000
const transitionMascotSrc = '/PNG/tay-trai-tim.png'
const quickSpotifyButtonSrc = '/PNG/dia-than.png'
const quickSpotifyEmbed = 'https://open.spotify.com/embed/playlist/1yd3LjXq6a5EXVA11w7UPH?utm_source=generator&theme=0'
const roomSwitcherIconSrc = '/PNG/mascot-ong-nhom.png'
const roomSwitcherLinks = [
  { href: '#card-room', label: 'Thiệp', room: 'card-room', color: '#9AB4EE' },
  { href: '#focus-room', label: 'Tập trung', room: 'focus-room', color: '#F8DB8E' },
  { href: '#healing-room', label: 'Chữa lành', room: 'healing-room', color: '#4789C8' },
  { href: '#sound-room', label: 'Âm thanh', room: 'sound-room', color: '#EBAAB4' },
  { href: '#community', label: 'Cộng đồng', room: 'community', color: '#9AB4EE' },
  { href: '#diary-room', label: 'Nhật ký', room: 'diary-room', color: '#F8DB8E' },
]
const homePriorityAssets = [
  '/Vector.gif',
  '/PNG/giay.png',
  '/PNG/ao-khan-len.png',
  transitionMascotSrc,
  quickSpotifyButtonSrc,
  roomSwitcherIconSrc,
]
const uniqueHomePriorityAssets = [...new Set(homePriorityAssets)]
const visitorGenderOptions = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Khác', value: 'other' },
]

function getTodayKey() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function shouldShowReturnStreakPopup() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(returnStreakPopupSeenStorageKey) !== getTodayKey()
  } catch {
    return true
  }
}

function markReturnStreakPopupSeen() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(returnStreakPopupSeenStorageKey, getTodayKey())
  } catch {
    // Popup visibility can still be controlled for this session.
  }
}

function getStoredVisitorProfile() {
  if (typeof window === 'undefined') return null

  try {
    const profile = JSON.parse(window.localStorage.getItem(visitorProfileStorageKey) || 'null')
    const age = Number(profile?.age)
    const gender = profile?.gender

    if (!Number.isInteger(age) || age < 1 || age > 120) return null
    if (!['male', 'female', 'other'].includes(gender)) return null

    return { age, gender }
  } catch {
    return null
  }
}

function storeVisitorProfile(profile) {
  try {
    window.localStorage.setItem(
      visitorProfileStorageKey,
      JSON.stringify({ age: profile.age, gender: profile.gender }),
    )
  } catch {
    // Continue with the database when browser storage is unavailable.
  }
}

function shouldShowWelcomeGuide() {
  if (typeof window === 'undefined') return false

  const lastSeenAt = Number(window.localStorage.getItem(welcomeGuideLastSeenStorageKey))
  return !lastSeenAt || Date.now() - lastSeenAt >= welcomeGuideReminderDelay
}

function getActiveRoomFromHash() {
  if (typeof window === 'undefined') return null

  const hashRoom = window.location.hash.replace('#', '')
  return roomRoutes.includes(hashRoom) ? hashRoom : null
}

function getIsAnalyticsReportFromHash() {
  if (typeof window === 'undefined') return false

  return window.location.hash.replace('#', '') === 'analytics'
}

function getIsProfileFromHash() {
  if (typeof window === 'undefined') return false

  return window.location.hash.replace('#', '') === 'profile'
}

function preloadImage(src) {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
}

function AnimatedTitle({ children, id }) {
  let characterIndex = 0
  const text = String(children)

  return (
    <h2 aria-label={text} id={id}>
      {text.split(' ').map((word, wordIndex) => (
        <span className="room-title-word" key={`${word}-${wordIndex}`}>
          {Array.from(word).map((character) => {
            const currentCharacterIndex = characterIndex
            characterIndex += 1

            return (
              <span
                aria-hidden="true"
                className="room-title-character"
                key={`${character}-${currentCharacterIndex}`}
                style={{ '--title-character-index': currentCharacterIndex }}
              >
                {character}
              </span>
            )
          })}
        </span>
      ))}
    </h2>
  )
}

function CommunityIntroSection({ onCommunityNavigate }) {
  const communityLink = { href: '#community', label: 'Cộng đồng', room: 'community', color: '#9AB4EE' }

  return (
    <section className="home-community-intro scroll-pop" aria-labelledby="home-community-title">
      <div className="home-community-copy">
        <p>Phòng cộng đồng</p>
        <AnimatedTitle id="home-community-title">Một góc để mọi người cùng ở lại với nhau.</AnimatedTitle>
        <span>
          Đây sẽ là nơi gom những chia sẻ nhẹ nhàng, lời nhắn và câu chuyện từ cộng đồng Love Yourself.
          Trước mắt mình mở sẵn cánh cửa, phần nội dung sẽ được thêm sau.
        </span>
        <button type="button" onClick={() => onCommunityNavigate(communityLink)}>
          Vào  cộng đồng
        </button>
      </div>
      <img className="home-community-icon" src="/PNG/giay.png" alt="" aria-hidden="true" />
    </section>
  )
}

function DiaryIntroSection({ onDiaryNavigate }) {
  const diaryLink = { href: '#diary-room', label: 'Nhật ký', room: 'diary-room', color: '#F8DB8E' }

  return (
    <section className="home-community-intro home-diary-intro scroll-pop" aria-labelledby="home-diary-title">
      <img className="home-community-icon home-diary-icon" src="/PNG/note.png" alt="" aria-hidden="true" />
      <div className="home-community-copy">
        <p>Phòng nhật ký</p>
        <AnimatedTitle id="home-diary-title">Một căn phòng mới để giữ lại những dòng riêng.</AnimatedTitle>
        <span>
          Phòng nhật ký sẽ được dựng sau. Trước mắt mình để căn phòng này trống đã.
        </span>
        <button type="button" onClick={() => onDiaryNavigate(diaryLink)}>
          Vào phòng nhật ký
        </button>
      </div>
    </section>
  )
}

function OfficialSiteIntroSection() {
  return (
    <section className="community-official-site scroll-pop" aria-labelledby="official-site-title">
      <div className="official-site-copy">
        <p>Web chính của 138knitwear</p>
        <AnimatedTitle id="official-site-title">Ghé 138knitwear để xem những collection mới nhất.</AnimatedTitle>
        <span>
          Ở đó người tình có thể xem các sản phẩm knitwear, phụ kiện, lookbook và những tin tức mới từ 138.
          Còn góc Love Yourself này là nơi mình ở lại lâu hơn với cảm xúc, lời nhắn và cộng đồng.
        </span>
        <div className="official-site-actions">
          <a className="official-site-link" href="https://138knitwear.com/" target="_blank" rel="noreferrer">
            Mở 138knitwear.com
          </a>
        </div>
      </div>
      <img className="official-site-art" src="/PNG/ao-khan-len.png" alt="" aria-hidden="true" />
    </section>
  )
}

function FeedbackPopup({ isOpen, onClose }) {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...getAnalyticsIds(),
          name,
          email,
          message,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Chưa gửi được góp ý. Bạn thử lại giúp mình nha.')
      }

      setMessage('')
      setName('')
      setEmail('')
      setStatus({ type: 'success', text: data?.message || 'Cảm ơn bạn đã góp ý!' })
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.message === 'Failed to fetch'
          ? 'Không kết nối được máy chủ. Bạn thử lại sau nha.'
          : error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="home-feedback-backdrop" role="presentation" onClick={onClose}>
      <section
        className="home-feedback-section home-feedback-popup"
        aria-labelledby="home-feedback-title"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="home-feedback-close" type="button" aria-label="Đóng góp ý" onClick={onClose}>
          <CloseIcon />
        </button>

        <div className="home-feedback-copy">
          <p>Đóng góp ý kiến</p>
          <h2 id="home-feedback-title">Bạn muốn Love Yourself dịu hơn ở chỗ nào?</h2>
          <span>
            Gửi tụi mình một lời nhắn nhỏ: điều bạn thích, điều còn khó dùng, hoặc một căn phòng bạn muốn có thêm.
            Mỗi góp ý sẽ giúp góc này lớn lên đúng cách hơn.
          </span>
        </div>

        <form className="home-feedback-form" onSubmit={handleSubmit}>
          <label>
            <span>Lời góp ý</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Bạn muốn nhắn gì cho tụi mình?"
              minLength="6"
              maxLength="1200"
              required
            />
          </label>

          <div className="home-feedback-fields">
            <label>
              <span>Tên của bạn</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Không bắt buộc"
                maxLength="80"
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Để tụi mình phản hồi nếu cần"
                maxLength="160"
              />
            </label>
          </div>

          {status ? <p className={`home-feedback-message is-${status.type}`}>{status.text}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi góp ý'}
          </button>
        </form>
      </section>
    </div>
  )
}

function ReturnStreakPopup({ isOpen, onClose, streak }) {
  if (!isOpen) return null

  return (
    <div className="return-streak-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="return-streak-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-streak-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="return-streak-copy">
          <p>Streak</p>
          <h2 id="return-streak-title">Chuỗi ngày quay lại</h2>
          <strong>{streak.currentStreak} ngày</strong>
        </div>

        <div className="return-streak-milestones" aria-label="Ngày 1 đến ngày 7">
          {streak.milestones.map((milestone) => (
            <div className={streak.currentStreak >= milestone ? 'is-complete' : ''} key={milestone}>
              <span>{milestone}</span>
              <em>Ngày</em>
            </div>
          ))}
        </div>

        <button className="return-streak-close" type="button" onClick={onClose}>
          Đồng ý
        </button>
      </section>
    </div>
  )
}

export function AppLayout({ state }) {
  const introSectionRef = useRef(null)
  const hasStartedAnalyticsRef = useRef(false)
  const [isFloatingHeaderVisible, setIsFloatingHeaderVisible] = useState(false)
  const [activeRoom, setActiveRoom] = useState(getActiveRoomFromHash)
  const [isAnalyticsReportOpen, setIsAnalyticsReportOpen] = useState(getIsAnalyticsReportFromHash)
  const [isProfileOpen, setIsProfileOpen] = useState(getIsProfileFromHash)
  const [activeRoomTransitionColor, setActiveRoomTransitionColor] = useState(null)
  const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false)
  const [quickSpotifySrc, setQuickSpotifySrc] = useState('')
  const [isQuickSpotifyOpen, setIsQuickSpotifyOpen] = useState(false)
  const [visitorAge, setVisitorAge] = useState('')
  const [visitorGender, setVisitorGender] = useState('')
  const [visitorProfileError, setVisitorProfileError] = useState('')
  const [isVisitorProfileSaving, setIsVisitorProfileSaving] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [returnStreak, setReturnStreak] = useState(getReturnStreak)
  const [isReturnStreakPopupOpen, setIsReturnStreakPopupOpen] = useState(false)
  const [isWelcomeGuideOpen, setIsWelcomeGuideOpen] = useState(
    () => Boolean(getStoredVisitorProfile()) && shouldShowWelcomeGuide(),
  )
  const [isVisitorPromptOpen, setIsVisitorPromptOpen] = useState(() => !getStoredVisitorProfile())

  const handleReturnStreakPopupOpen = useCallback(() => {
    if (!shouldShowReturnStreakPopup()) return

    setReturnStreak(getReturnStreak())
    setIsReturnStreakPopupOpen(true)
  }, [])

  const handleReturnStreakPopupClose = useCallback(() => {
    markReturnStreakPopupSeen()
    setIsReturnStreakPopupOpen(false)
  }, [])

  const {
    activeAmbientSound,
    activeShareFrame,
    activeShareFrameId,
    activeTimerMessage,
    allShareFrames,
    canAddIceCube,
    copy,
    customFrameInputRef,
    decisionAnimationKey,
    decisionMessage,
    decisionMotion,
    decisionThread,
    draggingIcePosition,
    handleAddCustomFrame,
    handleAmbientSoundToggle,
    handleAskDecision,
    handleBeginMoveShareSticker,
    handleColorShareSticker,
    handleCopyShareQuote,
    handleDownloadShareImage,
    handleFlipShareSticker,
    handleIceCubeCountChange,
    handleIceDragEnd,
    handleIceDragStart,
    handleInterfaceClick,
    handleNativeShareQuote,
    handleOpenLetter,
    handleMoveShareSticker,
    handlePlaceShareSticker,
    handleResizeShareSticker,
    handleRemoveShareSticker,
    handleResetShareStickers,
    handleRotateShareSticker,
    handleResetTimer,
    handleSelectShareFrame,
    handleShareInstagramStory,
    handleShareQuote,
    handleSkipBreak,
    handleStartBreak,
    handleTimerStartToggle,
    handleTransformShareSticker,
    handleToggleSaveQuote,
    handleUndoShareSticker,
    iceCubeCount,
    iceCupRef,
    iceDropAnimationKey,
    iceDropDepth,
    iceFadeProgress,
    iceFloatLift,
    iceImpactBottom,
    iceMeltProgress,
    iceShrinkProgress,
    iceWaterProgress,
    iceWaterSurface,
    isIceDroppingIntoCup,
    isQuoteSaved,
    isShareSheetOpen,
    isTimerRunning,
    maxSelectableIceCubes,
    openedLetter,
    openedLetterId,
    placedShareStickers,
    quote,
    quoteLetters,
    secondsLeft,
    setDraggingIcePosition,
    setIsShareSheetOpen,
    setShareTextColor,
    shareQuoteFontSize,
    shareStickerHistoryCount,
    shareTextColor,
    toastMessage,
    timerPhase,
  } = state
  const activeAnalyticsRoom = activeRoom === 'play-room' ? 'sound-room' : activeRoom || 'home'
  const isUtilityPageOpen = isAnalyticsReportOpen || isProfileOpen

  useEffect(() => {
    if (activeRoom || isUtilityPageOpen) {
      return undefined
    }

    const updateFloatingHeader = () => {
      const introSection = introSectionRef.current
      if (!introSection) return

      setIsFloatingHeaderVisible(introSection.getBoundingClientRect().bottom <= 0)
    }

    updateFloatingHeader()
    window.addEventListener('scroll', updateFloatingHeader, { passive: true })
    window.addEventListener('resize', updateFloatingHeader)

    return () => {
      window.removeEventListener('scroll', updateFloatingHeader)
      window.removeEventListener('resize', updateFloatingHeader)
    }
  }, [activeRoom, isUtilityPageOpen])

  useEffect(() => {
    if (activeRoom || isUtilityPageOpen) return undefined

    uniqueHomePriorityAssets.forEach(preloadImage)
    return undefined
  }, [activeRoom, isUtilityPageOpen])

  useEffect(() => {
    const handleReturnStreakChanged = (event) => {
      setReturnStreak(event.detail?.streak || getReturnStreak())
    }

    window.addEventListener(returnStreakChangedEventName, handleReturnStreakChanged)
    const updateTimeout = window.setTimeout(updateReturnStreak, 0)

    return () => {
      window.clearTimeout(updateTimeout)
      window.removeEventListener(returnStreakChangedEventName, handleReturnStreakChanged)
    }
  }, [])

  useEffect(() => {
    if (isUtilityPageOpen) return undefined

    let isCancelled = false

    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (isCancelled) return

        const userProfile = data.user
        if (userProfile) {
          handleReturnStreakPopupOpen()
        }

        const hasCompleteUserProfile = Number.isInteger(userProfile?.age) && Boolean(userProfile?.gender)

        if (hasCompleteUserProfile) {
          storeVisitorProfile(userProfile)
          identifyVisitor(userProfile).catch(() => undefined)
          setIsVisitorPromptOpen(false)
          setIsWelcomeGuideOpen(shouldShowWelcomeGuide())
          return
        }

        const storedProfile = getStoredVisitorProfile()

        if (storedProfile) {
          identifyVisitor(storedProfile).catch(() => undefined)
          return
        }

        return getVisitorProfile()
          .then((profile) => {
            if (isCancelled) return

            const hasCompleteProfile = Number.isInteger(profile?.age) && Boolean(profile?.gender)
            setIsVisitorPromptOpen(!hasCompleteProfile)

            if (hasCompleteProfile) {
              storeVisitorProfile(profile)
              setIsWelcomeGuideOpen(shouldShowWelcomeGuide())
            }
          })
      })
      .catch(() => {
        if (isCancelled) return

        const storedProfile = getStoredVisitorProfile()
        if (storedProfile) {
          identifyVisitor(storedProfile).catch(() => undefined)
          return
        }

        setIsVisitorPromptOpen(true)
      })

    return () => {
      isCancelled = true
    }
  }, [handleReturnStreakPopupOpen, isUtilityPageOpen])

  useEffect(() => {
    const handleAuthChanged = (event) => {
      const userProfile = event.detail?.user
      if (userProfile) {
        updateReturnStreak()
          .then(() => handleReturnStreakPopupOpen())
          .catch(() => handleReturnStreakPopupOpen())
      }

      const hasCompleteUserProfile = Number.isInteger(userProfile?.age) && Boolean(userProfile?.gender)

      if (!hasCompleteUserProfile) return

      storeVisitorProfile(userProfile)
      identifyVisitor(userProfile).catch(() => undefined)
      setIsVisitorPromptOpen(false)
    }

    window.addEventListener('love-yourself-auth-changed', handleAuthChanged)
    return () => window.removeEventListener('love-yourself-auth-changed', handleAuthChanged)
  }, [handleReturnStreakPopupOpen])

  useEffect(() => {
    if (isUtilityPageOpen) return
    if (hasStartedAnalyticsRef.current) return
    hasStartedAnalyticsRef.current = true
    startAnalyticsSession(activeAnalyticsRoom)
  }, [activeAnalyticsRoom, isUtilityPageOpen])

  useEffect(() => {
    if (isUtilityPageOpen) return
    trackAnalyticsEvent('room_view', activeAnalyticsRoom)

    if (activeAnalyticsRoom === 'sound-room') {
      trackAnalyticsEvent('spotify_view', 'sound-room')
    }
  }, [activeAnalyticsRoom, isUtilityPageOpen])

  useEffect(() => {
    if (isUtilityPageOpen) return undefined

    const heartbeatId = window.setInterval(() => {
      sendAnalyticsHeartbeat(activeAnalyticsRoom)
    }, 20000)

    const sendFinalHeartbeat = () => {
      sendAnalyticsHeartbeat(activeAnalyticsRoom, { beacon: true })
    }

    window.addEventListener('pagehide', sendFinalHeartbeat)

    return () => {
      window.clearInterval(heartbeatId)
      window.removeEventListener('pagehide', sendFinalHeartbeat)
      sendFinalHeartbeat()
    }
  }, [activeAnalyticsRoom, isUtilityPageOpen])

  useEffect(() => {
    const handleHashChange = () => {
      setActiveRoom(getActiveRoomFromHash())
      setIsAnalyticsReportOpen(getIsAnalyticsReportFromHash())
      setIsProfileOpen(getIsProfileFromHash())
      window.scrollTo(0, 0)
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    let observer
    const animationFrame = window.requestAnimationFrame(() => {
      const animatedElements = document.querySelectorAll('.scroll-pop')

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
            } else {
              entry.target.classList.remove('is-visible')
            }
          })
        },
        { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
      )

      animatedElements.forEach((element) => observer.observe(element))
    })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer?.disconnect()
    }
  }, [activeRoom])

  const handleRoomNavigate = useCallback((link) => {
    if (link.room === activeRoom || (activeRoom === 'play-room' && link.room === 'sound-room')) return

    setIsRoomSwitcherOpen(false)
    setActiveRoomTransitionColor(link.color || '#F8DB8E')

    window.setTimeout(() => {
      window.location.hash = link.href
    }, roomTransitionRouteDelay)

    window.setTimeout(() => {
      setActiveRoomTransitionColor(null)
    }, roomTransitionDuration)
  }, [activeRoom])

  const handleQuickSpotifyToggle = useCallback(() => {
    if (quickSpotifySrc) {
      setIsQuickSpotifyOpen((isOpen) => !isOpen)
      return
    }

    setQuickSpotifySrc(quickSpotifyEmbed)
    setIsQuickSpotifyOpen(true)
  }, [quickSpotifySrc])

  const availableRoomSwitcherLinks = useMemo(() => (
    roomSwitcherLinks.filter((link) => (
      !(link.room === activeRoom || (activeRoom === 'play-room' && link.room === 'sound-room'))
    ))
  ), [activeRoom])

  const quickSpotifyControl = activeRoom ? (
    <div className={`quick-spotify ${quickSpotifySrc ? 'is-playing' : ''} ${isQuickSpotifyOpen ? 'is-open' : ''}`}>
      {quickSpotifySrc ? (
        <div className="quick-spotify-player-shell">
          <iframe
            className="quick-spotify-player"
            title="Spotify ngẫu nhiên"
            src={quickSpotifySrc}
            width="100%"
            height="86"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      ) : null}

      <button
        className="quick-spotify-button"
        type="button"
        aria-label={quickSpotifySrc && isQuickSpotifyOpen ? 'Thu gọn Spotify' : 'Mở Spotify'}
        aria-pressed={Boolean(quickSpotifySrc && isQuickSpotifyOpen)}
        onClick={handleQuickSpotifyToggle}
      >
        <img src={quickSpotifyButtonSrc} alt="" aria-hidden="true" />
      </button>
    </div>
  ) : null

  const roomSwitcher = activeRoom ? (
    <div className={`room-switcher ${isRoomSwitcherOpen ? 'is-open' : ''}`}>
      {activeAmbientSound ? (
        <button
          className="room-sound-stop"
          type="button"
          aria-label="Tắt âm thanh nền"
          title="Tắt âm thanh nền"
          onClick={() => handleAmbientSoundToggle(activeAmbientSound)}
        >
          <SoundOffIcon />
        </button>
      ) : null}

      <button
        className="room-switcher-trigger"
        type="button"
        aria-label="Mở menu chuyển phòng"
        aria-expanded={isRoomSwitcherOpen}
        onClick={() => setIsRoomSwitcherOpen((current) => !current)}
      >
        <img src={roomSwitcherIconSrc} alt="" aria-hidden="true" />
      </button>

      <nav className="room-switcher-options" aria-label="Chuyển phòng">
        {availableRoomSwitcherLinks.map((link) => {
          const isActive = link.room === activeRoom || (activeRoom === 'play-room' && link.room === 'sound-room')

          return (
            <button
              className={`room-switcher-option ${isActive ? 'is-active' : ''}`}
              type="button"
              key={link.room}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleRoomNavigate(link)}
            >
              {link.label}
            </button>
          )
        })}
      </nav>
    </div>
  ) : null

  const handleVisitorProfileSubmit = useCallback(async (event) => {
    event.preventDefault()

    const normalizedAge = Number(visitorAge)
    if (!Number.isInteger(normalizedAge) || normalizedAge < 1 || normalizedAge > 120) {
      setVisitorProfileError('Anh nhập tuổi từ 1 đến 120 giúp em nha.')
      return
    }

    if (!visitorGender) {
      setVisitorProfileError('Anh chọn giới tính giúp em nha.')
      return
    }

    setIsVisitorProfileSaving(true)
    setVisitorProfileError('')

    const localProfile = { age: normalizedAge, gender: visitorGender }
    storeVisitorProfile(localProfile)

    try {
      await identifyVisitor(localProfile)
      setIsVisitorPromptOpen(false)
      setIsWelcomeGuideOpen(true)
    } catch {
      setIsVisitorPromptOpen(false)
      setIsWelcomeGuideOpen(true)
    } finally {
      setIsVisitorProfileSaving(false)
    }
  }, [visitorAge, visitorGender])

  const handleWelcomeGuideClose = useCallback(() => {
    window.localStorage.setItem(welcomeGuideLastSeenStorageKey, String(Date.now()))
    setIsWelcomeGuideOpen(false)
  }, [])

  const handleFeedbackOpen = useCallback(() => {
    setIsFeedbackOpen(true)
  }, [])

  const handleFeedbackClose = useCallback(() => {
    setIsFeedbackOpen(false)
  }, [])

  const handleShareSheetClose = useCallback(() => {
    setIsShareSheetOpen(false)
  }, [setIsShareSheetOpen])

  const header = (
    <SiteHeader
      variant="static"
      onFeedbackOpen={handleFeedbackOpen}
    />
  )

  const cardRoom = (
    <RoomSection
      body="Phòng thiệp là nơi dành cho những lúc anh muốn nhận một lời nhắn nhẹ nhàng trước khi bước tiếp trong ngày. Mỗi phong thư giống như một mảnh giấy nhỏ được gửi đến đúng lúc: có thể là một câu an ủi, một lời nhắc để yêu bản thân hơn, hoặc một góc nhìn giúp mình bình tĩnh lại. Sau khi mở thư, nếu trong lòng vẫn còn phân vân, anh có thể kéo xuống hỏi vị thần quyết định để nhận thêm một dấu hiệu nhỏ, như một câu trả lời mềm mại thay vì phải tự ép mình chọn ngay."
      eyebrow="Phòng thiệp"
      id="card-room"
      title="Nhận một lời nhắn dành cho hôm nay."
    >
      <QuoteSection
        copy={copy}
        isQuoteSaved={isQuoteSaved}
        onOpenLetter={handleOpenLetter}
        onShareQuote={handleShareQuote}
        onToggleSaveQuote={handleToggleSaveQuote}
        openedLetter={openedLetter}
        openedLetterId={openedLetterId}
        quote={quote}
        quoteLetters={quoteLetters}
      />

      <DecisionSection
        copy={copy}
        decisionAnimationKey={decisionAnimationKey}
        decisionMessage={decisionMessage}
        decisionMotion={decisionMotion}
        decisionThread={decisionThread}
        onAskDecision={handleAskDecision}
      />
    </RoomSection>
  )

  const focusRoom = (
    <RoomSection
      body="Phòng tập trung được làm cho những lúc anh muốn quay lại với việc cần làm nhưng không muốn cảm giác quá căng thẳng. Anh có thể chọn một âm thanh nền hợp tâm trạng trước, rồi kéo từng viên đá vào ly để bắt đầu một phiên tập trung. Mỗi viên đá tan dần giống như một nhịp thời gian nhìn thấy được: mình học, làm việc, nghỉ ngơi, rồi quay lại tiếp theo cách rõ ràng hơn. Không cần phải hoàn hảo ngay, chỉ cần ở lại với một việc nhỏ đủ lâu."
      eyebrow="Phòng tập trung"
      id="focus-room"
      title="Bắt đầu một phiên tập trung nhẹ nhàng."
    >
      <AmbientSection
        activeAmbientSound={activeAmbientSound}
        copy={copy}
        onAmbientSoundToggle={handleAmbientSoundToggle}
        soundOptions={ambientSoundOptions}
      />

      <FocusSection
        activeTimerMessage={activeTimerMessage}
        canAddIceCube={canAddIceCube}
        copy={copy}
        draggingIcePosition={draggingIcePosition}
        iceCubeCount={iceCubeCount}
        iceCubeSeconds={iceCubeSeconds}
        iceCupRef={iceCupRef}
        iceDropAnimationKey={iceDropAnimationKey}
        iceDropDepth={iceDropDepth}
        iceFadeProgress={iceFadeProgress}
        iceFloatLift={iceFloatLift}
        iceImpactBottom={iceImpactBottom}
        iceMeltProgress={iceMeltProgress}
        iceShrinkProgress={iceShrinkProgress}
        iceStackLayout={iceStackLayout}
        iceWaterProgress={iceWaterProgress}
        iceWaterSurface={iceWaterSurface}
        isIceDroppingIntoCup={isIceDroppingIntoCup}
        isTimerRunning={isTimerRunning}
        maxIceCubes={maxIceCubes}
        maxSelectableIceCubes={maxSelectableIceCubes}
        onIceCubeCountChange={handleIceCubeCountChange}
        onIceDragCancel={() => setDraggingIcePosition(null)}
        onIceDragEnd={handleIceDragEnd}
        onIceDragStart={handleIceDragStart}
        onResetTimer={handleResetTimer}
        onSkipBreak={handleSkipBreak}
        onStartBreak={handleStartBreak}
        onTimerStartToggle={handleTimerStartToggle}
        secondsLeft={secondsLeft}
        timerPhase={timerPhase}
      />
    </RoomSection>
  )

  const soundRoom = (
    <RoomSection
      body="Phòng âm thanh là chỗ để anh đổi nhịp thật nhanh khi tâm trạng đang hơi chùng, hơi rối, hoặc đơn giản là muốn có một nền nhạc đi cùng mình. Anh chỉ cần chọn playlist Spotify, bật một bài hợp với khoảnh khắc hiện tại, rồi để âm nhạc mở ra một không khí mới trong vài phút. Phòng này không bắt mình phải làm gì nhiều; nó chỉ giữ một khoảng trống nhỏ để cơ thể thả lỏng, suy nghĩ dịu lại, và cảm xúc có thời gian tự mềm xuống."
      eyebrow="Phòng âm thanh"
      id="sound-room"
      title="Chọn nhạc cho tâm trạng lúc này."
    >
      <PlaylistSection copy={copy} />
    </RoomSection>
  )

  const healingRoom = (
    <RoomSection
      body="Phòng chữa lành là nơi để anh đặt cảm xúc xuống một chút khi trong lòng đang rối, mệt, buồn, hoặc thấy mình bị áp lực kéo đi quá xa. Phòng này không bắt anh phải vui lên ngay; nó chỉ đưa anh quay lại với cơ thể, với hơi thở, với vài điều đang có thật quanh mình. Từ đó mình có thể mềm hơn với bản thân, rồi chọn bước tiếp theo bằng một nhịp bình tĩnh hơn."
      eyebrow="Phòng chữa lành"
      id="healing-room"
      title="Quay lại với mình bằng một nhịp dịu hơn."
    >
      <HealingSection />
    </RoomSection>
  )

  const activeRoomContent = {
    'card-room': cardRoom,
    'focus-room': focusRoom,
    'healing-room': healingRoom,
    'sound-room': soundRoom,
    'play-room': soundRoom,
    community: <CommunitySection />,
    'diary-room': (
      <RoomSection
        eyebrow="Phòng nhật ký"
        id="diary-room"
        title="Phòng nhật ký"
      >
        <DiarySection />
      </RoomSection>
    ),
  }[activeRoom]

  return (
    <main
      className={`landing-page ${activeRoom ? `landing-page-room landing-page-${activeRoom}` : ''} ${
        isAnalyticsReportOpen ? 'landing-page-analytics' : ''
      } ${
        isProfileOpen ? 'landing-page-profile' : ''
      } ${
        draggingIcePosition && !draggingIcePosition.isDropping && !draggingIcePosition.isReturning ? 'is-dragging-ice' : ''
      }`}
      onClickCapture={handleInterfaceClick}
    >
      <AmbientVisualEffect activeSound={activeAmbientSound} />

      {isAnalyticsReportOpen ? (
        <>
          <AnalyticsReport />
        </>
      ) : isProfileOpen ? (
        <UserProfileReport />
      ) : activeRoom ? (
        <>
          <div className="room-page-header">{header}</div>
          {activeRoomContent}
          {quickSpotifyControl}
          {roomSwitcher}
        </>
      ) : (
        <>
          <div className="opening-cluster">
            {header}

            <div ref={introSectionRef}>
              <IntroVideoSection copy={copy} videoUrl={heroVideoUrl} />
            </div>
          </div>

          {isFloatingHeaderVisible ? (
            <SiteHeader
              variant="floating"
              onFeedbackOpen={handleFeedbackOpen}
            />
          ) : null}

          <div className="home-roll-stack">
            <WheelNavSection onRoomNavigate={handleRoomNavigate} />
            <CommunityIntroSection onCommunityNavigate={handleRoomNavigate} />
            <DiaryIntroSection onDiaryNavigate={handleRoomNavigate} />
            <OfficialSiteIntroSection />
          </div>
        </>
      )}

      {activeRoomTransitionColor ? (
        <div
          className="room-transition-overlay"
          style={{ '--room-transition-color': activeRoomTransitionColor }}
          aria-hidden="true"
        >
          <img className="room-transition-mascot" src={transitionMascotSrc} alt="" />
        </div>
      ) : null}

      <ShareSheet
        activeShareFrame={activeShareFrame}
        activeShareFrameId={activeShareFrameId}
        allShareFrames={allShareFrames}
        copy={copy}
        customFrameInputRef={customFrameInputRef}
        isOpen={isShareSheetOpen}
        onAddCustomFrame={handleAddCustomFrame}
        onBeginMoveShareSticker={handleBeginMoveShareSticker}
        onColorShareSticker={handleColorShareSticker}
        onClose={handleShareSheetClose}
        onCopyShareQuote={handleCopyShareQuote}
        onDownloadShareImage={handleDownloadShareImage}
        onFlipShareSticker={handleFlipShareSticker}
        onNativeShareQuote={handleNativeShareQuote}
        onMoveShareSticker={handleMoveShareSticker}
        onPlaceShareSticker={handlePlaceShareSticker}
        onResizeShareSticker={handleResizeShareSticker}
        onRemoveShareSticker={handleRemoveShareSticker}
        onResetShareStickers={handleResetShareStickers}
        onRotateShareSticker={handleRotateShareSticker}
        onSelectShareFrame={handleSelectShareFrame}
        onShareInstagramStory={handleShareInstagramStory}
        onTextColorChange={setShareTextColor}
        onTransformShareSticker={handleTransformShareSticker}
        onUndoShareSticker={handleUndoShareSticker}
        placedShareStickers={placedShareStickers}
        quote={quote}
        shareQuoteFontSize={shareQuoteFontSize}
        shareStickerHistoryCount={shareStickerHistoryCount}
        shareTextColor={shareTextColor}
        shareTextColors={shareTextColors}
      />

      <Toast message={toastMessage} />

      <FeedbackPopup isOpen={isFeedbackOpen} onClose={handleFeedbackClose} />

      <ReturnStreakPopup
        isOpen={isReturnStreakPopupOpen}
        onClose={handleReturnStreakPopupClose}
        streak={returnStreak}
      />

      {isVisitorPromptOpen && !isUtilityPageOpen ? (
        <div className="visitor-prompt-backdrop">
          <form className="visitor-prompt" aria-label="Thông tin người dùng" onSubmit={handleVisitorProfileSubmit}>
            <div className="visitor-prompt-heading">
              <p>Trước khi mình bắt đầu</p>
              <h2>Cho mình biết thêm một chút nha.</h2>
            </div>

            <label className="visitor-field">
              <span>Tuổi</span>
              <input
                type="number"
                min="1"
                max="120"
                inputMode="numeric"
                value={visitorAge}
                onChange={(event) => setVisitorAge(event.target.value)}
                placeholder="Nhập tuổi"
              />
            </label>

            <fieldset className="visitor-field visitor-gender-field">
              <legend>Giới tính</legend>
              <div className="visitor-gender-options">
                {visitorGenderOptions.map((option) => (
                  <label className={visitorGender === option.value ? 'is-selected' : ''} key={option.value}>
                    <input
                      type="radio"
                      name="visitor-gender"
                      value={option.value}
                      checked={visitorGender === option.value}
                      onChange={(event) => setVisitorGender(event.target.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {visitorProfileError ? <p className="visitor-prompt-error">{visitorProfileError}</p> : null}

            <button className="visitor-prompt-submit" type="submit" disabled={isVisitorProfileSaving}>
              {isVisitorProfileSaving ? 'Đang lưu...' : 'Bắt đầu'}
            </button>
          </form>
        </div>
      ) : null}

      {isWelcomeGuideOpen && !isUtilityPageOpen ? (
        <div className="visitor-prompt-backdrop welcome-guide-backdrop">
          <section className="welcome-guide" aria-labelledby="welcome-guide-title">
            <div className="welcome-guide-heading">
              <p>Một chút bí kíp nè</p>
              <h2 id="welcome-guide-title">Mình đi một vòng nha!</h2>
              <span>Trang chủ dẫn bạn tới các căn phòng, còn hai nút nhỏ sẽ luôn đi cùng bạn.</span>
            </div>

            <article className="welcome-guide-home">
              <img src="/PNG/vong-xoay.png" alt="" aria-hidden="true" />
              <div>
                <strong>Bắt đầu từ trang chủ</strong>
                <p>Lướt xuống vòng xoay, chạm hai mũi tên để đổi hướng, rồi chọn tên căn phòng bạn muốn ghé.</p>
              </div>
              <span className="welcome-guide-steps" aria-hidden="true">
                <b>1. Lướt xuống</b>
                <b>2. Xoay vòng</b>
                <b>3. Chọn phòng</b>
              </span>
            </article>

            <p className="welcome-guide-section-label">Khi đã vào một căn phòng</p>

            <div className="welcome-guide-items">
              <article className="welcome-guide-item welcome-guide-spotify">
                <img src={quickSpotifyButtonSrc} alt="" aria-hidden="true" />
                <div>
                  <strong>Nút nghe nhạc</strong>
                  <p>Chạm vào đĩa nhạc để mở hoặc thu gọn Spotify thật nhanh.</p>
                </div>
              </article>

              <article className="welcome-guide-item welcome-guide-rooms">
                <img src={roomSwitcherIconSrc} alt="" aria-hidden="true" />
                <div>
                  <strong>Nút chuyển phòng</strong>
                  <p>Chạm vào mascos này để ghé sang căn phòng khác bất cứ lúc nào.</p>
                </div>
              </article>
            </div>

            <button className="welcome-guide-submit" type="button" onClick={handleWelcomeGuideClose}>
              Mình hiểu rồi, đi thôi!
            </button>
          </section>
        </div>
      ) : null}

    </main>
  )
}
