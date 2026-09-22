import { AppLayout } from './components/AppLayout'
import { AuthPage } from './components/AuthPage'
import { AdminPage } from './components/AdminPage'
import { DeveloperPage } from './components/DeveloperPage'
import { NotFoundPage } from './components/NotFoundPage'
import { WriteLetterPage } from './components/WriteLetterPage'
import { SiteVisualRuntime } from './components/SiteVisualRuntime'
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
import './components/DeveloperPage.css'

function HomePage() {
  return <AppLayout state={useAppState()} />
}

function App() {
  let page
  if (window.location.pathname === '/auth') page = <AuthPage />
  else if (window.location.pathname === '/admin') page = <AdminPage />
  else if (window.location.pathname === '/developer') page = <DeveloperPage />
  else if (window.location.pathname === '/write-letter') page = <WriteLetterPage />
  else if (window.location.pathname === '/') page = <HomePage />
  else page = <NotFoundPage />
  return <><SiteVisualRuntime />{page}</>
}

export default App
