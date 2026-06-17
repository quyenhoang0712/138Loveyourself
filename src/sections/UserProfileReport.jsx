import { useCallback, useEffect, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'

const authChangedEventName = 'love-yourself-auth-changed'
const visitorProfileStorageKey = 'love-yourself-visitor-profile'

function getProfileForm(user) {
  return {
    age: user?.age || '',
    gender: user?.gender || '',
    name: user?.name || '',
  }
}

function getGenderLabel(gender) {
  if (gender === 'female') return 'Nữ'
  if (gender === 'male') return 'Nam'
  if (gender === 'other') return 'Khác'
  return 'Chưa chọn'
}

function parseJsonText(text) {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function getProfileSaveError(error) {
  const message = error?.message || ''

  if (
    message === 'Failed to fetch'
    || error instanceof SyntaxError
    || message.includes('<!DOCTYPE html>')
    || message.includes('Cannot PATCH')
  ) {
    return 'API lưu profile chưa chạy. Bạn mở backend rồi thử lại nha.'
  }

  return message || 'Chưa lưu được thông tin cá nhân.'
}

function storeVisitorProfileFromUser(user) {
  if (typeof window === 'undefined') return
  if (!Number.isInteger(user?.age) || !['male', 'female', 'other'].includes(user?.gender)) return

  try {
    window.localStorage.setItem(
      visitorProfileStorageKey,
      JSON.stringify({ age: user.age, gender: user.gender }),
    )
  } catch {
    // The account profile is still saved in the database.
  }
}

export function UserProfileReport() {
  const [user, setUser] = useState(null)
  const [form, setForm] = useState(getProfileForm)
  const [message, setMessage] = useState(null)
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' })
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)
  const [isPasswordEditorOpen, setIsPasswordEditorOpen] = useState(false)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return

        setUser(data.user || null)
        setForm(getProfileForm(data.user))
      })
      .catch((error) => {
        if (!ignore && error.name !== 'AbortError') setUser(null)
      })
      .finally(() => {
        if (!ignore) setIsLoadingUser(false)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  const profileName = user?.name || 'Bạn'
  const profileAge = user?.age ? `${user.age} tuổi` : 'Chưa cập nhật'
  const profileGender = getGenderLabel(user?.gender)

  const closeProfileEditor = useCallback(() => {
    if (isSavingProfile || isSavingPassword) return

    setIsProfileEditorOpen(false)
    setIsPasswordEditorOpen(false)
    setMessage(null)
    setPasswordMessage(null)
    setPasswordForm({ password: '', confirmPassword: '' })
  }, [isSavingPassword, isSavingProfile])

  useEffect(() => {
    if (!isProfileEditorOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSavingProfile && !isSavingPassword) {
        if (isPasswordEditorOpen) {
          setIsPasswordEditorOpen(false)
          setPasswordMessage(null)
          return
        }

        closeProfileEditor()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeProfileEditor, isPasswordEditorOpen, isProfileEditorOpen, isSavingPassword, isSavingProfile])

  const openProfileEditor = () => {
    setForm(getProfileForm(user))
    setMessage(null)
    setPasswordMessage(null)
    setPasswordForm({ password: '', confirmPassword: '' })
    setIsPasswordEditorOpen(false)
    setIsProfileEditorOpen(true)
  }

  const handleFieldChange = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
    setMessage(null)
  }

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((currentForm) => ({ ...currentForm, [field]: value }))
    setPasswordMessage(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSavingProfile(true)
    setMessage(null)

    try {
      const payload = {
        name: form.name,
        age: form.age,
        gender: form.gender,
      }

      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const responseText = await response.text()
      const data = parseJsonText(responseText)

      if (!response.ok) {
        throw new Error(data?.error || data?.detail || responseText || 'Chưa lưu được thông tin cá nhân.')
      }

      const currentUserResponse = await fetch('/api/auth/me', { credentials: 'include' })
      const currentUserData = await currentUserResponse.json().catch(() => data)
      const savedUser = currentUserData?.user || data.user

      setUser(savedUser)
      setForm(getProfileForm(savedUser))
      storeVisitorProfileFromUser(savedUser)
      setMessage({ type: 'success', text: data.message || 'Đã cập nhật thông tin cá nhân.' })
      setIsProfileEditorOpen(false)
      window.dispatchEvent(new CustomEvent(authChangedEventName, { detail: { user: savedUser } }))
    } catch (error) {
      setMessage({
        type: 'error',
        text: getProfileSaveError(error),
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setIsSavingPassword(true)
    setPasswordMessage(null)

    try {
      const password = passwordForm.password.trim()
      const confirmPassword = passwordForm.confirmPassword.trim()

      if (password.length < 6) {
        throw new Error('Mật khẩu mới cần ít nhất 6 ký tự.')
      }

      if (password !== confirmPassword) {
        throw new Error('Hai lần nhập mật khẩu chưa khớp.')
      }

      const payload = {
        name: user.name,
        age: user.age,
        gender: user.gender,
        password,
      }

      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const responseText = await response.text()
      const data = parseJsonText(responseText)

      if (!response.ok) {
        throw new Error(data?.error || data?.detail || responseText || 'Chưa đổi được mật khẩu.')
      }

      const savedUser = data.user || user

      setUser(savedUser)
      setForm(getProfileForm(savedUser))
      setPasswordForm({ password: '', confirmPassword: '' })
      setPasswordMessage({ type: 'success', text: 'Đã đổi mật khẩu.' })
      setIsPasswordEditorOpen(false)
      window.dispatchEvent(new CustomEvent(authChangedEventName, { detail: { user: savedUser } }))
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: getProfileSaveError(error),
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <section className="profile-report" aria-labelledby="profile-room-title">
      <div className="profile-hero-bar">
        <SiteHeader variant="static" />
      </div>

      <div className="profile-room-content">
        <div className="profile-room-hero">
          <p className="profile-room-eyebrow">{isLoadingUser ? 'Đang tải hồ sơ' : 'Hồ sơ cá nhân'}</p>
          <h1 id="profile-room-title">Profile của {profileName}</h1>
          <span className="profile-room-intro">
            Mỗi lần bạn ghé thăm, lắng nghe một bản nhạc, mở một lá thư, tập trung học tập hay để lại một lời nhắn cho cộng đồng, nơi này sẽ ghi nhớ tất cả.
            Đây không chỉ là nơi lưu lại những con số, mà còn là nơi lưu giữ hành trình của bạn: những ngày kiên trì, những khoảnh khắc bình yên và những bước tiến nhỏ mà đôi khi chính bạn cũng quên mất.
            Hãy thỉnh thoảng quay lại để nhìn xem mình đã đi được bao xa nhé.
          </span>
          {!user && !isLoadingUser ? (
            <a href="/auth">Đăng nhập để xem profile</a>
          ) : null}
        </div>

        {user ? (
          <div className="profile-shell">
            <aside className="profile-summary-card" aria-label="Tóm tắt hồ sơ">
              <p>Love Yourself member</p>
              <h2>{profileName}</h2>
              <span>{user.email}</span>

              <dl className="profile-summary-list">
                <div>
                  <dt>Tuổi</dt>
                  <dd>{profileAge}</dd>
                </div>
                <div>
                  <dt>Giới tính</dt>
                  <dd>{profileGender}</dd>
                </div>
                <div>
                  <dt>Tài khoản</dt>
                  <dd>Đang hoạt động</dd>
                </div>
              </dl>

              <button className="profile-summary-action" type="button" onClick={openProfileEditor}>
                Chỉnh sửa profile
              </button>
            </aside>
          </div>
        ) : null}

        {user && isProfileEditorOpen ? (
          <div className="profile-edit-overlay" role="presentation" onMouseDown={closeProfileEditor}>
            <div
              className="profile-edit-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-edit-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <form className="profile-info-card profile-info-popup-card" onSubmit={handleSubmit}>
                <div className="profile-info-heading">
                  <p>Chỉnh sửa profile</p>
                  <h2 id="profile-edit-title">Thông tin cá nhân</h2>
                </div>

                <button
                  className="profile-edit-close"
                  type="button"
                  aria-label="Đóng popup chỉnh sửa profile"
                  disabled={isSavingProfile}
                  onClick={closeProfileEditor}
                >
                  ×
                </button>

                <label>
                  <span>Email</span>
                  <input type="email" value={user.email} disabled readOnly />
                </label>

                <label>
                  <span>Tên hiển thị</span>
                  <input
                    type="text"
                    value={form.name}
                    maxLength="80"
                    required
                    onChange={(event) => handleFieldChange('name', event.target.value)}
                  />
                </label>

                <label>
                  <span>Tuổi</span>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    inputMode="numeric"
                    value={form.age}
                    required
                    onChange={(event) => handleFieldChange('age', event.target.value)}
                  />
                </label>

                <label>
                  <span>Giới tính</span>
                  <select
                    value={form.gender}
                    required
                    onChange={(event) => handleFieldChange('gender', event.target.value)}
                  >
                    <option value="" disabled>Chọn một mục</option>
                    <option value="female">Nữ</option>
                    <option value="male">Nam</option>
                    <option value="other">Khác</option>
                  </select>
                </label>

                <div className="profile-security-row">
                  <div>
                    <span>Bảo mật</span>
                    <strong>Mật khẩu được chỉnh riêng để tránh bấm nhầm.</strong>
                  </div>
                  <button
                    className="profile-password-open"
                    type="button"
                    onClick={() => {
                      setPasswordMessage(null)
                      setPasswordForm({ password: '', confirmPassword: '' })
                      setIsPasswordEditorOpen(true)
                    }}
                  >
                    Đổi mật khẩu
                  </button>
                </div>

                {message ? <p className={`profile-info-message is-${message.type}`}>{message.text}</p> : null}

                <button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>

              {isPasswordEditorOpen ? (
                <form className="profile-password-panel" onSubmit={handlePasswordSubmit}>
                  <div className="profile-info-heading">
                    <p>Bảo mật</p>
                    <h2>Đổi mật khẩu</h2>
                  </div>

                  <label>
                    <span>Mật khẩu mới</span>
                    <input
                      type="password"
                      value={passwordForm.password}
                      minLength="6"
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu mới"
                      required
                      onChange={(event) => handlePasswordFieldChange('password', event.target.value)}
                    />
                  </label>

                  <label>
                    <span>Nhập lại mật khẩu</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      minLength="6"
                      autoComplete="new-password"
                      placeholder="Nhập lại để chắc nha"
                      required
                      onChange={(event) => handlePasswordFieldChange('confirmPassword', event.target.value)}
                    />
                  </label>

                  {passwordMessage ? <p className={`profile-info-message is-${passwordMessage.type}`}>{passwordMessage.text}</p> : null}

                  <div className="profile-password-actions">
                    <button type="button" disabled={isSavingPassword} onClick={() => setIsPasswordEditorOpen(false)}>
                      Hủy
                    </button>
                    <button type="submit" disabled={isSavingPassword}>
                      {isSavingPassword ? 'Đang đổi...' : 'Lưu mật khẩu'}
                    </button>
                  </div>
                </form>
              ) : passwordMessage ? (
                <p className={`profile-info-message profile-password-toast is-${passwordMessage.type}`}>{passwordMessage.text}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
