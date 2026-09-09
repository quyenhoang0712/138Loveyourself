import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ambientSoundOptions,
  heroVideoUrl,
  iceCubeSeconds,
  iceStackLayout,
  maxIceCubes,
  shareTextColors,
} from '../config/appConfig'
import { AmbientVisualEffect } from './AmbientVisualEffect'
import { BottomToolbar } from './BottomToolbar'
import { CloseIcon } from './icons'
import { PageTransitionSkeleton } from './PageTransitionSkeleton'
import { ShareSheet, Toast } from './ShareSheet'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { AmbientSection } from '../sections/AmbientSection'
import { CommunitySection } from '../sections/CommunitySection'
import { DecisionSection } from '../sections/DecisionSection'
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
import { assetUrl } from '../utils/assets'
import { waitForPageContentReady } from '../utils/pageReady'

const roomRoutes = ['card-room', 'focus-room', 'healing-room', 'sound-room', 'play-room', 'community']
const pageTransitionRouteDelay = 100
const pageTransitionMinimumDuration = 1000
const pageTransitionExitDuration = 440
const pageTransitionReadyTimeout = 8000
const visitorProfileStorageKey = 'love-yourself-visitor-profile'
const returnStreakPopupSeenStorageKey = 'love-yourself-return-streak-popup-seen'
const quickSpotifyEmbed = 'https://open.spotify.com/embed/playlist/1pMn6rcoUT3mwTlZpGXIQX?si=7d2c0372d77b4613&nd=1&dlsi=16d348666fc344ef'
const homePriorityAssets = [
  assetUrl('Vector.gif'),
  assetUrl('PNG/giay.png'),
  assetUrl('PNG/ao-khan-len.png'),
]
const uniqueHomePriorityAssets = [...new Set(homePriorityAssets)]
const pageTransitionMeta = {
  home: { label: 'Trang chủ', color: '#F8DB8E' },
  profile: { label: 'Phòng cá nhân', color: '#9AB4EE' },
  analytics: { label: 'Báo cáo', color: '#9AB4EE' },
  community: { label: 'Phòng cộng đồng', color: '#9AB4EE' },
  'card-room': { label: 'Phòng thông điệp', color: '#F8DB8E' },
  'focus-room': { label: 'Phòng tập trung', color: '#4789C8' },
  'healing-room': { label: 'Phòng thư giãn', color: '#F8DB8E' },
  'sound-room': { label: 'Phòng âm nhạc', color: '#4789C8' },
  'play-room': { label: 'Phòng âm nhạc', color: '#4789C8' },
}
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

function getPageKeyFromLocation() {
  if (getIsAnalyticsReportFromHash()) return 'analytics'
  if (getIsProfileFromHash()) return 'profile'
  return getActiveRoomFromHash() || 'home'
}

function preloadImage(src) {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
}

function CommunityIntroSection({ onCommunityNavigate }) {
  const communityLink = { href: '#community', label: 'Cộng đồng', room: 'community', color: '#9AB4EE' }

  return (
    <section
      className="home-community-intro home-community-showcase scroll-pop"
      aria-labelledby="home-community-title"
    >
      <img
        className="home-community-edge"
        src={assetUrl('homepage/home-community-edge.png')}
        alt=""
        aria-hidden="true"
      />

      <div className="home-community-showcase-inner">
        <div className="home-community-showcase-art-frame" aria-hidden="true">
          <img
            className="home-community-showcase-art"
            src={assetUrl('homepage/home-community-art.gif')}
            alt=""
          />
        </div>

        <div className="home-community-copy home-community-showcase-copy">
          <h2 id="home-community-title">
            Cộng đồng
            <span>“học yêu chính mình”</span>
          </h2>
          <p className="home-community-showcase-description">
            Nếu “Love User” chưa biết chia sẻ với ai, thì chúng mình cùng nhau ở đây để đồng hành trên hành
            trình này. Hãy cùng nhau viết nên những câu chuyện thật nhẹ nhàng nhé. Đừng lo lắng, ai trong
            chúng ta cũng có những tổn thương và sai sót mà, luôn vững tin “Love User” nhé.
          </p>
          <button type="button" onClick={() => onCommunityNavigate(communityLink)}>
            Tham gia cộng đồng
          </button>
        </div>
      </div>

      <span className="home-community-showcase-rule" aria-hidden="true" />
    </section>
  )
}

function ProfileIntroSection({ onProfileNavigate }) {
  return (
    <section className="home-profile-intro scroll-pop" aria-labelledby="home-profile-intro-title">
      <div className="home-profile-intro-inner">
        <div className="home-profile-intro-copy">
          <h2 id="home-profile-intro-title">Phòng cá nhân</h2>
          <p>
            Đây là góc nhỏ dành riêng cho bạn. Bạn có thể xem lại những hoạt động mình đã làm trên website,
            lưu lại vài dòng nhật ký những điều đang nghĩ trong đầu. Không cần viết hay hay đầy đủ đâu, cứ để
            mọi thứ ở đây theo cách tự nhiên nhất của bạn nhé.
          </p>
          <button type="button" onClick={onProfileNavigate}>
            Vào phòng cá nhân
          </button>
        </div>

        <img
          className="home-profile-intro-art"
          src={assetUrl('homepage/home-profile-art.gif')}
          alt=""
          aria-hidden="true"
        />
      </div>

      <span className="home-profile-intro-rule" aria-hidden="true" />
    </section>
  )
}

function OfficialSiteIntroSection() {
  return (
    <section className="home-store-intro scroll-pop" aria-labelledby="home-store-intro-title">
      <img
        className="home-store-background"
        src={assetUrl('homepage/home-store-background.png')}
        alt=""
        aria-hidden="true"
      />
      <img
        className="home-store-bubble"
        src={assetUrl('homepage/home-store-bubble.svg')}
        alt=""
        aria-hidden="true"
      />
      <img
        className="home-store-mascot"
        src={assetUrl('homepage/home-store-mascot.png')}
        alt=""
        aria-hidden="true"
      />
      <img
        className="home-store-shop"
        src={assetUrl('homepage/home-store-shop.png')}
        alt=""
        aria-hidden="true"
      />

      <div className="home-store-copy">
        <h2 id="home-store-intro-title">Cửa hàng lưu niệm</h2>
        <p>
          Nếu bạn muốn mang một chút cảm giác dễ thương ở đây về nhà, ghé qua gian hàng lưu niệm của mình
          nhaaa. Ở đó có những món đồ nhỏ để bạn tự tặng mình, hoặc gửi tặng một người bạn thương.
        </p>
        <a href="https://138knitwear.com/" target="_blank" rel="noreferrer">
          Ghé qua cửa hàng lưu niệm
        </a>
      </div>
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
        <div className="return-streak-badge" aria-hidden="true">
          <svg viewBox="0 0 64 76" fill="none">
            <path
              d="M39.5 3.5c-13 7.8-20.6 17.4-20.9 30.3L8.2 30.4c-2.7 6.2-3.8 12-3 17.8C6.5 62.8 17.7 72 32 72c15.7 0 28-11.8 28-27.1 0-9.1-4.1-16.2-12.5-22.7C39 15.8 36.2 10 39.5 3.5Z"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path
              d="M34.5 31.2c-1.2 5.6.6 9.7 5.5 13.5 3.2 2.5 4.8 5.8 4.8 9.8 0 7-5.6 12.3-13 12.3-8.1 0-14.2-5.8-14.2-13.5 0-4.2 1.2-8.3 3.8-12.7l8 3.5c-.2-4.7 1.5-9 5.1-12.9Z"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <button className="return-streak-dismiss" type="button" aria-label="Đóng" onClick={onClose}>
          <CloseIcon />
        </button>

        <div className="return-streak-copy">
          <h2 id="return-streak-title">Chuỗi ngày quay lại</h2>
          <strong aria-label={`${streak.currentStreak} ngày`}>{streak.currentStreak}</strong>
        </div>

        <button className="return-streak-confirm" type="button" onClick={onClose}>
          Tiếp tục giữ chuỗi
        </button>
      </section>
    </div>
  )
}

export function AppLayout({ state }) {
  const introSectionRef = useRef(null)
  const hasStartedAnalyticsRef = useRef(false)
  const pageNavigationTimeoutRef = useRef(null)
  const pageTransitionLockedRef = useRef(false)
  const pageTransitionStartedAtRef = useRef(0)
  const pageTransitionSequenceRef = useRef(0)
  const pageTransitionTargetRef = useRef(null)
  const [isFloatingHeaderVisible, setIsFloatingHeaderVisible] = useState(false)
  const [activeRoom, setActiveRoom] = useState(getActiveRoomFromHash)
  const [isAnalyticsReportOpen, setIsAnalyticsReportOpen] = useState(getIsAnalyticsReportFromHash)
  const [isProfileOpen, setIsProfileOpen] = useState(getIsProfileFromHash)
  const [activePageTransition, setActivePageTransition] = useState(null)
  const [isBottomToolbarHidden, setIsBottomToolbarHidden] = useState(false)
  const [quickSpotifySrc, setQuickSpotifySrc] = useState('')
  const [isQuickSpotifyOpen, setIsQuickSpotifyOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [returnStreak, setReturnStreak] = useState(getReturnStreak)
  const [isReturnStreakPopupOpen, setIsReturnStreakPopupOpen] = useState(false)

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
  const currentPageKey = isAnalyticsReportOpen ? 'analytics' : isProfileOpen ? 'profile' : activeRoom || 'home'
  const currentPageKeyRef = useRef(currentPageKey)

  useEffect(() => {
    currentPageKeyRef.current = currentPageKey
  }, [currentPageKey])

  const beginPageTransition = useCallback(({ color, label, navigate, targetKey }) => {
    if (pageTransitionLockedRef.current || targetKey === currentPageKey) return false

    pageTransitionLockedRef.current = true
    pageTransitionStartedAtRef.current = performance.now()
    pageTransitionSequenceRef.current += 1
    pageTransitionTargetRef.current = targetKey
    setActivePageTransition({
      color,
      id: pageTransitionSequenceRef.current,
      label,
      phase: 'loading',
      targetKey,
    })

    window.clearTimeout(pageNavigationTimeoutRef.current)
    pageNavigationTimeoutRef.current = window.setTimeout(navigate, pageTransitionRouteDelay)
    return true
  }, [currentPageKey])

  useEffect(() => {
    const transitionId = activePageTransition?.id
    if (!transitionId || activePageTransition.phase !== 'loading') return undefined
    if (activePageTransition.targetKey !== currentPageKey) return undefined

    let isCancelled = false
    let minimumDurationTimeout

    async function finishTransitionWhenReady() {
      const pageRoot = document.querySelector('.landing-page')
      await waitForPageContentReady(pageRoot, pageTransitionReadyTimeout)
      if (isCancelled) return

      const elapsed = performance.now() - pageTransitionStartedAtRef.current
      const remainingMinimumDuration = Math.max(0, pageTransitionMinimumDuration - elapsed)

      minimumDurationTimeout = window.setTimeout(() => {
        if (isCancelled) return
        setActivePageTransition((transition) => (
          transition?.id === transitionId ? { ...transition, phase: 'leaving' } : transition
        ))
      }, remainingMinimumDuration)
    }

    finishTransitionWhenReady()

    return () => {
      isCancelled = true
      window.clearTimeout(minimumDurationTimeout)
    }
  }, [activePageTransition, currentPageKey])

  useEffect(() => {
    const transitionId = activePageTransition?.id
    if (!transitionId || activePageTransition.phase !== 'leaving') return undefined

    const exitTimeout = window.setTimeout(() => {
      setActivePageTransition((transition) => (transition?.id === transitionId ? null : transition))
      pageTransitionLockedRef.current = false
      pageTransitionTargetRef.current = null
    }, pageTransitionExitDuration)

    return () => window.clearTimeout(exitTimeout)
  }, [activePageTransition])

  useEffect(() => () => {
    window.clearTimeout(pageNavigationTimeoutRef.current)
  }, [])

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

            if (hasCompleteProfile) {
              storeVisitorProfile(profile)
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
      const targetKey = getPageKeyFromLocation()

      if (targetKey !== currentPageKeyRef.current && targetKey !== pageTransitionTargetRef.current) {
        const transitionMeta = pageTransitionMeta[targetKey] || pageTransitionMeta.home

        pageTransitionLockedRef.current = true
        pageTransitionStartedAtRef.current = performance.now()
        pageTransitionSequenceRef.current += 1
        pageTransitionTargetRef.current = targetKey
        setActivePageTransition({
          ...transitionMeta,
          id: pageTransitionSequenceRef.current,
          phase: 'loading',
          targetKey,
        })
      }

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
      const animatedElements = document.querySelectorAll('.scroll-pop:not(.is-visible)')

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer.unobserve(entry.target)
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

    beginPageTransition({
      color: link.color || '#F8DB8E',
      label: link.label,
      targetKey: link.room,
      navigate: () => {
        window.location.hash = link.href
      },
    })
  }, [activeRoom, beginPageTransition])

  const handleQuickSpotifyToggle = useCallback(() => {
    if (quickSpotifySrc) {
      setIsQuickSpotifyOpen((isOpen) => !isOpen)
      return
    }

    setQuickSpotifySrc(quickSpotifyEmbed)
    setIsQuickSpotifyOpen(true)
  }, [quickSpotifySrc])

  const handleHomeNavigate = useCallback(() => {
    if (currentPageKey === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    beginPageTransition({
      ...pageTransitionMeta.home,
      targetKey: 'home',
      navigate: () => {
        window.location.hash = ''
      },
    })
  }, [beginPageTransition, currentPageKey])

  const handleProfileNavigate = useCallback(() => {
    beginPageTransition({
      ...pageTransitionMeta.profile,
      targetKey: 'profile',
      navigate: () => {
        window.location.hash = '#profile'
      },
    })
  }, [beginPageTransition])

  const handleShopOpen = useCallback(() => {
    window.open('https://138knitwear.com/', '_blank', 'noopener,noreferrer')
  }, [])

  const handleBottomToolbarHiddenToggle = useCallback(() => {
    setIsBottomToolbarHidden((isHidden) => !isHidden)
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
      onHomeNavigate={handleHomeNavigate}
      onProfileNavigate={handleProfileNavigate}
    />
  )

  const cardRoom = (
    <RoomSection
      id="card-room"
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
      id="focus-room"
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
      id="sound-room"
    >
      <PlaylistSection copy={copy} />
    </RoomSection>
  )

  const healingRoom = (
    <RoomSection
      id="healing-room"
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
      aria-busy={Boolean(activePageTransition)}
      onClickCapture={handleInterfaceClick}
    >
      <AmbientVisualEffect activeSound={activeAmbientSound} />

      {isAnalyticsReportOpen ? (
        <>
          <AnalyticsReport />
        </>
      ) : isProfileOpen ? (
        <UserProfileReport onHomeNavigate={handleHomeNavigate} />
      ) : activeRoom ? (
        <>
          <div className="room-page-header">{header}</div>
          {activeRoomContent}
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
              onHomeNavigate={handleHomeNavigate}
              onProfileNavigate={handleProfileNavigate}
            />
          ) : null}

          <div className="home-roll-stack">
            <WheelNavSection onRoomNavigate={handleRoomNavigate} />
            <CommunityIntroSection onCommunityNavigate={handleRoomNavigate} />
            <ProfileIntroSection onProfileNavigate={handleProfileNavigate} />
            <OfficialSiteIntroSection />
          </div>
        </>
      )}

      <SiteFooter />

      {!isAnalyticsReportOpen ? (
        <BottomToolbar
          activeRoom={activeRoom}
          isHidden={isBottomToolbarHidden}
          isHomeActive={!activeRoom && !isProfileOpen}
          isProfileActive={isProfileOpen}
          isQuickSpotifyOpen={isQuickSpotifyOpen}
          quickSpotifySrc={quickSpotifySrc}
          onHomeNavigate={handleHomeNavigate}
          onProfileNavigate={handleProfileNavigate}
          onQuickSpotifyToggle={handleQuickSpotifyToggle}
          onToggleHidden={handleBottomToolbarHiddenToggle}
          onRoomNavigate={handleRoomNavigate}
          onShopOpen={handleShopOpen}
        />
      ) : null}

      {activePageTransition ? <PageTransitionSkeleton {...activePageTransition} /> : null}

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


    </main>
  )
}
