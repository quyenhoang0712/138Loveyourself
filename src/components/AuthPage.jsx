import { useEffect, useState } from 'react'
import { LogoutIcon } from './icons'

export function AuthPage() {
  const [mode, setMode] = useState('login')
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isRegister = mode === 'register'

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => undefined)
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
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    }

    try {
      const response = await fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
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
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setMode('login')
    setMessage({ type: 'success', text: 'Bạn đã đăng xuất.' })
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

        {user ? (
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
                onClick={handleLogout}
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
        ) : (
          <>
        <div className="auth-tabs" aria-label="Chọn hình thức tài khoản">
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
