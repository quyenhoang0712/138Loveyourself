import { AppLayout } from './components/AppLayout'
import { AuthPage } from './components/AuthPage'
import { WriteLetterPage } from './components/WriteLetterPage'
import { useAppState } from './hooks/useAppState'
import './App.css'
import './components/AuthPage.css'

function HomePage() {
  return <AppLayout state={useAppState()} />
}

function App() {
  if (window.location.pathname === '/auth') return <AuthPage />
  if (window.location.pathname === '/write-letter') return <WriteLetterPage />
  return <HomePage />
}

export default App
