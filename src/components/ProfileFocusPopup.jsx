import { assetUrl } from '../utils/assets'

export function ProfileFocusPopup({ user, loading, error, seconds, onClose }) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const time = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60].map((part) => String(part).padStart(2, '0')).join(':')

  return (
    <div className="profile-focus-design">
      <img className="profile-focus-book" src={assetUrl('profile-room/sach.svg')} alt="" aria-hidden="true" />
      <button type="button" className="profile-focus-dismiss" aria-label="Đóng popup Tập trung" onClick={onClose}>
        <svg viewBox="0 0 40 40" aria-hidden="true"><path d="m10 10 20 20M30 10 10 30" /></svg>
      </button>
      <div className="profile-focus-frame">
        <h2 id="profile-room-popup-title">Hôm nay bạn đã tập trung</h2>
        <div className="profile-focus-time" aria-live="polite" aria-busy={loading}>
          {loading ? <span className="profile-focus-status">Đang tải…</span> : error ? <span className="profile-focus-status" role="alert">{error}</span> : !user ? <span className="profile-focus-status"><a href="/auth">Đăng nhập</a> để xem thời gian của bạn</span> : <span>{time}</span>}
        </div>
        <a className="profile-focus-continue" href="#focus-room" onClick={onClose}>Tiếp tục làm việc</a>
      </div>
    </div>
  )
}
