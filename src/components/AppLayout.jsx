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
import { ShareSheet, Toast } from './ShareSheet'
import { SiteHeader } from './SiteHeader'
import { AmbientSection } from '../sections/AmbientSection'
import { DecisionSection } from '../sections/DecisionSection'
import { FocusSection } from '../sections/FocusSection'
import { IntroVideoSection } from '../sections/IntroVideoSection'
import { PlaylistSection } from '../sections/PlaylistSection'
import { QuoteSection } from '../sections/QuoteSection'
import { RoomSection } from '../sections/RoomSection'
import { WheelNavSection } from '../sections/WheelNavSection'

const roomRoutes = ['card-room', 'focus-room', 'sound-room', 'play-room']
const roomTransitionDuration = 1300
const roomTransitionRouteDelay = 1300
const visitorProfileStorageKey = 'love-yourself-visitor-profile'
const roomSwitcherLinks = [
  { href: '#card-room', label: 'Thiệp', room: 'card-room', color: '#9AB4EE' },
  { href: '#focus-room', label: 'Tập trung', room: 'focus-room', color: '#F8DB8E' },
  { href: '#sound-room', label: 'Âm thanh', room: 'sound-room', color: '#EBAAB4' },
]

function getActiveRoomFromHash() {
  if (typeof window === 'undefined') return null

  const hashRoom = window.location.hash.replace('#', '')
  return roomRoutes.includes(hashRoom) ? hashRoom : null
}

export function AppLayout({ state }) {
  const introSectionRef = useRef(null)
  const [isFloatingHeaderVisible, setIsFloatingHeaderVisible] = useState(false)
  const [activeRoom, setActiveRoom] = useState(getActiveRoomFromHash)
  const [roomTransitionColor, setRoomTransitionColor] = useState(null)
  const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false)
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
    draggingIcePosition,
    handleAddCustomFrame,
    handleAmbientSoundToggle,
    handleAskDecision,
    handleChooseAgain,
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

  useEffect(() => {
    if (activeRoom) {
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
  }, [activeRoom])

  useEffect(() => {
    const handleHashChange = () => {
      setActiveRoom(getActiveRoomFromHash())
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

  const roomSwitcher = activeRoom ? (
    <div className={`room-switcher ${isRoomSwitcherOpen ? 'is-open' : ''}`}>
      <button
        className="room-switcher-trigger"
        type="button"
        aria-expanded={isRoomSwitcherOpen}
        aria-haspopup="menu"
        onClick={() => setIsRoomSwitcherOpen((current) => !current)}
      >
        <span>Đổi phòng</span>
        <span aria-hidden="true">⌄</span>
      </button>
      <div className="room-switcher-menu" role="menu" aria-label="Chuyển phòng">
        {roomSwitcherLinks.map((link) => {
          const isActive = link.room === activeRoom || (activeRoom === 'play-room' && link.room === 'sound-room')

          return (
            <button
              className={isActive ? 'is-active' : ''}
              type="button"
              key={link.room}
              role="menuitem"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleRoomNavigate(link)}
            >
              {link.label}
            </button>
          )
        })}
      </div>
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

    window.localStorage.setItem(
      visitorProfileStorageKey,
      JSON.stringify({
        age: normalizedAge,
        gender: visitorGender,
        savedAt: new Date().toISOString(),
      }),
    )
    setVisitorProfileError('')
    setIsVisitorPromptOpen(false)
  }

  const header = (
    <SiteHeader
      roomSwitcher={roomSwitcher}
      variant="static"
    />
  )

  const cardRoom = (
    <RoomSection
      body="Một góc nhỏ để rút một lá thư cho hôm nay. Nếu còn phân vân, anh có thể xin thêm một dấu hiệu từ vị thần quyết định."
      eyebrow="Phòng thiệp"
      id="card-room"
      title="Mở một phong thư dịu dàng."
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
        onAskDecision={handleAskDecision}
        onChooseAgain={handleChooseAgain}
      />
    </RoomSection>
  )

  const focusRoom = (
    <RoomSection
      body="Chọn âm thanh nền, kéo đá vào ly, rồi để thời gian trôi chậm theo từng viên đá đang tan."
      eyebrow="Phòng tập trung"
      id="focus-room"
      title="Ở lại với việc cần làm."
      variant="blue"
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
      body="Một playlist nhỏ để đổi nhịp trong ngày. Bật một bài nhạc, ngồi lại một chút, rồi để tâm trạng tự mềm ra."
      eyebrow="Phòng âm thanh"
      id="sound-room"
      title="Bật nhạc và thở chậm lại."
    >
      <PlaylistSection copy={copy} />
    </RoomSection>
  )

  const activeRoomContent = {
    'card-room': cardRoom,
    'focus-room': focusRoom,
    'sound-room': soundRoom,
    'play-room': soundRoom,
  }[activeRoom]

  return (
    <main
      className={`landing-page is-day-mode ${activeRoom ? 'landing-page-room' : 'landing-page-home'} ${
        activeAmbientSound ? `has-ambient-${activeAmbientSound}` : ''
      } ${draggingIcePosition && !draggingIcePosition.isDropping && !draggingIcePosition.isReturning ? 'is-dragging-ice' : ''}`}
      onClickCapture={handleInterfaceClick}
    >
      <AmbientVisualEffect activeSound={activeAmbientSound} />

      {activeRoom ? (
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
            />
          ) : null}

          <WheelNavSection onRoomNavigate={handleRoomNavigate} />
        </>
      )}

      {roomTransitionColor ? (
        <div
          className="room-transition-overlay"
          style={{ '--room-transition-color': roomTransitionColor }}
          aria-hidden="true"
        />
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

      {isVisitorPromptOpen ? (
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
