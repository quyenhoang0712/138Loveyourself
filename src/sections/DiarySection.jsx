import { useEffect, useMemo, useState } from 'react'

const diaryDraftStorageKey = 'love-yourself-diary-drafts'
const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const moodLevels = [
  { value: 1, label: 'Mệt nhiều' },
  { value: 2, label: 'Hơi chùng' },
  { value: 3, label: 'Đang ổn' },
  { value: 4, label: 'Nhẹ lòng' },
  { value: 5, label: 'Rất vui' },
]

function getDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonthDays(year, month) {
  const firstDate = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlankCount = (firstDate.getDay() + 6) % 7
  const days = Array.from({ length: leadingBlankCount }, (_, index) => ({ key: `blank-${index}`, day: null }))

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    days.push({ key: getDateKey(date), day, date })
  }

  return days
}

function getStoredDrafts() {
  if (typeof window === 'undefined') return {}

  try {
    return JSON.parse(window.localStorage.getItem(diaryDraftStorageKey) || '{}')
  } catch {
    return {}
  }
}

function storeDrafts(drafts) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(diaryDraftStorageKey, JSON.stringify(drafts))
  } catch {
    // Drafts can safely remain in memory if storage is unavailable.
  }
}

export function DiarySection() {
  const today = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => getDateKey(today), [today])
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const [drafts, setDrafts] = useState(getStoredDrafts)
  const selectedDraft = drafts[selectedDateKey] || { mood: null, note: '' }
  const calendarDays = useMemo(() => getMonthDays(today.getFullYear(), today.getMonth()), [today])
  const monthLabel = today.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  const selectedDateLabel = new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const selectedDayNumber = Number(selectedDateKey.slice(-2))
  const selectedMonthNumber = Number(selectedDateKey.slice(5, 7))

  useEffect(() => {
    storeDrafts(drafts)
  }, [drafts])

  const updateSelectedDraft = (updates) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [selectedDateKey]: {
        ...(currentDrafts[selectedDateKey] || { mood: null, note: '' }),
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  return (
    <section className="diary-room" aria-labelledby="diary-room-heading">
      <div className="diary-calendar" aria-labelledby="diary-calendar-title">
        <div className="diary-calendar-sheet" aria-label={selectedDateLabel}>
          <p>Lịch</p>
          <strong>{selectedDayNumber}</strong>
          <span>Tháng {selectedMonthNumber}</span>
        </div>

        <div className="diary-calendar-main">
          <div className="diary-panel-heading">
            <p>Lịch nhật ký</p>
            <h2 id="diary-calendar-title">{monthLabel}</h2>
          </div>

          <div className="diary-calendar-grid">
            {weekdays.map((weekday) => (
              <span className="diary-calendar-weekday" key={weekday}>{weekday}</span>
            ))}

            {calendarDays.map((date) => {
              if (!date.day) return <span className="diary-calendar-day is-empty" key={date.key} />

              const hasDraft = Boolean(drafts[date.key]?.note || drafts[date.key]?.mood)
              const isSelected = date.key === selectedDateKey
              const isToday = date.key === todayKey

              return (
                <button
                  className={[
                    'diary-calendar-day',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                    hasDraft ? 'has-draft' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  key={date.key}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDateKey(date.key)}
                >
                  <span>{date.day}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="diary-mood-box" aria-labelledby="diary-mood-title">
        <div className="diary-panel-heading">
          <p>Chạm nhẹ vào cảm xúc</p>
          <h2 id="diary-mood-title">Hôm nay lòng mình ra sao?</h2>
        </div>

        <div className="diary-mood-scale" role="radiogroup" aria-label="Mức tâm trạng">
          {moodLevels.map((mood) => (
            <button
              className={`diary-mood-button ${selectedDraft.mood === mood.value ? 'is-selected' : ''}`}
              type="button"
              key={mood.value}
              role="radio"
              aria-checked={selectedDraft.mood === mood.value}
              onClick={() => updateSelectedDraft({ mood: mood.value })}
            >
              <span className={`diary-mood-icon is-level-${mood.value}`} aria-hidden="true">
                <i />
              </span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="diary-notebook" aria-labelledby="diary-room-heading">
        <div className="diary-notebook-page">
          <span className="diary-page-number" aria-label="Trang 1">
            1
          </span>
          <div className="diary-panel-heading">
            <p>{selectedDateLabel}</p>
            <h2 id="diary-room-heading">Cuốn sổ nhật ký</h2>
          </div>

          <label className="diary-notebook-field">
            <span>Viết vài dòng cho ngày này</span>
            <textarea
              value={selectedDraft.note}
              placeholder="Hôm nay mình muốn ghi lại..."
              onChange={(event) => updateSelectedDraft({ note: event.target.value })}
            />
          </label>
        </div>
      </div>
    </section>
  )
}
