import { useEffect, useRef, useState } from 'react'
import {
  ambientSoundOptions,
  heroVideoUrl,
  iceCubeSeconds,
  iceStackLayout,
  maxIceCubes,
  shareTextColors,
} from '../config/appConfig'
import { AmbientVisualEffect } from './AmbientVisualEffect'
import { SoundOffIcon } from './icons'
import { ShareSheet, Toast } from './ShareSheet'
import { SiteHeader } from './SiteHeader'
import { AmbientSection } from '../sections/AmbientSection'
import { DecisionSection } from '../sections/DecisionSection'
import { FocusSection } from '../sections/FocusSection'
import { HealingSection } from '../sections/HealingSection'
import { IntroVideoSection } from '../sections/IntroVideoSection'
import { PlaylistSection } from '../sections/PlaylistSection'
import { AnalyticsReport } from '../sections/AnalyticsReport'
import { QuoteSection } from '../sections/QuoteSection'
import { RoomSection } from '../sections/RoomSection'
import { WheelNavSection } from '../sections/WheelNavSection'
import { getAnalyticsIds, identifyVisitor, sendAnalyticsHeartbeat, startAnalyticsSession, trackAnalyticsEvent } from '../utils/analytics'

const roomRoutes = ['card-room', 'focus-room', 'healing-room', 'sound-room', 'play-room']
const roomTransitionDuration = 1300
const roomTransitionRouteDelay = 1300
const visitorProfileStorageKey = 'love-yourself-visitor-profile'
const transitionMascotSrc = '/PNG/tay-trai-tim.png'
const quickSpotifyButtonSrc = '/PNG/dia-than.png'
const quickSpotifyEmbed = 'https://open.spotify.com/embed/playlist/1yd3LjXq6a5EXVA11w7UPH?utm_source=generator&theme=0'
const roomSwitcherIconSrc = '/PNG/mascot-ong-nhom.png'
const homePngIcons = [
  '/PNG/mascot-nhay.png',
  '/PNG/giay-2.png',
  '/PNG/may-anh.png',
  '/PNG/giay-3.png',
  '/PNG/mascot-khien-do.png',
  '/PNG/sofa-2.png',
  '/PNG/ngoi-sao.png',
  '/PNG/sofa-3.png',
  '/PNG/tay-trai-tim.png',
  '/PNG/mascot-da-chan.png',
  '/PNG/hoa-ly.png',
  '/PNG/banh-co-to-giay.png',
  '/PNG/headphone.png',
  '/PNG/thu-tay.png',
  '/PNG/ly-but.png',
  '/PNG/ao-khan-len.png',
  '/PNG/ngu-coc.png',
  '/PNG/dia-than.png',
  '/PNG/messenger.png',
  '/PNG/mascot-ngu.png',
  '/PNG/hop-nhac.png',
  '/PNG/hop.png',
  '/PNG/cuon-len.png',
  '/PNG/sofa.png',
  '/PNG/xe-dap-3.png',
  '/PNG/nhan-nut-warning.png',
  '/PNG/bo-hoa.png',
  '/PNG/xe-dap-2.png',
  '/PNG/roi-nui.png',
  '/PNG/goi.png',
  '/PNG/cua-so.png',
  '/PNG/xe-dap-1.png',
  '/PNG/hop-tim.png',
  '/PNG/have-a-nice-day.png',
  '/PNG/xe-dap-4.png',
  '/PNG/vong-xoay.png',
  '/PNG/dong-ho.png',
  '/PNG/hop-mascot.png',
  '/PNG/brush.png',
  '/PNG/mascot-ong-nhom.png',
  '/PNG/khung-nhac.png',
  '/PNG/note.png',
  '/PNG/radio.png',
  '/PNG/giay.png',
  '/PNG/mascot-cam-loa.png',
  '/PNG/ipod.png',
]
const roomSwitcherLinks = [
  { href: '#card-room', label: 'Thiệp', room: 'card-room', color: '#9AB4EE' },
  { href: '#focus-room', label: 'Tập trung', room: 'focus-room', color: '#F8DB8E' },
  { href: '#healing-room', label: 'Chữa lành', room: 'healing-room', color: '#4789C8' },
  { href: '#sound-room', label: 'Âm thanh', room: 'sound-room', color: '#EBAAB4' },
]

function getActiveRoomFromHash() {
  if (typeof window === 'undefined') return null

  const hashRoom = window.location.hash.replace('#', '')
  return roomRoutes.includes(hashRoom) ? hashRoom : null
}

function getIsAnalyticsReportFromHash() {
  if (typeof window === 'undefined') return false

  return window.location.hash.replace('#', '') === 'analytics'
}

function HomePngShelf() {
  return (
    <section className="home-png-shelf" aria-label="Trang trí">
      <div className="home-png-cloud" aria-hidden="true">
        {homePngIcons.map((src, index) => (
          <img
            className="home-png-icon"
            src={src}
            alt=""
            key={src}
            style={{
              '--icon-y': `${(index % 5) * -3}px`,
              '--icon-hover-y': `${(index % 5) * -3 - 6}px`,
              '--icon-rotate': `${((index % 7) - 3) * 2}deg`,
            }}
          />
        ))}
      </div>
    </section>
  )
}

export function AppLayout({ state }) {
  const introSectionRef = useRef(null)
  const hasStartedAnalyticsRef = useRef(false)
  const [isFloatingHeaderVisible, setIsFloatingHeaderVisible] = useState(false)
  const [activeRoom, setActiveRoom] = useState(getActiveRoomFromHash)
  const [isAnalyticsReportOpen, setIsAnalyticsReportOpen] = useState(getIsAnalyticsReportFromHash)
  const [roomTransitionColor, setRoomTransitionColor] = useState(null)
  const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false)
  const [quickSpotifySrc, setQuickSpotifySrc] = useState('')
  const [isQuickSpotifyOpen, setIsQuickSpotifyOpen] = useState(false)
  const [visitorAge, setVisitorAge] = useState('')
  const [visitorGender, setVisitorGender] = useState('')
  const [visitorProfileError, setVisitorProfileError] = useState('')
  const [isVisitorPromptOpen, setIsVisitorPromptOpen] = useState(() => {
    if (typeof window === 'undefined') return false

    return !window.localStorage.getItem(visitorProfileStorageKey)
  })

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
    handleCopyShareQuote,
    handleDownloadShareImage,
    handleIceCubeCountChange,
    handleIceDragEnd,
    handleIceDragStart,
    handleInterfaceClick,
    handleNativeShareQuote,
    handleOpenLetter,
    handleResetTimer,
    handleSelectShareFrame,
    handleShareInstagramStory,
    handleShareQuote,
    handleSkipBreak,
    handleStartBreak,
    handleTimerStartToggle,
    handleToggleSaveQuote,
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
    quote,
    quoteLetters,
    secondsLeft,
    setDraggingIcePosition,
    setIsShareSheetOpen,
    setShareTextColor,
    shareQuoteFontSize,
    shareTextColor,
    toastMessage,
    timerPhase,
  } = state
  const activeAnalyticsRoom = activeRoom === 'play-room' ? 'sound-room' : activeRoom || 'home'

  useEffect(() => {
    if (activeRoom || isAnalyticsReportOpen) {
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
  }, [activeRoom, isAnalyticsReportOpen])

  useEffect(() => {
    if (isAnalyticsReportOpen) return
    if (hasStartedAnalyticsRef.current) return
    hasStartedAnalyticsRef.current = true
    startAnalyticsSession(activeAnalyticsRoom)
  }, [activeAnalyticsRoom, isAnalyticsReportOpen])

  useEffect(() => {
    if (isAnalyticsReportOpen) return
    trackAnalyticsEvent('room_view', activeAnalyticsRoom)

    if (activeAnalyticsRoom === 'sound-room') {
      trackAnalyticsEvent('spotify_view', 'sound-room')
    }
  }, [activeAnalyticsRoom, isAnalyticsReportOpen])

  useEffect(() => {
    if (isAnalyticsReportOpen) return undefined

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
  }, [activeAnalyticsRoom, isAnalyticsReportOpen])

  useEffect(() => {
    const handleHashChange = () => {
      setActiveRoom(getActiveRoomFromHash())
      setIsAnalyticsReportOpen(getIsAnalyticsReportFromHash())
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

  const handleRoomNavigate = (link) => {
    if (link.room === activeRoom || (activeRoom === 'play-room' && link.room === 'sound-room')) return

    setIsRoomSwitcherOpen(false)
    setRoomTransitionColor(link.color)

    window.setTimeout(() => {
      window.location.hash = link.href
    }, roomTransitionRouteDelay)

    window.setTimeout(() => {
      setRoomTransitionColor(null)
    }, roomTransitionDuration)
  }

  const handleQuickSpotifyToggle = () => {
    if (quickSpotifySrc) {
      setIsQuickSpotifyOpen((isOpen) => !isOpen)
      return
    }

    setQuickSpotifySrc(quickSpotifyEmbed)
    setIsQuickSpotifyOpen(true)
  }

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
        {roomSwitcherLinks.filter((link) => (
          !(link.room === activeRoom || (activeRoom === 'play-room' && link.room === 'sound-room'))
        )).map((link) => {
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

  const handleVisitorProfileSubmit = (event) => {
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

    const { visitorId } = getAnalyticsIds()

    window.localStorage.setItem(
      visitorProfileStorageKey,
      JSON.stringify({
        visitorId,
        age: normalizedAge,
        gender: visitorGender,
        savedAt: new Date().toISOString(),
      }),
    )
    identifyVisitor({ age: normalizedAge, gender: visitorGender })
    setVisitorProfileError('')
    setIsVisitorPromptOpen(false)
  }

  const header = (
    <SiteHeader
      variant="static"
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
  }[activeRoom]

  return (
    <main
      className={`landing-page ${activeRoom ? `landing-page-room landing-page-${activeRoom}` : ''} ${
        isAnalyticsReportOpen ? 'landing-page-analytics' : ''
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
            />
          ) : null}

          <WheelNavSection onRoomNavigate={handleRoomNavigate} />
          <HomePngShelf />
        </>
      )}

      {roomTransitionColor ? (
        <div
          className="room-transition-overlay"
          style={{ '--room-transition-color': roomTransitionColor }}
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
        onClose={() => setIsShareSheetOpen(false)}
        onCopyShareQuote={handleCopyShareQuote}
        onDownloadShareImage={handleDownloadShareImage}
        onNativeShareQuote={handleNativeShareQuote}
        onSelectShareFrame={handleSelectShareFrame}
        onShareInstagramStory={handleShareInstagramStory}
        onTextColorChange={setShareTextColor}
        quote={quote}
        shareQuoteFontSize={shareQuoteFontSize}
        shareTextColor={shareTextColor}
        shareTextColors={shareTextColors}
      />

      <Toast message={toastMessage} />

      {isVisitorPromptOpen && !isAnalyticsReportOpen ? (
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
                {[
                  { label: 'Nam', value: 'male' },
                  { label: 'Nữ', value: 'female' },
                  { label: 'Khác', value: 'other' },
                ].map((option) => (
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

            <button className="visitor-prompt-submit" type="submit">
              Bắt đầu
            </button>
          </form>
        </div>
      ) : null}
    </main>
  )
}
