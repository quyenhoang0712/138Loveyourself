import { useEffect, useState } from 'react'
import { AppLayout } from './components/AppLayout'
import { AuthPage } from './components/AuthPage'
import { useAppState } from './hooks/useAppState'
import './App.css'

const protectedEntryPath = '/tl'
const protectedEntryRoomHash = '#tl-room'
const protectedEntryRoomPath = `${protectedEntryPath}${protectedEntryRoomHash}`

function HomePage() {
  return <AppLayout state={useAppState()} />
}

function ProtectedHomePage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) return

        if (data.user) {
          if (window.location.hash !== protectedEntryRoomHash) {
            window.history.replaceState(null, '', protectedEntryRoomPath)
          }

          setIsAuthenticated(true)
          setIsCheckingAuth(false)
          return
        }

        const returnTo = protectedEntryRoomPath
        window.location.replace(`/auth?returnTo=${encodeURIComponent(returnTo)}`)
      })
      .catch((error) => {
        if (ignore || error.name === 'AbortError') return
        window.location.replace(`/auth?returnTo=${encodeURIComponent(protectedEntryRoomPath)}`)
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [])

  if (isCheckingAuth) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-live="polite">
          <div className="auth-profile">
            <p>Tài khoản của bạn</p>
            <h1>Đang kiểm tra...</h1>
            <span>Mình đang xem bạn đã đăng nhập chưa.</span>
          </div>
        </section>
      </main>
    )
  }

  return isAuthenticated ? <HomePage /> : null
}

function App() {
  if (window.location.pathname === '/auth') return <AuthPage />
  if (window.location.pathname === protectedEntryPath) return <ProtectedHomePage />
  return <HomePage />
}

export default App
