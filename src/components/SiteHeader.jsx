import { useEffect, useState } from 'react'
import { LogoutIcon } from './icons'

const authChangedEventName = 'love-yourself-auth-changed'

export function SiteHeader({ onHomeNavigate, onIntroOpen, onProfileNavigate, variant = 'sticky' }) {
  const [user, setUser] = useState(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const profileLabel = `Phòng của ${user?.name || 'bạn'}`

  const handleNavigationClick = (event, navigate) => {
    if (!navigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

    event.preventDefault()
    navigate()
  }

  useEffect(() => {
    const controller = new AbortController()

    const handleAuthChanged = (event) => {
      setUser(event.detail?.user || null)
    }

    window.addEventListener(authChangedEventName, handleAuthChanged)

    fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch((error) => {
        if (error.name !== 'AbortError') setUser(null)
      })

    return () => {
      controller.abort()
      window.removeEventListener(authChangedEventName, handleAuthChanged)
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      setUser(null)
      window.dispatchEvent(new CustomEvent(authChangedEventName, { detail: { user: null } }))
    } catch {
      // Keep the user visible if the server did not confirm logout.
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className={`site-header site-header-${variant}`}>
      {onIntroOpen ? (
        <button className="header-intro-button" type="button" aria-label="Giới thiệu phòng" onClick={onIntroOpen}>
          Giới thiệu
        </button>
      ) : null}

      <a
        className="brand"
        href="/"
        aria-label="Love Yourself 138knitwear"
        onClick={(event) => handleNavigationClick(event, onHomeNavigate)}
      >
        <span>LOVE YOURSELF</span>
        <small>138knitwear</small>
      </a>
      {user ? (
        <div className="header-account-actions">
          <a
            className="header-account-button"
            href="#profile"
            onClick={(event) => handleNavigationClick(event, onProfileNavigate)}
          >
            <span>{profileLabel}</span>
          </a>
          <button
            className="header-logout-button"
            type="button"
            aria-label="Đăng xuất"
            title="Đăng xuất"
            disabled={isLoggingOut}
            onClick={handleLogout}
          >
            <LogoutIcon />
          </button>
        </div>
      ) : (
        <a className="header-account-button" href="/auth">
          Đăng nhập/Đăng ký
        </a>
      )}
    </header>
  )
}
