import { assetUrl } from '../utils/assets'

export function ProfileTasksPopup({ user, loading, error, tasks, onClose }) {
  const ready = Boolean(user && !loading && !error && tasks)
  const items = [
    { text: 'Nhận thông điệp ngày hôm nay', complete: ready && tasks.quoteOpened },
    { text: 'Làm tan ít nhất 4 cục đá', complete: ready && tasks.meltedCubes >= 4 },
    { text: 'Viết nhật ký về ngày hôm nay', complete: ready && tasks.diaryWritten },
  ]

  return (
    <div className="profile-tasks-design">
      <img className="profile-focus-book" src={assetUrl('profile-room/sach.svg')} alt="" />
      <button type="button" className="profile-focus-dismiss" aria-label="Đóng nhiệm vụ hệ thống" onClick={onClose}>
        <svg viewBox="0 0 40 40" aria-hidden="true"><path d="m10 10 20 20M30 10 10 30" /></svg>
      </button>
      <div className="profile-tasks-frame">
        <p className="profile-tasks-label">Nhiệm vụ hệ thống</p>
        <h2 id="profile-room-popup-title">Làm nhiệm vụ để bật đèn</h2>
        <ol className="profile-tasks-list" aria-busy={loading}>
          {items.map((item, index) => (
            <li key={item.text} className={item.complete ? 'is-complete' : ''}>
              <img src="https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/public/nv-B1m7S6GaIqAhhVPUnj3UwhafPIf5Ow.svg" alt="" />
              <span className="profile-task-number" aria-hidden="true">0{index + 1}</span>
              <span className="profile-task-text">{item.text}{index === 1 && ready ? <small className="profile-task-progress">{Math.min(tasks.meltedCubes, 4)}/4 cục đá</small> : null}</span>
              {item.complete ? <span className="profile-task-check" aria-label="Đã hoàn thành">✓</span> : null}
            </li>
          ))}
        </ol>
        <div className="profile-tasks-status" aria-live="polite">
          {loading ? 'Đang tải nhiệm vụ…' : error ? <span role="alert">{error}</span> : !user ? <><a href="/auth">Đăng nhập</a> để theo dõi nhiệm vụ của bạn.</> : ready ? `${items.filter((item) => item.complete).length}/3 nhiệm vụ đã hoàn thành${items.every((item) => item.complete) ? ' — Đã bật đèn cho ngày này!' : ''}` : null}
        </div>
      </div>
    </div>
  )
}
