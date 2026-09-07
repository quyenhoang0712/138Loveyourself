import { useState } from 'react'
import { assetUrl } from '../utils/assets'

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function ProfileCalendar({ user, loading, error, onClose }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const today = dateKey(new Date())
  const visitedDates = new Set(user?.returnStreak?.visitedDates || [])
  const offset = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1))
  const changeMonth = (direction) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1))

  return (
    <div className="profile-calendar-design">
      <img className="profile-calendar-clock" src={assetUrl('profile-room/dongho.svg')} alt="" />
      <button className="profile-calendar-dismiss" type="button" aria-label="Đóng lịch" onClick={onClose}>
        <svg viewBox="0 0 40 40" aria-hidden="true"><path d="m10 10 20 20M30 10 10 30" /></svg>
      </button>
      <div className="profile-calendar-frame">
        <div className="profile-calendar-meta">
          <p>Tháng {month.getMonth() + 1} năm {month.getFullYear()}</p>
          {user && !loading && !error ? <p>Bạn đã đồng hành cùng<br />mình được <strong>{visitedDates.size}</strong> ngày</p> : null}
        </div>
        <div className="profile-calendar-title-row">
          <button type="button" aria-label="Tháng trước" onClick={() => changeMonth(-1)}><svg viewBox="0 0 60 48" aria-hidden="true"><path d="M53 24H7m18-18L7 24l18 18" /></svg></button>
          <h2 id="profile-room-popup-title">lịch sử hoạt động</h2>
          <button type="button" aria-label="Tháng sau" onClick={() => changeMonth(1)}><svg viewBox="0 0 60 48" aria-hidden="true"><path d="M7 24h46M35 6l18 18-18 18" /></svg></button>
        </div>
        <div className="profile-calendar-status" aria-live="polite">
          {loading ? 'Đang tải lịch…' : error || (!user ? <><a href="/auth">Đăng nhập</a> để xem lịch sử của bạn.</> : null)}
        </div>
        <div className="profile-calendar-month-grid" aria-label={`Lịch tháng ${month.getMonth() + 1} năm ${month.getFullYear()}`}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label, index) => <div className={`profile-calendar-column-title ${index > 4 ? 'is-weekend' : ''}`} key={label}>{label}</div>)}
          {cells.map((date) => {
            const key = dateKey(date)
            const isToday = key === today
            const visited = !loading && !error && visitedDates.has(key)
            const outside = date.getMonth() !== month.getMonth()
            return (
              <div key={key} className={`profile-calendar-cell ${outside ? 'is-outside' : ''}`} aria-label={`${date.toLocaleDateString('vi-VN')}${visited ? ', đã ghé thăm' : ''}`} aria-current={isToday ? 'date' : undefined}>
                <span className={`profile-calendar-date ${visited ? 'is-visited' : ''} ${isToday ? 'is-today' : ''}`}>
                  {date.getDate()}
                  {visited ? <svg className="profile-calendar-pencil" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 21 2-7L17 2l5 5-12 12-7 2Zm2-7 5 5M15 4l5 5M4 18l2 2M8 16 18 6" /></svg> : null}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
