import { useEffect, useState } from 'react'
import { LogoutIcon } from './icons'

const authChangedEventName = 'love-yourself-auth-changed'
const visitorProfileStorageKey = 'love-yourself-visitor-profile'

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
  if (typeof window === 'undefined') return

  const age = Number(profile?.age)
  const gender = profile?.gender
  if (!Number.isInteger(age) || age < 1 || age > 120) return
  if (!['male', 'female', 'other'].includes(gender)) return

  try {
    window.localStorage.setItem(visitorProfileStorageKey, JSON.stringify({ age, gender }))
  } catch {
    // The account flow can continue without browser storage.
  }
}

export function AuthPage() {
  const [mode, setMode] = useState('login')
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isRegister = mode === 'register'

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setUser(data.user || null)
      })
      .catch((error) => {
        if (!ignore && error.name !== 'AbortError') setUser(null)
      })
      .finally(() => {
        if (!ignore) setIsCheckingSession(false)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setMessage(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)
    const storedProfile = getStoredVisitorProfile()
    const profileToSync = storedProfile

    if (isRegister && !profileToSync) {
      setMessage({
        type: 'error',
        text: 'Bạn quay lại trang chủ nhập tuổi và giới tính trước, rồi đăng ký lại nha.',
      })
      setIsSubmitting(false)
      return
    }

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      age: profileToSync?.age,
      gender: profileToSync?.gender,
    }

    try {
      const response = await fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await response.json() : null

      if (!response.ok) {
        if (!data) {
          throw new Error('API tài khoản chưa sẵn sàng. Bạn khởi động lại máy chủ rồi thử lại nha.')
        }

        if (response.status === 503) {
          throw new Error('Hệ thống tài khoản đang tạm bận. Bạn thử lại sau nha.')
        }

        throw new Error(data.error || 'Chưa thể xử lý yêu cầu.')
      }

      setUser(data.user)
      storeVisitorProfile(data.user)
      window.dispatchEvent(new CustomEvent(authChangedEventName, { detail: { user: data.user } }))
      setMessage({ type: 'success', text: data.message })
      form.reset()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message === 'Failed to fetch'
          ? 'Không kết nối được máy chủ. Bạn kiểm tra MongoDB và thử lại nha.'
          : error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      if (!response.ok) throw new Error('Chưa thể đăng xuất lúc này. Bạn thử lại nha.')

      setUser(null)
      setMode('login')
      window.dispatchEvent(new CustomEvent(authChangedEventName, { detail: { user: null } }))
      setMessage({ type: 'success', text: 'Bạn đã đăng xuất.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="auth-page">
      <a className="auth-back-link" href="/">
        ← Về trang chủ
      </a>

      <section className="auth-card" aria-labelledby="auth-title">
        <a className="auth-brand" href="/">
          <span>LOVE YOURSELF</span>
          <small>138knitwear</small>
        </a>

        {isCheckingSession ? (
          <div className="auth-profile" aria-live="polite">
            <p>Tài khoản của bạn</p>
            <h1 id="auth-title">Đang kiểm tra...</h1>
            <span>Mình đang xem phiên đăng nhập còn hiệu lực không.</span>
          </div>
        ) : user ? (
          <div className="auth-profile">
            <p>Tài khoản của bạn</p>
            <h1 id="auth-title">{user.name}</h1>
            <span>{user.email}</span>
            {message ? <p className={`auth-message is-${message.type}`}>{message.text}</p> : null}
            <div>
              <a href="/">Vào trang chủ</a>
              <button
                className="auth-logout-button"
                type="button"
                aria-label="Đăng xuất"
                title="Đăng xuất"
                disabled={isLoggingOut}
                onClick={handleLogout}
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        ) : (
          <>
        <div className={`auth-tabs ${isRegister ? 'is-register' : 'is-login'}`} aria-label="Chọn hình thức tài khoản">
          <button
            className={mode === 'login' ? 'is-active' : ''}
            type="button"
            onClick={() => handleModeChange('login')}
          >
            Đăng nhập
          </button>
          <button
            className={isRegister ? 'is-active' : ''}
            type="button"
            onClick={() => handleModeChange('register')}
          >
            Đăng ký
          </button>
        </div>

        <div className="auth-heading">
          <p>{isRegister ? 'Chào bạn mới' : 'Mừng bạn quay lại'}</p>
          <h1 id="auth-title">{isRegister ? 'Tạo một tài khoản nha.' : 'Mình gặp lại nhau rồi.'}</h1>
        </div>

        {message ? <p className={`auth-message is-${message.type}`}>{message.text}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <label>
              <span>Tên hiển thị</span>
              <input name="name" type="text" autoComplete="name" placeholder="Mình nên gọi bạn là gì?" required />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" placeholder="ban@email.com" required />
          </label>

          <label>
            <span>Mật khẩu</span>
            <input
              type="password"
              name="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder="Nhập mật khẩu"
              minLength="6"
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>
        </form>
          </>
        )}
      </section>
    </main>
  )
}
