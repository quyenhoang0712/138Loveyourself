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
import { RoomSection, roomIntroOpenEventName } from '../sections/RoomSection'
import { UserProfileReport } from '../sections/UserProfileReport'
import { WheelNavSection } from '../sections/WheelNavSection'
import {
  getVisitorProfile,
  identifyVisitor,
  getReturnStreak,
  returnStreakChangedEventName,
  sendAnalyticsHeartbeat,
  startAnalyticsSession,
  trackAnalyticsEvent,
  updateReturnStreak,
} from '../utils/analytics'

const privateRoomRoute = 'tl-room'
const publicRoomRoutes = ['card-room', 'focus-room', 'healing-room', 'sound-room', 'play-room', 'community', 'diary-room']
const roomRoutes = [...publicRoomRoutes, privateRoomRoute]
const roomTransitionDuration = 1300
const roomTransitionRouteDelay = 1300
const visitorProfileStorageKey = 'love-yourself-visitor-profile'
const welcomeGuideLastSeenStorageKey = 'love-yourself-guide-last-seen'
const returnStreakPopupSeenStorageKey = 'love-yourself-return-streak-popup-seen'
const welcomeGuideReminderDelay = 12 * 60 * 60 * 1000
const transitionMascotSrc = '/PNG/tay-trai-tim.png'
const quickSpotifyEmbed = 'https://open.spotify.com/embed/playlist/1yd3LjXq6a5EXVA11w7UPH?utm_source=generator&theme=0'
const bottomToolbarLinks = [
  { id: 'home', href: '#', label: 'Trang chủ', color: '#9AB4EE' },
  { id: 'community', href: '#community', label: 'Cộng đồng', color: '#9AB4EE' },
  { id: 'diary-room', href: '#diary-room', label: 'Nhật ký', color: '#F8DB8E' },
  { id: 'profile', href: '#profile', label: 'Phòng bạn', color: '#4789C8' },
  { id: 'spotify', label: 'Spotify', color: '#EBAAB4' },
  { id: 'shop', href: 'https://138knitwear.com/', label: 'Mua hàng', color: '#F8DB8E' },
]
const homePriorityAssets = [
  '/Vector.gif',
  '/PNG/giay.png',
  '/PNG/ao-khan-len.png',
  transitionMascotSrc,
]
const uniqueHomePriorityAssets = [...new Set(homePriorityAssets)]
const visitorGenderOptions = [
  { label: 'Nam', value: 'male' },
  { label: 'Nữ', value: 'female' },
  { label: 'Khác', value: 'other' },
]
const tlScheduleSlots = Array.from({ length: 10 }, (_, index) => {
  const startHour = (6 + index * 2) % 24
  const endHour = (startHour + 2) % 24

  return `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`
})
const tlTobaccoOptions = ['Lào thủ Việt Nam', 'Chị Huệ']
const tlLighterOptions = ['Tự châm', 'Khoa', 'Hiếu', 'Quyền', 'Đạt nhỏ', 'Nhân', 'Đạt lớn', 'Đăng']
const tlFlameOptions = ['Khò', 'Bật thường']
const tlRatingOptions = ['Không phê', 'Phê', 'Phê vãi lồn']
const tlAudioSrc = '/tl/tl.m4a'
const tlMembers = [
  { name: 'Khoa', image: '/tl/members/Khoa.jpg' },
  { name: 'Đại ca Hiếu', image: '/tl/members/daicaHieu.jpg' },
  { name: 'Đăng', image: '/tl/members/dang.jpg' },
  { name: 'Đạt lớn', image: '/tl/members/datbig.jpg' },
  { name: 'Đạt nhỏ', image: '/tl/members/datnho.jpg' },
  { name: 'Nhân', image: '/tl/members/nhan.jpg' },
  { name: 'Quyền', image: '/tl/members/quyen.jpg' },
]
const tlTobaccoItems = [
  { name: 'Lào thủ thượng hạng', image: '/tl/thuoclao/cards/LaoThuThuongHan.jpg' },
  { name: 'Thuốc Chị Huệ', image: '/tl/thuoclao/cards/ThuocChiHue.jpg' },
]
const tlDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const tlTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const tlDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function getTlDateKey(date = new Date()) {
  const parts = tlDateKeyFormatter.formatToParts(date).reduce((value, part) => ({
    ...value,
    [part.type]: part.value,
  }), {})

  return `${parts.year}-${parts.month}-${parts.day}`
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

function shouldShowWelcomeGuide() {
  if (typeof window === 'undefined') return false

  const lastSeenAt = Number(window.localStorage.getItem(welcomeGuideLastSeenStorageKey))
  return !lastSeenAt || Date.now() - lastSeenAt >= welcomeGuideReminderDelay
}

function getActiveRoomFromHash() {
  if (typeof window === 'undefined') return null

  const hashRoom = window.location.hash.replace('#', '')
  if (hashRoom === privateRoomRoute) {
    return window.location.pathname === '/tl' ? privateRoomRoute : null
  }

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

function TlRoomAudio() {
  const audioRef = useRef(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    audio.volume = 0.72
    const playPromise = audio.play()

    if (playPromise) {
      playPromise
        .then(() => {
          setIsAudioPlaying(true)
          setNeedsGesture(false)
        })
        .catch(() => {
          setIsAudioPlaying(false)
          setNeedsGesture(true)
        })
    }

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  const handleAudioToggle = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isAudioPlaying) {
      audio.pause()
      setIsAudioPlaying(false)
      setNeedsGesture(true)
      return
    }

    try {
      await audio.play()
      setIsAudioPlaying(true)
      setNeedsGesture(false)
    } catch {
      setNeedsGesture(true)
    }
  }

  return (
    <>
      <audio ref={audioRef} src={tlAudioSrc} preload="auto" loop />
      {needsGesture || isAudioPlaying ? (
        <button className="tl-room-audio-button" type="button" onClick={handleAudioToggle}>
          {isAudioPlaying ? 'Tắt tiếng TL' : 'Bật tiếng TL'}
        </button>
      ) : null}
    </>
  )
}

function TlRoomSchedule() {
  const [selectedSlot, setSelectedSlot] = useState('')
  const [isRegisterPopupOpen, setIsRegisterPopupOpen] = useState(false)
  const [selectedTobacco, setSelectedTobacco] = useState(tlTobaccoOptions[0])
  const [selectedLighter, setSelectedLighter] = useState(tlLighterOptions[0])
  const [selectedFlame, setSelectedFlame] = useState(tlFlameOptions[0])
  const [now, setNow] = useState(() => new Date())
  const [tlDateKey, setTlDateKey] = useState(() => getTlDateKey())
  const [viewingDateKey, setViewingDateKey] = useState(() => getTlDateKey())
  const [registrations, setRegistrations] = useState([])
  const [ratingRegistrationId, setRatingRegistrationId] = useState('')
  const [viewingRegistrationId, setViewingRegistrationId] = useState('')
  const [viewingSlot, setViewingSlot] = useState('')
  const [viewingImage, setViewingImage] = useState(null)
  const [tlRoomMessage, setTlRoomMessage] = useState('')

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextNow = new Date()
      setNow(nextNow)
      setTlDateKey(getTlDateKey(nextNow))
    }, 60000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    fetch(`/api/tl-registrations?date=${encodeURIComponent(viewingDateKey)}`, { credentials: 'include', signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setRegistrations(data.registrations || [])
      })
      .catch((error) => {
        if (!ignore && error.name !== 'AbortError') {
          setTlRoomMessage('Chưa tải được danh sách đăng ký.')
        }
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [viewingDateKey])

  const handleRegisterSubmit = async () => {
    if (!selectedSlot) {
      setTlRoomMessage('Bạn chọn khung giờ trước rồi đăng ký nha.')
      return
    }

    try {
      const response = await fetch('/api/tl-registrations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot: selectedSlot,
          dateKey: tlDateKey,
          tobacco: selectedTobacco,
          flame: selectedFlame,
          lighter: selectedLighter,
        }),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Chưa đăng ký được.')

      if (viewingDateKey === data.registration.dateKey) {
        setRegistrations((currentRegistrations) => [data.registration, ...currentRegistrations])
      }
      setTlRoomMessage('Đã đăng ký.')
      setIsRegisterPopupOpen(false)
    } catch (error) {
      setTlRoomMessage(error.message)
    }
  }

  const handleRegistrationRating = (registrationId, rating) => {
    setRegistrations((currentRegistrations) => currentRegistrations.map((registration) => (
      registration.id === registrationId ? { ...registration, rating } : registration
    )))
  }

  const handleRegistrationRatingImage = (registrationId, file) => {
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      setRegistrations((currentRegistrations) => currentRegistrations.map((registration) => (
        registration.id === registrationId
          ? { ...registration, ratingImage: String(reader.result || ''), ratingImageName: file.name }
          : registration
      )))
    }
    reader.readAsDataURL(file)
  }

  const handleRatingSubmit = async () => {
    if (!ratingRegistration?.rating) {
      setTlRoomMessage('Bạn chọn mức đánh giá trước nha.')
      return
    }

    try {
      const response = await fetch(`/api/tl-registrations/${encodeURIComponent(ratingRegistration.id)}/rating`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: ratingRegistration.rating,
          ratingImage: ratingRegistration.ratingImage || '',
          ratingImageName: ratingRegistration.ratingImageName || '',
        }),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Chưa gửi được đánh giá.')

      setRegistrations((currentRegistrations) => currentRegistrations.map((registration) => (
        registration.id === data.registration.id ? data.registration : registration
      )))
      setTlRoomMessage('Đã gửi đánh giá.')
      setRatingRegistrationId('')
    } catch (error) {
      setTlRoomMessage(error.message)
    }
  }

  const ratingRegistration = registrations.find((registration) => registration.id === ratingRegistrationId)
  const viewingRegistration = registrations.find((registration) => registration.id === viewingRegistrationId)
  const viewingSlotRegistrations = viewingSlot
    ? registrations.filter((registration) => registration.slot === viewingSlot)
    : []
  const openRegistrationImage = (registration) => {
    if (!registration?.ratingImage) return

    setViewingImage({
      src: registration.ratingImage,
      alt: registration.ratingImageName || 'Ảnh đánh giá bi đầu ngày',
      title: registration.authorName || 'Ảnh đánh giá',
    })
  }
  const openMemberImage = (member) => {
    setViewingImage({
      src: member.image,
      alt: `Ảnh của ${member.name}`,
      title: member.name,
    })
  }

  return (
    <>
      <TlRoomAudio />

      <div className="tl-room-current-time" aria-live="polite">
        <span>Ngày {tlDateFormatter.format(now)}</span>
        <span>{tlTimeFormatter.format(now)}</span>
      </div>

      {tlRoomMessage ? <p className="tl-room-message">{tlRoomMessage}</p> : null}

      <section className="tl-room-member-section" aria-labelledby="tl-room-member-title">
        <div className="tl-room-member-heading">
          <p>Thành viên TL</p>
          <h3 id="tl-room-member-title">Phòng thuốc lào tiên lãng</h3>
        </div>
        <div className="tl-room-member-grid">
          {tlMembers.map((member) => (
            <button
              className="tl-room-member-card"
              type="button"
              key={member.image}
              onClick={() => openMemberImage(member)}
            >
              <img src={member.image} alt={`Ảnh của ${member.name}`} loading="lazy" />
              <span>{member.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="tl-room-tobacco-section" aria-labelledby="tl-room-tobacco-title">
        <div className="tl-room-member-heading">
          <p>Thuốc lào</p>
          <h3 id="tl-room-tobacco-title">Bộ sưu tập của phòng</h3>
        </div>
        <div className="tl-room-tobacco-grid">
          {tlTobaccoItems.map((item) => (
            <button
              className="tl-room-tobacco-card"
              type="button"
              key={item.image}
              onClick={() => openMemberImage(item)}
            >
              <img src={item.image} alt={`Ảnh ${item.name}`} loading="lazy" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="tl-room-actions">
        <button className="tl-room-register-button" type="button" onClick={() => setIsRegisterPopupOpen(true)}>
          Đăng ký bi đầu ngày
        </button>
      </div>

      <div className="tl-room-schedule" aria-label="Lịch theo từng khung giờ">
        {tlScheduleSlots.map((slot) => {
          const isSelected = selectedSlot === slot

          return (
            <div className={`tl-room-schedule-row ${isSelected ? 'is-selected' : ''}`} key={slot}>
              <button
                className="tl-room-slot-view-button"
                type="button"
                onClick={() => setViewingSlot(slot)}
              >
                {slot}
              </button>
              <button
                className="tl-room-schedule-action"
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedSlot(slot)}
              >
                {isSelected ? 'Sẽ ra' : 'Chọn khung này'}
              </button>
            </div>
          )
        })}
      </div>

      <section className="tl-room-registration-list" aria-labelledby="tl-room-registration-list-title">
        <div className="tl-room-registration-list-heading">
          <h3 id="tl-room-registration-list-title">Danh sách đăng ký</h3>
          <label>
            <span>Chọn ngày</span>
            <input
              type="date"
              value={viewingDateKey}
              onChange={(event) => setViewingDateKey(event.target.value || getTlDateKey())}
            />
          </label>
        </div>
        {registrations.length ? (
          <div>
            {registrations.map((registration) => (
              <article
                className="tl-room-registration-item"
                key={registration.id}
                role="button"
                tabIndex="0"
                onPointerDown={() => setViewingRegistrationId(registration.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setViewingRegistrationId(registration.id)
                  }
                }}
              >
                <time>{registration.slot}</time>
                <strong>{registration.authorName || 'Không rõ'}</strong>
                <strong>{registration.tobacco}</strong>
                <span>{registration.flame}</span>
                <span>{registration.lighter}</span>
                <small>
                  {tlDateFormatter.format(new Date(registration.submittedAt))} • {tlTimeFormatter.format(new Date(registration.submittedAt))}
                </small>
                <button
                  className="tl-room-registration-rating-button"
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation()
                    setRatingRegistrationId(registration.id)
                  }}
                >
                  {registration.rating || 'Đánh giá'}
                </button>
                {registration.ratingImage ? (
                  <button
                    className="tl-room-registration-image-button"
                    type="button"
                    aria-label={`Xem ảnh của ${registration.authorName || 'người đăng ký'}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation()
                      openRegistrationImage(registration)
                    }}
                  >
                    <img
                      className="tl-room-registration-image"
                      src={registration.ratingImage}
                      alt={registration.ratingImageName || 'Ảnh đánh giá bi đầu ngày'}
                    />
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="tl-room-registration-empty">Chưa có ai đăng ký ngày này.</p>
        )}
      </section>

      {isRegisterPopupOpen ? (
        <div className="tl-room-popup-backdrop" role="presentation" onMouseDown={() => setIsRegisterPopupOpen(false)}>
          <section
            className="tl-room-popup"
            role="dialog"
            aria-modal="true"
            aria-label="Đăng ký bi đầu ngày"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="tl-room-popup-close"
              type="button"
              aria-label="Đóng popup"
              onClick={() => setIsRegisterPopupOpen(false)}
            >
              ×
            </button>

            <div className="tl-room-popup-content">
              <fieldset className="tl-room-option-group">
                <legend>Loại thuốc</legend>
                <div className="tl-room-option-grid tl-room-option-grid-compact">
                  {tlTobaccoOptions.map((option) => (
                    <label className={selectedTobacco === option ? 'is-selected' : ''} key={option}>
                      <input
                        type="radio"
                        name="tl-tobacco"
                        value={option}
                        checked={selectedTobacco === option}
                        onChange={(event) => setSelectedTobacco(event.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="tl-room-option-group">
                <legend>Bật lửa</legend>
                <div className="tl-room-option-grid tl-room-option-grid-compact">
                  {tlFlameOptions.map((option) => (
                    <label className={selectedFlame === option ? 'is-selected' : ''} key={option}>
                      <input
                        type="radio"
                        name="tl-flame"
                        value={option}
                        checked={selectedFlame === option}
                        onChange={(event) => setSelectedFlame(event.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="tl-room-option-group">
                <legend>Ai châm</legend>
                <div className="tl-room-option-grid">
                  {tlLighterOptions.map((option) => (
                    <label className={selectedLighter === option ? 'is-selected' : ''} key={option}>
                      <input
                        type="radio"
                        name="tl-lighter"
                        value={option}
                        checked={selectedLighter === option}
                        onChange={(event) => setSelectedLighter(event.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button className="tl-room-popup-submit" type="button" onClick={handleRegisterSubmit}>
                Đăng ký
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {ratingRegistration ? (
        <div className="tl-room-popup-backdrop" role="presentation" onMouseDown={() => setRatingRegistrationId('')}>
          <section
            className="tl-room-popup tl-room-rating-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tl-room-rating-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="tl-room-popup-close"
              type="button"
              aria-label="Đóng popup đánh giá"
              onClick={() => setRatingRegistrationId('')}
            >
              ×
            </button>

            <div className="tl-room-popup-content">
              <div className="tl-room-rating-heading">
                <p>Đánh giá bi đầu ngày</p>
                <h3 id="tl-room-rating-title">{ratingRegistration.lighter} châm thế nào?</h3>
              </div>

              <div className="tl-room-option-grid tl-room-rating-options">
                {tlRatingOptions.map((rating) => (
                  <button
                    className={ratingRegistration.rating === rating ? 'is-selected' : ''}
                    type="button"
                    key={rating}
                    aria-pressed={ratingRegistration.rating === rating}
                    onClick={() => handleRegistrationRating(ratingRegistration.id, rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>

              <label className="tl-room-rating-image-picker">
                <span>Gửi ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleRegistrationRatingImage(ratingRegistration.id, event.target.files?.[0])}
                />
              </label>

              {ratingRegistration.ratingImage ? (
                <img
                  className="tl-room-rating-image-preview"
                  src={ratingRegistration.ratingImage}
                  alt={ratingRegistration.ratingImageName || 'Ảnh đánh giá bi đầu ngày'}
                />
              ) : null}

              <button className="tl-room-popup-submit" type="button" onClick={handleRatingSubmit}>
                Gửi đánh giá
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {viewingRegistration ? (
        <div className="tl-room-popup-backdrop" role="presentation" onMouseDown={() => setViewingRegistrationId('')}>
          <section
            className="tl-room-popup tl-room-registration-detail-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tl-room-registration-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="tl-room-popup-close"
              type="button"
              aria-label="Đóng chi tiết đăng ký"
              onClick={() => setViewingRegistrationId('')}
            >
              ×
            </button>

            <div className="tl-room-popup-content">
              <div className="tl-room-rating-heading">
                <p>Chi tiết đăng ký</p>
                <h3 id="tl-room-registration-detail-title">{viewingRegistration.authorName || 'Không rõ'}</h3>
              </div>

              <dl className="tl-room-registration-detail-list">
                <div>
                  <dt>Khung giờ</dt>
                  <dd>{viewingRegistration.slot}</dd>
                </div>
                <div>
                  <dt>Loại thuốc</dt>
                  <dd>{viewingRegistration.tobacco}</dd>
                </div>
                <div>
                  <dt>Bật lửa</dt>
                  <dd>{viewingRegistration.flame}</dd>
                </div>
                <div>
                  <dt>Ai châm</dt>
                  <dd>{viewingRegistration.lighter}</dd>
                </div>
                <div>
                  <dt>Người đánh giá</dt>
                  <dd>{viewingRegistration.ratedByName || 'Chưa có'}</dd>
                </div>
                <div>
                  <dt>Đánh giá</dt>
                  <dd>{viewingRegistration.rating || 'Chưa có'}</dd>
                </div>
                <div>
                  <dt>Người gửi ảnh</dt>
                  <dd>{viewingRegistration.ratingImage ? viewingRegistration.ratedByName || 'Không rõ' : 'Chưa có ảnh'}</dd>
                </div>
              </dl>

              {viewingRegistration.ratingImage ? (
                <button
                  className="tl-room-registration-detail-image-button"
                  type="button"
                  onClick={() => openRegistrationImage(viewingRegistration)}
                >
                  <img
                    className="tl-room-registration-detail-image"
                    src={viewingRegistration.ratingImage}
                    alt={viewingRegistration.ratingImageName || 'Ảnh đánh giá bi đầu ngày'}
                  />
                  <span>Xem ảnh</span>
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {viewingSlot ? (
        <div className="tl-room-popup-backdrop" role="presentation" onMouseDown={() => setViewingSlot('')}>
          <section
            className="tl-room-popup tl-room-slot-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tl-room-slot-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="tl-room-popup-close"
              type="button"
              aria-label="Đóng danh sách khung giờ"
              onClick={() => setViewingSlot('')}
            >
              ×
            </button>

            <div className="tl-room-popup-content">
              <div className="tl-room-rating-heading">
                <p>Khung giờ</p>
                <h3 id="tl-room-slot-title">{viewingSlot}</h3>
              </div>

              {viewingSlotRegistrations.length ? (
                <div className="tl-room-slot-registration-list">
                  {viewingSlotRegistrations.map((registration) => (
                    <article className="tl-room-slot-registration-item" key={registration.id}>
                      <strong>{registration.authorName || 'Không rõ'}</strong>
                      <span>{registration.tobacco}</span>
                      <span>{registration.flame}</span>
                      <span>{registration.lighter}</span>
                      {registration.rating ? <em>{registration.rating}</em> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="tl-room-slot-empty">Chưa có ai đăng ký khung giờ này.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {viewingImage ? (
        <div className="tl-room-popup-backdrop" role="presentation" onMouseDown={() => setViewingImage(null)}>
          <section
            className="tl-room-image-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={viewingImage.title}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="tl-room-popup-close"
              type="button"
              aria-label="Đóng ảnh"
              onClick={() => setViewingImage(null)}
            >
              ×
            </button>
            <img src={viewingImage.src} alt={viewingImage.alt} />
          </section>
        </div>
      ) : null}
    </>
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
          Mở lịch, chọn tâm trạng trong ngày, rồi viết lại vài dòng trong cuốn sổ nhỏ của mình.
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

function BottomToolbar({ activeRoom, isAnalyticsReportOpen, isProfileOpen, isSpotifyOpen, onNavigate }) {
  const activeTool = isProfileOpen ? 'profile' : activeRoom || (isAnalyticsReportOpen ? null : 'home')
  const resolvedActiveId = isSpotifyOpen ? 'spotify' : activeTool
  const [isToolbarHidden, setIsToolbarHidden] = useState(false)
  const [visualActiveId, setVisualActiveId] = useState(() => resolvedActiveId || 'home')
  const indicatorActiveId = resolvedActiveId === visualActiveId ? resolvedActiveId : visualActiveId
  const visualActiveIndex = bottomToolbarLinks.findIndex((link) => link.id === indicatorActiveId)

  return (
    <nav
      className={`bottom-toolbar ${isToolbarHidden ? 'is-hidden' : ''} ${isSpotifyOpen ? 'is-spotify-open' : ''}`}
      aria-label="Thanh công cụ chính"
    >
      <button
        className="bottom-toolbar-peek"
        type="button"
        aria-label={isToolbarHidden ? 'Hiện thanh công cụ' : 'Ẩn thanh công cụ'}
        aria-pressed={isToolbarHidden}
        onClick={() => setIsToolbarHidden((isHidden) => !isHidden)}
      />

      {isSpotifyOpen ? (
        <div className="bottom-toolbar-spotify-panel">
          <iframe
            className="bottom-toolbar-spotify-player"
            title="Spotify ngẫu nhiên"
            src={quickSpotifyEmbed}
            width="100%"
            height="86"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="bottom-toolbar-track">
        {visualActiveIndex >= 0 ? (
          <span
            className="bottom-toolbar-active-indicator"
            style={{
              transform: `translateX(${visualActiveIndex * 100}%) translateX(${visualActiveIndex * 4}px)`,
              width: `calc((100% - 14px - ${(bottomToolbarLinks.length - 1) * 4}px) / ${bottomToolbarLinks.length})`,
            }}
            aria-hidden="true"
          />
        ) : null}
        {bottomToolbarLinks.map((link) => {
          const isActive = link.id === resolvedActiveId
          const isIndicatorActive = link.id === indicatorActiveId

          return (
            <button
              className={`bottom-toolbar-item bottom-toolbar-${link.id} ${isActive ? 'is-active' : ''} ${
                isIndicatorActive ? 'is-indicator-active' : ''
              }`}
              type="button"
              key={link.id}
              aria-current={isActive && link.id !== 'spotify' ? 'page' : undefined}
              aria-pressed={link.id === 'spotify' ? isActive : undefined}
              onClick={() => {
                setVisualActiveId(link.id === 'spotify' && isSpotifyOpen ? activeTool || 'home' : link.id)
                onNavigate(link)
              }}
            >
              <span className="bottom-toolbar-icon" aria-hidden="true" />
              <span>{link.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
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
  const [isQuickSpotifyOpen, setIsQuickSpotifyOpen] = useState(false)
  const [visitorAge, setVisitorAge] = useState('')
  const [visitorGender, setVisitorGender] = useState('')
  const [visitorProfileError, setVisitorProfileError] = useState('')
  const [isVisitorProfileSaving, setIsVisitorProfileSaving] = useState(false)
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

    setActiveRoomTransitionColor(link.color || '#F8DB8E')

    window.setTimeout(() => {
      window.location.hash = link.href
    }, roomTransitionRouteDelay)

    window.setTimeout(() => {
      setActiveRoomTransitionColor(null)
    }, roomTransitionDuration)
  }, [activeRoom])

  const handleQuickSpotifyToggle = useCallback(() => {
    setIsQuickSpotifyOpen((isOpen) => !isOpen)
  }, [])

  const handleBottomToolbarNavigate = useCallback((link) => {
    if (link.id === 'spotify') {
      handleQuickSpotifyToggle()
      return
    }

    if (link.id === 'shop') {
      window.open(link.href, '_blank', 'noopener,noreferrer')
      return
    }

    if (link.id === 'home') {
      setActiveRoomTransitionColor(null)
      setActiveRoom(null)
      setIsAnalyticsReportOpen(false)
      setIsProfileOpen(false)

      if (window.location.hash) {
        window.location.hash = ''
      }

      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (link.id === 'profile') {
      setActiveRoomTransitionColor(null)
      setActiveRoom(null)
      setIsAnalyticsReportOpen(false)
      setIsProfileOpen(true)
      window.location.hash = link.href
      return
    }

    handleRoomNavigate({ href: link.href, room: link.id, color: link.color })
  }, [handleQuickSpotifyToggle, handleRoomNavigate])

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

  const handleShareSheetClose = useCallback(() => {
    setIsShareSheetOpen(false)
  }, [setIsShareSheetOpen])

  const handleRoomIntroOpen = useCallback(() => {
    if (!activeRoom) return

    window.dispatchEvent(new CustomEvent(roomIntroOpenEventName, { detail: { roomId: activeRoom } }))
  }, [activeRoom])

  const header = (
    <SiteHeader
      onIntroOpen={activeRoom ? handleRoomIntroOpen : undefined}
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

  const tlRoom = (
    <RoomSection
      body="Căn phòng riêng chỉ mở qua đường dẫn /tl sau khi đăng nhập. Không nằm trên vòng xoay, không hiện ở thanh điều hướng chính."
      eyebrow="Phòng riêng"
      id={privateRoomRoute}
      title="Phòng thuốc lào tiên lãng phường ông lãnh"
    >
      <section className="tl-room-panel" aria-labelledby="tl-room-panel-title">
        <h2 className="sr-only" id="tl-room-panel-title">Phòng thuốc lào tiên lãng phường ông lãnh</h2>

        <TlRoomSchedule />
      </section>
    </RoomSection>
  )

  const activeRoomContent = {
    'card-room': cardRoom,
    'focus-room': focusRoom,
    'healing-room': healingRoom,
    'sound-room': soundRoom,
    'play-room': soundRoom,
    [privateRoomRoute]: tlRoom,
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
            <SiteHeader variant="floating" />
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

      <ReturnStreakPopup
        isOpen={isReturnStreakPopupOpen}
        onClose={handleReturnStreakPopupClose}
        streak={returnStreak}
      />

      <BottomToolbar
        activeRoom={activeRoom}
        isAnalyticsReportOpen={isAnalyticsReportOpen}
        isProfileOpen={isProfileOpen}
        isSpotifyOpen={isQuickSpotifyOpen}
        onNavigate={handleBottomToolbarNavigate}
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
              <span>Trang chủ dẫn bạn tới các căn phòng, còn nút nghe nhạc sẽ luôn đi cùng bạn.</span>
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
                <span className="welcome-guide-toolbar-icon" aria-hidden="true" />
                <div>
                  <strong>Nút nghe nhạc</strong>
                  <p>Chạm Spotify ở thanh dưới để mở hoặc thu gọn trình phát.</p>
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
