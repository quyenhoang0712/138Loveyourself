import { useEffect, useMemo, useRef, useState } from 'react'
import { RoomSection } from './RoomSection'

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

function getTlRelativeDateKey(dayOffset = 0, date = new Date()) {
  return getTlDateKey(new Date(date.getTime() + dayOffset * 24 * 60 * 60 * 1000))
}

function getTlDateFromKey(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-').map(Number)
  if (!year || !month || !day) return new Date()

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

async function readJsonResponse(response) {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text || 'Máy chủ chưa trả JSON hợp lệ.')
  }
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
  const [registrationDateKey, setRegistrationDateKey] = useState(() => getTlDateKey())
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
      .then(readJsonResponse)
      .then((data) => {
        if (!ignore) setRegistrations(data.registrations || [])
      })
      .catch((error) => {
        if (!ignore && error.name !== 'AbortError') {
          setTlRoomMessage(error.message || 'Chưa tải được danh sách đăng ký.')
        }
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [viewingDateKey])

  const ratingRegistration = useMemo(
    () => registrations.find((registration) => registration.id === ratingRegistrationId),
    [ratingRegistrationId, registrations],
  )
  const viewingRegistration = useMemo(
    () => registrations.find((registration) => registration.id === viewingRegistrationId),
    [viewingRegistrationId, registrations],
  )
  const viewingSlotRegistrations = useMemo(
    () => viewingSlot ? registrations.filter((registration) => registration.slot === viewingSlot) : [],
    [registrations, viewingSlot],
  )
  const tomorrowDateKey = getTlRelativeDateKey(1, now)
  const registrationDateOptions = [
    { label: 'Hôm nay', dateKey: tlDateKey },
    { label: 'Ngày mai', dateKey: tomorrowDateKey },
  ]

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
          dateKey: registrationDateKey,
          tobacco: selectedTobacco,
          flame: selectedFlame,
          lighter: selectedLighter,
        }),
      })
      const data = await readJsonResponse(response)

      if (!response.ok) throw new Error(data.error || 'Chưa đăng ký được.')

      if (viewingDateKey === data.registration.dateKey) {
        setRegistrations((currentRegistrations) => [data.registration, ...currentRegistrations])
      } else {
        setViewingDateKey(data.registration.dateKey)
      }
      setTlRoomMessage(`Đã đăng ký ngày ${tlDateFormatter.format(getTlDateFromKey(data.registration.dateKey))}.`)
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
      const data = await readJsonResponse(response)

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

      <div className="tl-room-schedule" aria-label="Lịch theo từng khung giờ">
        {tlScheduleSlots.map((slot) => {
          const isSelected = selectedSlot === slot

          return (
            <div className={`tl-room-schedule-row ${isSelected ? 'is-selected' : ''}`} key={slot}>
              <button className="tl-room-slot-view-button" type="button" onClick={() => setViewingSlot(slot)}>
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

      <div className="tl-room-actions">
        <button className="tl-room-register-button" type="button" onClick={() => setIsRegisterPopupOpen(true)}>
          Đăng ký bi đầu ngày
        </button>
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
            <button className="tl-room-popup-close" type="button" aria-label="Đóng popup" onClick={() => setIsRegisterPopupOpen(false)}>
              ×
            </button>

            <div className="tl-room-popup-content">
              <fieldset className="tl-room-option-group">
                <legend>Ngày đăng ký</legend>
                <div className="tl-room-option-grid tl-room-option-grid-compact">
                  {registrationDateOptions.map((option) => (
                    <label className={registrationDateKey === option.dateKey ? 'is-selected' : ''} key={option.dateKey}>
                      <input
                        type="radio"
                        name="tl-register-date"
                        value={option.dateKey}
                        checked={registrationDateKey === option.dateKey}
                        onChange={(event) => setRegistrationDateKey(event.target.value)}
                      />
                      <span>{option.label} {tlDateFormatter.format(getTlDateFromKey(option.dateKey))}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

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
            <button className="tl-room-popup-close" type="button" aria-label="Đóng popup đánh giá" onClick={() => setRatingRegistrationId('')}>
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
            <button className="tl-room-popup-close" type="button" aria-label="Đóng chi tiết đăng ký" onClick={() => setViewingRegistrationId('')}>
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
                <button className="tl-room-registration-detail-image-button" type="button" onClick={() => openRegistrationImage(viewingRegistration)}>
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
            <button className="tl-room-popup-close" type="button" aria-label="Đóng danh sách khung giờ" onClick={() => setViewingSlot('')}>
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
            <button className="tl-room-popup-close" type="button" aria-label="Đóng ảnh" onClick={() => setViewingImage(null)}>
              ×
            </button>
            <img src={viewingImage.src} alt={viewingImage.alt} />
          </section>
        </div>
      ) : null}
    </>
  )
}

export function TlRoomSection() {
  return (
    <RoomSection
      body="Phòng thuốc lào tiên lãng phường ông lãnh là căn phòng riêng để các thành viên TL đăng ký bi đầu ngày, xem lịch theo khung giờ, chọn loại thuốc, bật lửa, người châm và gửi đánh giá sau mỗi lần ra trận."
      eyebrow="Phòng riêng"
      id="tl-room"
      title="Phòng thuốc lào tiên lãng phường ông lãnh."
    >
      <section className="tl-room-panel" aria-labelledby="tl-room-panel-title">
        <h2 className="sr-only" id="tl-room-panel-title">Phòng thuốc lào tiên lãng phường ông lãnh</h2>
        <TlRoomSchedule />
      </section>
    </RoomSection>
  )
}
