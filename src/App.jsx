import { AppLayout } from './components/AppLayout'
import { AuthPage } from './components/AuthPage'
import { AdminPage } from './components/AdminPage'
import { NotFoundPage } from './components/NotFoundPage'
import { WriteLetterPage } from './components/WriteLetterPage'
import { useAppState } from './hooks/useAppState'
import './App.css'
import './styles/rooms/FocusRoom.css'
import './styles/rooms/SoundRoom.css'
import './styles/rooms/PlayRoom.css'
import './styles/rooms/CommunityRoom.css'
import './styles/rooms/CardRoom.css'
import './styles/rooms/HealingRoom.css'
import './components/AuthPage.css'
import './components/AdminPage.css'

function HomePage() {
  return <AppLayout state={useAppState()} />
}

function App() {
  if (window.location.pathname === '/auth') return <AuthPage />
  if (window.location.pathname === '/admin') return <AdminPage />
  if (window.location.pathname === '/write-letter') return <WriteLetterPage />
  if (window.location.pathname === '/') return <HomePage />
  return <NotFoundPage />
}

export default App
