import { assetUrl } from '../utils/assets'

export function ProfileRoomScene({ user, isLoadingUser, today, lampLit, onEditProfile, onOpenPopup }) {
  return (
    <div className="profile-room-scene-wrap">
      <div className="profile-room-scene" aria-label="Căn phòng cá nhân của bạn">
        <img className="profile-room-base" src={assetUrl('profile-room/picdautrang.svg')} alt="Căn phòng với bàn học, cây xanh, cửa sổ và ghế sofa" />
        <img className="profile-room-window" src={assetUrl('profile-room/cuaso.svg')} alt="" />

        <div className="profile-room-account">
          <img src={assetUrl('profile-room/taikhoan.svg')} alt="" />
          <div className="profile-room-email"><span>Tài khoản:</span> <span title={user?.email}>{isLoadingUser ? 'Đang tải…' : user?.email || 'Chưa đăng nhập'}</span></div>
          <div className="profile-room-age"><span>Tuổi:</span> {user?.age ? `${user.age} tuổi` : 'Chưa cập nhật'}</div>
          <div className="profile-room-gender"><span>Giới tính:</span> {{ male: 'Nam', female: 'Nữ', other: 'Khác' }[user?.gender] || 'Chưa cập nhật'}</div>
          {user ? (
            <button type="button" className="profile-room-edit" aria-haspopup="dialog" onClick={onEditProfile}>
              <span className="profile-edit-text-full">Chỉnh sửa profile</span>
              <span className="profile-edit-text-short" aria-hidden="true">Sửa</span>
            </button>
          ) : (
            <a className="profile-room-edit" href="/auth">
              <span className="profile-edit-text-full">Đăng nhập</span>
              <span className="profile-edit-text-short" aria-hidden="true">Vào</span>
            </a>
          )}
        </div>

        <button type="button" className="profile-room-computer" aria-label="Mở popup Tập trung" aria-haspopup="dialog" onClick={() => onOpenPopup('focus')}>
          <img src={assetUrl('profile-room/maytinh.svg')} alt="" />
          <span>Tập trung</span>
        </button>

        <button type="button" className="profile-room-calendar" aria-label="Mở popup Lịch" aria-haspopup="dialog" onClick={() => onOpenPopup('calendar')}>
          <img src={assetUrl('profile-room/lich.svg')} alt="" />
          <span className="profile-room-month">tháng {today.getMonth() + 1}</span>
          <span className="profile-room-day">{today.getDate()}</span>
        </button>

        <button type="button" className="profile-room-lamp" aria-label={lampLit ? "Đèn đã bật — mở nhiệm vụ hệ thống" : "Đèn chưa bật — mở nhiệm vụ hệ thống"} aria-haspopup="dialog" onClick={() => onOpenPopup('lamp')}>
          <img src={assetUrl('profile-room/den.svg')} alt="" />
          {lampLit ? <img className="profile-room-light" src={assetUrl('profile-room/anhden.svg')} alt="" /> : null}
        </button>
      </div>

      <nav className="profile-room-mobile-shortcuts" aria-label="Lối tắt các tiện ích trong phòng">
        <button type="button" className="profile-room-shortcut-btn" onClick={() => onOpenPopup('focus')}>
          <span className="profile-room-shortcut-icon">⏱️</span>
          <span>Tập trung</span>
        </button>
        <button type="button" className="profile-room-shortcut-btn" onClick={() => onOpenPopup('calendar')}>
          <span className="profile-room-shortcut-icon">📅</span>
          <span>Lịch ({today.getDate()}/{today.getMonth() + 1})</span>
        </button>
        <button type="button" className={`profile-room-shortcut-btn ${lampLit ? 'is-lit' : ''}`} onClick={() => onOpenPopup('lamp')}>
          <span className="profile-room-shortcut-icon">{lampLit ? '💡' : '🕯️'}</span>
          <span>Nhiệm vụ {lampLit ? '✓' : ''}</span>
        </button>
        {user ? (
          <button type="button" className="profile-room-shortcut-btn" onClick={onEditProfile}>
            <span className="profile-room-shortcut-icon">✏️</span>
            <span>Sửa hồ sơ</span>
          </button>
        ) : (
          <a className="profile-room-shortcut-btn" href="/auth">
            <span className="profile-room-shortcut-icon">🔑</span>
            <span>Đăng nhập</span>
          </a>
        )}
      </nav>
    </div>
  )
}
