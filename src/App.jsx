import { AppLayout } from './components/AppLayout'
import { AuthPage } from './components/AuthPage'
import { useAppState } from './hooks/useAppState'
import './App.css'

function HomePage() {
  return <AppLayout state={useAppState()} />
}

function App() {
  return window.location.pathname === '/auth' ? <AuthPage /> : <HomePage />
}

export default App
