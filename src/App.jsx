import { AppLayout } from './components/AppLayout'
import { useAppState } from './hooks/useAppState'
import './App.css'

function App() {
  return <AppLayout state={useAppState()} />
}

export default App
