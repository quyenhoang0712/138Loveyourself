import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MOODS = [
  {
    id: 1,
    label: 'Mệt nhiều',
    iconBlob: '/assets/diary/metnhieu-fIR7bQs6EOXXGV33ynN3zYgjXuyIqw.svg',
    iconLocal: '/assets/diary/metnhieu-fIR7bQs6EOXXGV33ynN3zYgjXuyIqw.svg',
  },
  {
    id: 2,
    label: 'Hơi chùng',
    iconBlob: '/assets/diary/hoichung-lse0vh8eu7hEf49hUzXWRciyWWlAut.svg',
    iconLocal: '/assets/diary/hoichung-lse0vh8eu7hEf49hUzXWRciyWWlAut.svg',
  },
  {
    id: 3,
    label: 'Bình thường',
    iconBlob: '/assets/diary/binhthuong-Sbnl5Z1tT7I4hcMSw8BbBtxxS9XfPe.svg',
    iconLocal: '/assets/diary/binhthuong-Sbnl5Z1tT7I4hcMSw8BbBtxxS9XfPe.svg',
  },
  {
    id: 4,
    label: 'Nhẹ lòng',
    iconBlob: '/assets/diary/nhelong-bJ3oBRWa7xQlSKRUAryUvmL8okmUbP.svg',
    iconLocal: '/assets/diary/nhelong-bJ3oBRWa7xQlSKRUAryUvmL8okmUbP.svg',
  },
  {
    id: 5,
    label: 'Rất zui',
    iconBlob: '/assets/diary/ratzui-5Sjsx97b4vgGvjb3PFYdRPMYaTklFE.svg',
    iconLocal: '/assets/diary/ratzui-5Sjsx97b4vgGvjb3PFYdRPMYaTklFE.svg',
  },
]

const VI_WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

function formatToKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(date) {
  const weekday = VI_WEEKDAYS[date.getDay()]
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return `${weekday}, ${day}/${month}/${year}`
}

function getVietnamTodayKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {})
  return `${parts.year}-${parts.month}-${parts.day}`
}

function getVietnamToday() {
  const [year, month, day] = getVietnamTodayKey().split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getStoredLocalDrafts() {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem('love-yourself-diary-drafts') || '{}')
  } catch {
    return {}
  }
}

function saveStoredLocalDraft(dateKey, data) {
  if (typeof window === 'undefined') return
  try {
    const drafts = getStoredLocalDrafts()
    drafts[dateKey] = { ...(drafts[dateKey] || {}), ...data, updatedAt: new Date().toISOString() }
    window.localStorage.setItem('love-yourself-diary-drafts', JSON.stringify(drafts))
  } catch {
    // safely ignore
  }
}

export function ProfileDiarySection({ user, requestedDate, onSaved }) {
  const [currentDate, setCurrentDate] = useState(getVietnamToday)
  const [entriesMap, setEntriesMap] = useState(() => getStoredLocalDrafts())
  const [drafts, setDrafts] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // { type: 'success' | 'error', text: string }
  const [pageTurn, setPageTurn] = useState('')
  const pageTurnTimeoutRef = useRef(null)
  const handledDateRequestRef = useRef(null)

  const dateKey = useMemo(() => formatToKey(currentDate), [currentDate])
  const displayDate = useMemo(() => formatDisplayDate(currentDate), [currentDate])
  const todayKey = useMemo(() => getVietnamTodayKey(), [])
  const isFuture = dateKey > todayKey
  const isPast = dateKey < todayKey
  const isToday = dateKey === todayKey
  const isReadOnly = !isToday

  // Load entries from server when user is authenticated
  useEffect(() => {
    if (!user) return undefined

    const controller = new AbortController()
    fetch('/api/analytics/diary', { credentials: 'include', signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load diary entries')
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data.entries)) {
          const map = {}
          data.entries.forEach((entry) => {
            map[entry.date] = { note: entry.note, mood: entry.mood }
          })
          setEntriesMap(map)
        }
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [user])

  useEffect(() => () => window.clearTimeout(pageTurnTimeoutRef.current), [])

  useEffect(() => {
    if (!requestedDate?.dateKey) return
    const syncTimeout = window.setTimeout(() => {
      if (handledDateRequestRef.current === requestedDate.requestId) return
      const [year, month, day] = requestedDate.dateKey.split('-').map(Number)
      const nextDate = new Date(year, month - 1, day)
      if (Number.isNaN(nextDate.getTime())) return

      handledDateRequestRef.current = requestedDate.requestId
      setPageTurn(requestedDate.dateKey < dateKey ? 'is-turning-backward' : 'is-turning-forward')
      setCurrentDate(nextDate)
      setSaveStatus(null)
      window.clearTimeout(pageTurnTimeoutRef.current)
      pageTurnTimeoutRef.current = window.setTimeout(() => setPageTurn(''), 540)
    }, 0)

    return () => window.clearTimeout(syncTimeout)
  }, [dateKey, requestedDate])

  const activeEntry = drafts[dateKey] ?? entriesMap[dateKey] ?? { note: '', mood: null }
  const selectedMood = activeEntry.mood ?? null
  const noteContent = activeEntry.note ?? ''

  const turnToDate = useCallback((direction, offset) => {
    if (pageTurn) return
    setPageTurn(direction)
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setDate(next.getDate() + offset)
      return next
    })
    setSaveStatus(null)
    window.clearTimeout(pageTurnTimeoutRef.current)
    pageTurnTimeoutRef.current = window.setTimeout(() => setPageTurn(''), 540)
  }, [pageTurn])

  const handlePrevDay = useCallback(() => {
    turnToDate('is-turning-backward', -1)
  }, [turnToDate])

  const handleNextDay = useCallback(() => {
    if (dateKey >= todayKey) return
    turnToDate('is-turning-forward', 1)
  }, [dateKey, todayKey, turnToDate])

  const handleMoodSelect = useCallback((moodId) => {
    if (isReadOnly) return
    setDrafts((prev) => {
      const current = prev[dateKey] ?? entriesMap[dateKey] ?? { note: '', mood: null }
      return {
        ...prev,
        [dateKey]: {
          ...current,
          mood: current.mood === moodId ? null : moodId,
        },
      }
    })
    setSaveStatus(null)
  }, [dateKey, entriesMap, isReadOnly])

  const handleNoteChange = useCallback((text) => {
    if (isReadOnly) return
    setDrafts((prev) => {
      const current = prev[dateKey] ?? entriesMap[dateKey] ?? { note: '', mood: null }
      return {
        ...prev,
        [dateKey]: {
          ...current,
          note: text,
        },
      }
    })
    setSaveStatus(null)
  }, [dateKey, entriesMap, isReadOnly])

  const handleSave = async () => {
    if (isPast) {
      setSaveStatus({ type: 'error', text: 'Nhật ký của ngày trước chỉ có thể xem lại, không thể chỉnh sửa hoặc xóa.' })
      return
    }
    if (isFuture) {
      setSaveStatus({ type: 'error', text: 'Bạn chưa thể viết trước nhật ký cho ngày trong tương lai nè!' })
      return
    }

    const trimmed = noteContent.trim()
    if (!trimmed) {
      setSaveStatus({ type: 'error', text: 'Hãy viết vài điều bạn biết ơn trước khi lưu nha!' })
      return
    }

    setIsSaving(true)
    setSaveStatus(null)

    // Save locally immediately
    saveStoredLocalDraft(dateKey, { note: trimmed, mood: selectedMood })
    setEntriesMap((prev) => ({
      ...prev,
      [dateKey]: { note: trimmed, mood: selectedMood },
    }))

    if (!user) {
      setIsSaving(false)
      setSaveStatus({ type: 'success', text: 'Đã lưu vào máy bạn. Đăng nhập để lưu vĩnh viễn nhé!' })
      return
    }

    try {
      const res = await fetch('/api/analytics/diary', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          note: trimmed,
          mood: selectedMood,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Chưa lưu được nhật ký. Bạn thử lại nhé.')
      }

      setSaveStatus({ type: 'success', text: 'Đã lưu lại vào cuốn sổ thành công ✨' })
      onSaved?.()
    } catch (error) {
      setSaveStatus({ type: 'error', text: error.message || 'Lỗi kết nối. Nhật ký tạm lưu trên máy bạn.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="profile-diary-section" id="profile-diary" aria-labelledby="profile-diary-title">
      <div className="profile-diary-container">
        {/* Header */}
        <header className="profile-diary-header">
          <p className="profile-diary-subtitle">CUỐN SỔ NHẬT KÝ</p>
          <h2 id="profile-diary-title" className="profile-diary-heading">
            hôm nay lòng bạn ra sao nè?
          </h2>
        </header>

        {/* 5 Mood selector cards */}
        <div className="profile-diary-mood-list" role="radiogroup" aria-label="Chọn tâm trạng hôm nay">
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.id
            return (
              <button
                type="button"
                key={mood.id}
                role="radio"
                aria-checked={isSelected}
                disabled={isReadOnly}
                className={`profile-diary-mood-card ${isSelected ? 'is-active' : ''}`}
                onClick={() => handleMoodSelect(mood.id)}
              >
                <div className="profile-diary-mood-icon-wrap">
                  <img
                    src={mood.iconBlob}
                    onError={(e) => {
                      // Fallback to local SVG if Blob fails
                      if (e.currentTarget.src !== mood.iconLocal) {
                        e.currentTarget.src = mood.iconLocal
                      }
                    }}
                    alt=""
                    aria-hidden="true"
                    className="profile-diary-mood-icon"
                  />
                </div>
                <span className="profile-diary-mood-label">{mood.label}</span>
              </button>
            )
          })}
        </div>

        {/* Date navigation arrows */}
        <div className="profile-diary-nav-bar">
          <button
            type="button"
            className="profile-diary-nav-btn is-prev"
            aria-label="Ngày trước đó"
            disabled={Boolean(pageTurn)}
            onClick={handlePrevDay}
          >
            <svg viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M42 12H4M14 2L4 12L14 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            className="profile-diary-nav-btn is-next"
            aria-label="Ngày tiếp theo"
            disabled={dateKey >= todayKey || Boolean(pageTurn)}
            onClick={handleNextDay}
          >
            <svg viewBox="0 0 44 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 12H40M30 2L40 12L30 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Notebook sheet */}
        <div key={dateKey} className={`profile-diary-sheet ${pageTurn}`} aria-label={`Trang sổ ngày ${displayDate}`}>
          <div className="profile-diary-sheet-inner">
            {/* Left margin red line */}
            <div className="profile-diary-margin-line" aria-hidden="true" />

            {/* Date header in notebook */}
            <div className="profile-diary-sheet-header">
              <span className="profile-diary-date-text">
                {displayDate}
                {isToday ? ' (Hôm nay)' : ''}
              </span>
            </div>

            {/* Ruled text area */}
            <div className="profile-diary-ruled-area">
              <textarea
                className="profile-diary-textarea"
                value={noteContent}
                readOnly={isReadOnly}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder={isFuture ? 'Chưa tới ngày này nên chưa thể viết nhật ký trước nha...' : isPast ? 'Ngày này chưa có nội dung nhật ký.' : 'Hãy viết vài điều bạn biết ơn trong ngày hôm nay nha...'}
                aria-label={`Nội dung nhật ký ngày ${displayDate}`}
                rows={14}
              />
            </div>
          </div>
        </div>

        {/* Save button & feedback toast */}
        <div className="profile-diary-actions">
          <button
            type="button"
            className="profile-diary-save-btn"
            disabled={isSaving || isReadOnly}
            onClick={handleSave}
          >
            {isSaving ? 'Đang lưu…' : isPast ? 'Chỉ xem nhật ký cũ' : 'Lưu lại'}
          </button>

          {saveStatus ? (
            <p
              className={`profile-diary-feedback is-${saveStatus.type}`}
              role={saveStatus.type === 'error' ? 'alert' : 'status'}
            >
              {saveStatus.text}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
