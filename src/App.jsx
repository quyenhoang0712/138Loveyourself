import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { selfHelpBooks } from './books'
import { bookTranslations, languageOptions, translations } from './i18n'
import { decisionMessages } from './decisionMessages'
import { quotes } from './quotes'
import './App.css'

const heroVideoUrl = 'https://cdn.hstatic.net/files/200001082964/file/website.mp4'
const letterCount = 4
const lastQuoteStorageKey = 'lastOpenedQuote'
const customShareFramesStorageKey = 'customShareFrames'
const colorModeOverrideStorageKey = 'colorModeOverride'
const languageStorageKey = 'language'
const timerModes = {
  pomodoro: {
    minutes: 25,
  },
  short: {
    minutes: 5,
  },
  long: {
    minutes: 15,
  },
}
const timerModeKeys = Object.keys(timerModes)
const ambientSoundOptions = [
  { id: 'rain', label: 'Mưa', src: '/liecio-calming-rain-257596.mp3' },
  { id: 'waves', label: 'Sóng', src: '/freesound_community-waves-at-the-wave-organ-19507.mp3' },
  { id: 'fire', label: 'Lửa', src: '/soundreality-fire-crackling-sound-499636.mp3' },
]
const rainDropCount = 42
const waveRippleCount = 12
const fireSparkCount = 24
const shareFrames = [
  {
    id: 'mint',
    label: 'Mint',
    background: '#b7e1cc',
    card: '#8fc3d4',
    accent: '#fffef0',
    text: '#6f9ed8',
  },
  {
    id: 'blue',
    label: 'Blue',
    background: '#b8d8ef',
    card: '#6f9ed8',
    accent: '#fffadc',
    text: '#5d92d4',
  },
  {
    id: 'cream',
    label: 'Cream',
    background: '#fffadc',
    card: '#9ed0df',
    accent: '#fffef0',
    text: '#6f9ed8',
  },
  {
    id: 'dark',
    label: 'Dark',
    background: '#1f1f1f',
    card: '#32463a',
    accent: '#f8fff5',
    text: '#314236',
  },
  {
    id: 'rose',
    label: 'Rose',
    background: '#f4b1b1',
    card: '#df8fa7',
    accent: '#fff7ec',
    text: '#d47496',
  },
  {
    id: 'lavender',
    label: 'Lavender',
    background: '#c3c8ef',
    card: '#7f8cc7',
    accent: '#fffadc',
    text: '#6f7ec6',
  },
  {
    id: 'sage',
    label: 'Sage',
    background: '#cfd7a8',
    card: '#7d9478',
    accent: '#fffef0',
    text: '#6e8a75',
  },
  {
    id: 'sky',
    label: 'Sky',
    background: '#d8eff4',
    card: '#8fc3d4',
    accent: '#ffffff',
    text: '#6f9ed8',
  },
]
const shareTextColors = ['#6f9ed8', '#d47496', '#6f7ec6', '#6e8a75', '#314236', '#fffef0', '#ffffff', '#111111']

function getAutomaticNightMode() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return true
  }

  const currentHour = new Date().getHours()
  return currentHour < 6 || currentHour >= 17
}

function getSavedColorModeOverride() {
  try {
    const savedMode = localStorage.getItem(colorModeOverrideStorageKey)
    return savedMode === 'day' || savedMode === 'night' ? savedMode : 'auto'
  } catch {
    return 'auto'
  }
}

function getNightModeFromPreference(colorModePreference) {
  if (colorModePreference === 'night') return true
  if (colorModePreference === 'day') return false
  return getAutomaticNightMode()
}

function getNextDecisionMessageForLanguage(language, currentMessage = '') {
  const activeDecisionMessages = decisionMessages[language] || decisionMessages.vi
  const nextOptions =
    activeDecisionMessages.length > 1
      ? activeDecisionMessages.filter((message) => message !== currentMessage)
      : activeDecisionMessages

  return nextOptions[Math.floor(Math.random() * nextOptions.length)]
}

function drawRoundRect(context, x, y, width, height, radius) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function wrapCanvasText(context, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine
      return
    }

    lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) lines.push(currentLine)
  return lines
}

function getShareQuoteFontSize(text) {
  if (text.length > 190) return 'clamp(0.7rem, 1.7vw, 0.92rem)'
  if (text.length > 140) return 'clamp(0.78rem, 1.9vw, 1.08rem)'
  if (text.length > 95) return 'clamp(0.88rem, 2.25vw, 1.28rem)'
  if (text.length > 58) return 'clamp(0.98rem, 2.65vw, 1.5rem)'

  return 'clamp(1.08rem, 3.1vw, 1.75rem)'
}

function fitCanvasQuote(context, text, maxWidth, maxHeight, initialFontSize) {
  let fontSize = initialFontSize
  let lines = []
  let lineHeight = 0

  while (fontSize >= 26) {
    context.font = `800 ${fontSize}px Sora, Inter, Arial, sans-serif`
    lines = wrapCanvasText(context, text, maxWidth)
    lineHeight = fontSize * 1.18

    if (lines.length * lineHeight <= maxHeight) break
    fontSize -= 4
  }

  return { lines, lineHeight, fontSize }
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawCoverImage(context, image, width, height) {
  const imageRatio = image.width / image.height
  const canvasRatio = width / height
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width
  const drawX = (width - drawWidth) / 2
  const drawY = (height - drawHeight) / 2

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function cleanQuote(quoteText) {
  return quoteText.replaceAll('"', '').replaceAll('\n', ' ').trim()
}

function getRandomQuote() {
  const availableQuotes = quotes.map(cleanQuote).filter(Boolean)
  if (availableQuotes.length === 0) return ''

  let lastQuote = ''

  try {
    lastQuote = sessionStorage.getItem(lastQuoteStorageKey) || ''
  } catch {
    lastQuote = ''
  }

  const nextQuoteOptions =
    availableQuotes.length > 1 ? availableQuotes.filter((quoteText) => quoteText !== lastQuote) : availableQuotes
  const nextQuote = nextQuoteOptions[Math.floor(Math.random() * nextQuoteOptions.length)]

  try {
    sessionStorage.setItem(lastQuoteStorageKey, nextQuote)
  } catch {
    // Ignore storage errors so the quote still works in restricted browser modes.
  }

  return nextQuote
}

function getQuoteLetters() {
  return Array.from({ length: letterCount }, (_, index) => ({
    id: `letter-${index + 1}`,
    label: `Thư ${index + 1}`,
  }))
}

function HeartIcon({ size = 34 }) {
  return (
    <svg
      aria-hidden="true"
      className="heart-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 1.06 2.29l-7.16 4.18A3 3 0 0 0 6 9a3 3 0 1 0 2.9 3.75l7.2 4.2A3 3 0 1 0 18 16a2.96 2.96 0 0 0-1.43.37l-7.2-4.2A3.2 3.2 0 0 0 9.4 12c0-.16-.01-.31-.04-.46l7.17-4.18A2.96 2.96 0 0 0 18 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="16.9" cy="7.1" r="1.1" fill="currentColor" />
    </svg>
  )
}

function AmbientIcon({ type }) {
  if (type === 'rain') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" className="ambient-icon">
        <path
          d="M24 5C18 14 13 22 13 29.5 13 36.3 17.9 42 24 42s11-5.7 11-12.5C35 22 30 14 24 5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinejoin="round"
        />
        <path
          d="M20 31.5c1 2.5 2.7 3.8 5.2 3.8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.2"
        />
      </svg>
    )
  }

  if (type === 'waves') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" className="ambient-icon">
        <path
          d="M5 19c4.7 0 4.7-4 9.4-4s4.7 4 9.4 4 4.8-4 9.5-4 4.8 4 9.7 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.6"
        />
        <path
          d="M5 29c4.7 0 4.7-4 9.4-4s4.7 4 9.4 4 4.8-4 9.5-4 4.8 4 9.7 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="3.6"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="ambient-icon">
      <path
        d="M25.8 4.5c1.4 8.2-5 10.3-5 16 0 2.2 1.2 3.9 3.2 4.9-.6-5.2 4.2-8.3 4.6-13 6.1 4.5 9.4 10.2 9.4 16.4C38 37 31.9 43 24 43S10 37 10 29.3c0-5.9 3.4-11.4 8.6-15.4-.2 4.4 2.7 7 5.1 7.8-1.7-6.1.3-11.7 2.1-17.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3.4"
      />
    </svg>
  )
}

function AmbientVisualEffect({ activeSound }) {
  if (!activeSound) return null

  return (
    <div className={`ambient-visual ambient-visual-${activeSound}`} aria-hidden="true">
      {activeSound === 'rain' && (
        <div className="rain-field">
          {Array.from({ length: rainDropCount }, (_, index) => (
            <span
              className="rain-drop"
              key={`rain-${index}`}
              style={{
                '--drop-left': `${(index * 37) % 101}%`,
                '--drop-delay': `${-((index * 0.19) % 2.6)}s`,
                '--drop-duration': `${0.82 + (index % 7) * 0.08}s`,
                '--drop-length': `${48 + (index % 5) * 12}px`,
                '--drop-opacity': `${0.24 + (index % 6) * 0.06}`,
              }}
            />
          ))}
        </div>
      )}

      {activeSound === 'waves' && (
        <div className="wave-field">
          {Array.from({ length: waveRippleCount }, (_, index) => (
            <span
              className="wave-ripple"
              key={`wave-${index}`}
              style={{
                '--ripple-left': `${6 + ((index * 17) % 88)}%`,
                '--ripple-bottom': `${18 + (index % 5) * 19}px`,
                '--ripple-delay': `${-((index * 0.42) % 4.8)}s`,
                '--ripple-duration': `${3.6 + (index % 4) * 0.55}s`,
                '--ripple-width': `${96 + (index % 6) * 28}px`,
              }}
            />
          ))}
        </div>
      )}

      {activeSound === 'fire' && (
        <div className="fire-field">
          <span className="fire-glow" />
          {Array.from({ length: fireSparkCount }, (_, index) => (
            <span
              className="fire-spark"
              key={`fire-${index}`}
              style={{
                '--spark-left': `${8 + ((index * 11) % 84)}%`,
                '--spark-delay': `${-((index * 0.23) % 2.8)}s`,
                '--spark-duration': `${1.2 + (index % 7) * 0.16}s`,
                '--spark-size': `${4 + (index % 5) * 2}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 9h10v10H9V9ZM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DayNightSwitch({ isNightMode, labels, onToggle }) {
  return (
    <button
      className={`day-night-switch ${isNightMode ? 'is-night' : ''}`}
      type="button"
      aria-label={isNightMode ? labels.toDay : labels.toNight}
      aria-pressed={isNightMode}
      onClick={onToggle}
    >
      <span className="switch-scene" aria-hidden="true">
        <span className="switch-sky">
          <span className="switch-cloud switch-cloud-one" />
          <span className="switch-cloud switch-cloud-two" />
          <span className="switch-cloud switch-cloud-three" />
          <span className="switch-star switch-star-one" />
          <span className="switch-star switch-star-two" />
          <span className="switch-star switch-star-three" />
          <span className="switch-star switch-star-four" />
          <span className="switch-star switch-star-five" />
        </span>
        <span className="switch-orb">
          <span className="switch-hand switch-hand-long" />
          <span className="switch-hand switch-hand-short" />
          <span className="switch-pin" />
        </span>
        <span className="switch-person">
          <span className="person-shadow" />
          <span className="person-leg person-leg-back" />
          <span className="person-leg person-leg-front" />
          <span className="person-dress" />
          <span className="person-arm person-arm-back" />
          <span className="person-arm person-arm-front" />
          <span className="person-neck" />
          <span className="person-head" />
          <span className="person-hair" />
          <span className="person-sign">{isNightMode ? 'OFF' : 'ON'}</span>
        </span>
      </span>
    </button>
  )
}

function App() {
  const [quoteLetters] = useState(getQuoteLetters)
  const [randomQuote] = useState(getRandomQuote)
  const [quote, setQuote] = useState('')
  const [openedLetterId, setOpenedLetterId] = useState(null)
  const [savedQuotes, setSavedQuotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('savedQuotes') || '[]')
    } catch {
      return []
    }
  })
  const [toastMessage, setToastMessage] = useState('')
  const [timerMode, setTimerMode] = useState('pomodoro')
  const [secondsLeft, setSecondsLeft] = useState(timerModes.pomodoro.minutes * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [focusRound, setFocusRound] = useState(1)
  const [activeAmbientSound, setActiveAmbientSound] = useState(null)
  const [decisionMessage, setDecisionMessage] = useState('')
  const [decisionMotion, setDecisionMotion] = useState('idle')
  const [decisionAnimationKey, setDecisionAnimationKey] = useState(0)
  const [activeBookId, setActiveBookId] = useState(selfHelpBooks[0].id)
  const [bookAnimationKey, setBookAnimationKey] = useState(0)
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false)
  const [colorModePreference, setColorModePreference] = useState(getSavedColorModeOverride)
  const [isNightMode, setIsNightMode] = useState(() => getNightModeFromPreference(getSavedColorModeOverride()))
  const [language, setLanguage] = useState(() => {
    try {
      const savedLanguage = localStorage.getItem(languageStorageKey)
      return translations[savedLanguage] ? savedLanguage : 'vi'
    } catch {
      return 'vi'
    }
  })
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [activeShareFrameId, setActiveShareFrameId] = useState(shareFrames[0].id)
  const [shareTextColor, setShareTextColor] = useState(shareFrames[0].text)
  const [customShareFrames, setCustomShareFrames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(customShareFramesStorageKey) || '[]')
    } catch {
      return []
    }
  })
  const toastTimeoutRef = useRef(null)
  const decisionTimeoutRef = useRef(null)
  const customFrameInputRef = useRef(null)
  const languageSwitcherRef = useRef(null)
  const audioContextRef = useRef(null)
  const ambientAudioRef = useRef(null)
  const isQuoteSaved = savedQuotes.includes(quote)
  const activeTimerMode = timerModes[timerMode]
  const openedLetter = quoteLetters.find((letter) => letter.id === openedLetterId)
  const activeBook = selfHelpBooks.find((book) => book.id === activeBookId) || selfHelpBooks[0]
  const allShareFrames = [...shareFrames, ...customShareFrames]
  const activeShareFrame = allShareFrames.find((frame) => frame.id === activeShareFrameId) || shareFrames[0]
  const shareQuoteFontSize = getShareQuoteFontSize(quote)
  const copy = translations[language] || translations.vi
  const activeTimerMessage = copy.timer.messages[timerMode]
  const activeBookCopy = language === 'vi' ? {} : bookTranslations[language]?.[activeBook.id] || bookTranslations.en[activeBook.id] || {}
  const localizedActiveBook = { ...activeBook, ...activeBookCopy }

  useLayoutEffect(() => {
    const canControlScrollRestoration = 'scrollRestoration' in window.history
    const previousScrollRestoration = canControlScrollRestoration ? window.history.scrollRestoration : null

    if (canControlScrollRestoration) {
      window.history.scrollRestoration = 'manual'
    }

    if (window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }

    window.scrollTo(0, 0)

    return () => {
      if (canControlScrollRestoration) {
        window.history.scrollRestoration = previousScrollRestoration
      }
    }
  }, [])

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return null
      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }

    return audioContextRef.current
  }, [])

  const playTone = useCallback(
    ({ frequency = 520, duration = 0.08, gain = 0.08, type = 'sine', delay = 0 }) => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      const startTime = audioContext.currentTime + delay
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, startTime)
      gainNode.gain.setValueAtTime(0.0001, startTime)
      gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.02)
    },
    [getAudioContext],
  )

  const playButtonClick = useCallback(() => {
    playTone({ frequency: 740, duration: 0.045, gain: 0.045, type: 'triangle' })
  }, [playTone])

  const playTimerTick = useCallback(() => {
    playTone({ frequency: 880, duration: 0.035, gain: 0.035, type: 'square' })
  }, [playTone])

  const playTimerDone = useCallback(() => {
    playTone({ frequency: 660, duration: 0.11, gain: 0.06, type: 'sine' })
    playTone({ frequency: 880, duration: 0.13, gain: 0.06, type: 'sine', delay: 0.12 })
    playTone({ frequency: 1108, duration: 0.18, gain: 0.065, type: 'sine', delay: 0.26 })
  }, [playTone])

  const stopAmbientSound = useCallback(() => {
    if (!ambientAudioRef.current) return

    ambientAudioRef.current.pause()
    ambientAudioRef.current.currentTime = 0
    ambientAudioRef.current.src = ''
    ambientAudioRef.current = null
  }, [])

  const handleInterfaceClick = useCallback(
    (event) => {
      const clickedButton = event.target.closest('button')
      if (!clickedButton || clickedButton.disabled) return
      playButtonClick()
    },
    [playButtonClick],
  )

  useEffect(() => {
    if (!isTimerRunning) return undefined

    const timerId = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          playTimerDone()
          window.clearInterval(timerId)
          setIsTimerRunning(false)

          if (timerMode === 'pomodoro') {
            setFocusRound((currentRound) => currentRound + 1)
            setTimerMode('short')
            return timerModes.short.minutes * 60
          }

          return 0
        }

        playTimerTick()
        return currentSeconds - 1
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [isTimerRunning, timerMode, playTimerDone, playTimerTick])

  useEffect(() => {
    stopAmbientSound()
    if (!activeAmbientSound) return undefined

    const selectedSound = ambientSoundOptions.find((sound) => sound.id === activeAmbientSound)
    if (!selectedSound) return undefined

    const audio = new Audio(selectedSound.src)
    audio.loop = true
    audio.volume = 0.62
    ambientAudioRef.current = audio

    audio.play().catch(() => {
      stopAmbientSound()
    })

    return stopAmbientSound
  }, [activeAmbientSound, stopAmbientSound])

  useEffect(() => {
    const animatedElements = document.querySelectorAll('.scroll-pop')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )

    animatedElements.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isShareSheetOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isShareSheetOpen])

  useEffect(() => {
    if (!isLanguageMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (languageSwitcherRef.current?.contains(event.target)) return
      setIsLanguageMenuOpen(false)
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsLanguageMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLanguageMenuOpen])

  useEffect(() => {
    const updateAutomaticColorMode = () => {
      setIsNightMode(getNightModeFromPreference(colorModePreference))
    }

    const colorSchemeQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    updateAutomaticColorMode()

    if (colorSchemeQuery?.addEventListener) {
      colorSchemeQuery.addEventListener('change', updateAutomaticColorMode)
    } else if (colorSchemeQuery?.addListener) {
      colorSchemeQuery.addListener(updateAutomaticColorMode)
    }

    const colorModeTimer = window.setInterval(updateAutomaticColorMode, 60 * 1000)

    return () => {
      window.clearInterval(colorModeTimer)

      if (colorSchemeQuery?.removeEventListener) {
        colorSchemeQuery.removeEventListener('change', updateAutomaticColorMode)
      } else if (colorSchemeQuery?.removeListener) {
        colorSchemeQuery.removeListener(updateAutomaticColorMode)
      }
    }
  }, [colorModePreference])

  useEffect(
    () => () => {
      window.clearTimeout(decisionTimeoutRef.current)
    },
    [],
  )

  const handleOpenLetter = (letter) => {
    setOpenedLetterId(letter.id)
    setQuote(randomQuote)
  }

  const showToast = (message) => {
    setToastMessage(message)
    window.clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('')
    }, 2200)
  }

  const handleToggleSaveQuote = () => {
    if (!quote) return

    const nextSavedQuotes = isQuoteSaved
      ? savedQuotes.filter((savedQuote) => savedQuote !== quote)
      : [...savedQuotes, quote]

    setSavedQuotes(nextSavedQuotes)
    localStorage.setItem('savedQuotes', JSON.stringify(nextSavedQuotes))
    showToast(isQuoteSaved ? copy.toasts.unsaved : copy.toasts.saved)
  }

  const handleShareQuote = () => {
    if (!quote) return
    setIsShareSheetOpen(true)
  }

  const handleSelectShareFrame = (frame) => {
    setActiveShareFrameId(frame.id)
    setShareTextColor(frame.text)
  }

  const createShareImageBlob = async () => {
    if (document.fonts?.load) {
      await document.fonts.load('800 50px Sora')
    }

    const canvas = document.createElement('canvas')
    const scale = 1
    const width = 1080
    const height = 1920
    canvas.width = width * scale
    canvas.height = height * scale

    const context = canvas.getContext('2d')
    context.scale(scale, scale)

    context.fillStyle = activeShareFrame.background
    drawRoundRect(context, 0, 0, width, height, 54)
    context.fill()

    if (activeShareFrame.imageUrl) {
      const frameImage = await loadCanvasImage(activeShareFrame.imageUrl)
      context.fillStyle = activeShareFrame.background
      context.fillRect(0, 0, width, height)
      drawCoverImage(context, frameImage, width, height)
    }

    context.fillStyle = shareTextColor
    context.textAlign = 'center'
    const quoteMaxWidth = activeShareFrame.imageUrl ? 780 : 720
    const quoteMaxHeight = activeShareFrame.imageUrl ? 620 : 720
    const { lines: quoteLines, lineHeight } = fitCanvasQuote(context, quote, quoteMaxWidth, quoteMaxHeight, 50)
    const quoteStartY = 960 - ((quoteLines.length - 1) * lineHeight) / 2
    quoteLines.forEach((line, index) => {
      context.fillText(line, width / 2, quoteStartY + index * lineHeight)
    })

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('Canvas export failed'))
      }, 'image/png')
    })
  }

  const handleNativeShareQuote = async () => {
    if (!quote) return

    const shareData = {
      title: '138.loveyourself',
      text: quote,
      url: window.location.href.split('#')[0],
    }

    try {
      const imageBlob = await createShareImageBlob()
      const imageFile = new File([imageBlob], '138-love-yourself-quote.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [imageFile] })) {
        await navigator.share({
          ...shareData,
          files: [imageFile],
        })
        setIsShareSheetOpen(false)
        showToast(copy.toasts.sharedFrame)
        return
      }

      if (navigator.share) {
        await navigator.share(shareData)
        setIsShareSheetOpen(false)
        showToast(copy.toasts.sharedQuote)
        return
      }

      await navigator.clipboard.writeText(`${quote}\n\n${shareData.url}`)
      showToast(copy.toasts.copied)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast(copy.toasts.shareFailed)
      }
    }
  }

  const handleCopyShareQuote = async () => {
    if (!quote) return

    try {
      await navigator.clipboard.writeText(`${quote}\n\n${window.location.href.split('#')[0]}`)
      showToast(copy.toasts.copied)
    } catch {
      showToast(copy.toasts.copyFailed)
    }
  }

  const handleDownloadShareImage = async () => {
    if (!quote) return

    try {
      const imageBlob = await createShareImageBlob()
      const imageUrl = URL.createObjectURL(imageBlob)
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = '138-love-yourself-quote.png'
      link.click()
      URL.revokeObjectURL(imageUrl)
      showToast(copy.toasts.imageCreated)
    } catch {
      showToast(copy.toasts.imageFailed)
    }
  }

  const handleShareInstagramStory = async () => {
    if (!quote) return

    try {
      const imageBlob = await createShareImageBlob()
      const imageFile = new File([imageBlob], '138-love-yourself-story.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [imageFile] })) {
        await navigator.share({
          files: [imageFile],
          title: '138.loveyourself',
        })
        showToast(copy.toasts.chooseInstagram)
        return
      }

      const imageUrl = URL.createObjectURL(imageBlob)
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = '138-love-yourself-story.png'
      link.click()
      URL.revokeObjectURL(imageUrl)
      showToast(copy.toasts.downloadedFallback)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast(copy.toasts.instagramFailed)
      }
    }
  }

  const handleAddCustomFrame = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast(copy.toasts.chooseImageFile)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const nextFrame = {
        id: `custom-${Date.now()}`,
        label: file.name.replace(/\.[^.]+$/, '') || 'Custom',
        background: '#fffadc',
        card: '#8fc3d4',
        accent: '#fffef0',
        text: '#6f9ed8',
        imageUrl: reader.result,
      }
      const nextFrames = [...customShareFrames, nextFrame]

      setCustomShareFrames(nextFrames)
      setActiveShareFrameId(nextFrame.id)
      setShareTextColor(nextFrame.text)

      try {
        localStorage.setItem(customShareFramesStorageKey, JSON.stringify(nextFrames))
      } catch {
        showToast(copy.toasts.frameTooLarge)
        return
      }

      showToast(copy.toasts.frameAdded)
    }
    reader.onerror = () => showToast(copy.toasts.imageReadFailed)
    reader.readAsDataURL(file)
  }

  const handleTimerModeChange = (mode) => {
    setTimerMode(mode)
    setIsTimerRunning(false)
    setSecondsLeft(timerModes[mode].minutes * 60)
  }

  const handleResetTimer = () => {
    setIsTimerRunning(false)
    setSecondsLeft(activeTimerMode.minutes * 60)
  }

  const handleTimerStartToggle = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false)
      return
    }

    if (secondsLeft === 0 && timerMode !== 'pomodoro') {
      setTimerMode('pomodoro')
      setSecondsLeft(timerModes.pomodoro.minutes * 60)
    }

    setIsTimerRunning(true)
  }

  const handleAmbientSoundToggle = (soundId) => {
    setActiveAmbientSound((currentSound) => (currentSound === soundId ? null : soundId))
  }

  const handleToggleColorMode = () => {
    setIsNightMode((currentMode) => {
      const nextMode = currentMode ? 'day' : 'night'

      setColorModePreference(nextMode)

      try {
        localStorage.setItem(colorModeOverrideStorageKey, nextMode)
      } catch {
        // The switch still works for the current session if storage is unavailable.
      }

      return nextMode === 'night'
    })
  }

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage)
    setIsLanguageMenuOpen(false)

    if (decisionMotion !== 'idle') {
      setDecisionMessage(getNextDecisionMessageForLanguage(nextLanguage, decisionMessage))
      setDecisionAnimationKey((currentKey) => currentKey + 1)
    }

    try {
      localStorage.setItem(languageStorageKey, nextLanguage)
    } catch {
      // The selector still works if storage is unavailable.
    }
  }

  const revealDecisionMessage = (currentMessage = '') => {
    setDecisionMessage(getNextDecisionMessageForLanguage(language, currentMessage))
    setDecisionAnimationKey((currentKey) => currentKey + 1)
    setDecisionMotion('revealed')
  }

  const handleAskDecision = () => {
    window.clearTimeout(decisionTimeoutRef.current)
    revealDecisionMessage(decisionMessage)
  }

  const handleChooseAgain = () => {
    setDecisionMotion('hiding')
    window.clearTimeout(decisionTimeoutRef.current)
    decisionTimeoutRef.current = window.setTimeout(() => {
      revealDecisionMessage(decisionMessage)
    }, 360)
  }

  const handleSelectBook = (bookId) => {
    setActiveBookId(bookId)
    setBookAnimationKey((currentKey) => currentKey + 1)
  }

  return (
    <main
      className={`landing-page ${isNightMode ? 'is-night-mode' : 'is-day-mode'} timer-theme-${timerMode} ${
        activeAmbientSound ? `has-ambient-${activeAmbientSound}` : ''
      }`}
      onClickCapture={handleInterfaceClick}
    >
      <AmbientVisualEffect activeSound={activeAmbientSound} />

      <header className="site-header">
        <a className="brand" href="/" aria-label="138.LoveYourself">
          <HeartIcon />
          <span>138.LoveYourself</span>
        </a>
        <div className="header-actions">
          <div className={`language-switcher ${isLanguageMenuOpen ? 'is-open' : ''}`} ref={languageSwitcherRef}>
            <button
              className="language-trigger"
              type="button"
              aria-label={copy.language.toggle}
              aria-expanded={isLanguageMenuOpen}
              aria-haspopup="listbox"
              onClick={() => setIsLanguageMenuOpen((current) => !current)}
            >
              <span>{copy.language.trigger}</span>
              <span className="language-trigger-chevron" aria-hidden="true">⌄</span>
            </button>
            <div className="language-menu" role="listbox" aria-label={copy.language.label}>
              {languageOptions.map((option) => (
                <button
                  className={language === option.id ? 'is-active' : ''}
                  type="button"
                  key={option.id}
                  role="option"
                  aria-selected={language === option.id}
                  onClick={() => handleLanguageChange(option.id)}
                >
                  <span>{option.label}</span>
                  <small>{option.name}</small>
                </button>
              ))}
            </div>
          </div>
          <DayNightSwitch isNightMode={isNightMode} labels={copy.theme} onToggle={handleToggleColorMode} />
        </div>
      </header>

      <section className="hero-section" id="home">
        <video
          className="hero-video scroll-pop"
          src={heroVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-label="138 LoveYourself opening video"
        />
        <div className="hero-intro scroll-pop">
          <p>{copy.hero.eyebrow}</p>
          <h1>{copy.hero.title}</h1>
          <span>{copy.hero.body}</span>
          <div className="hero-flow" aria-label={copy.hero.flowLabel}>
            <a href="#quote">1. {copy.hero.flow[0]}</a>
            <a href="#decision">2. {copy.hero.flow[1]}</a>
            <a href="#ambient">3. {copy.hero.flow[2]}</a>
            <a href="#library">4. {copy.hero.flow[3]}</a>
            <a href="#collection">5. {copy.hero.flow[4]}</a>
            <a href="#focus">6. {copy.hero.flow[5]}</a>
            <a href="#about">7. {copy.hero.flow[6]}</a>
          </div>
        </div>
      </section>

      <section className="quote-section" id="quote">
        <div className={`quote-envelope-content ${openedLetter ? 'is-open' : ''}`}>
          <div className="quote-section-heading">
            <p>{copy.quote.eyebrow}</p>
            <h2>{copy.quote.title}</h2>
          </div>

          <div className={`letter-grid ${openedLetter ? 'has-open-letter' : ''}`} aria-label={copy.quote.gridLabel}>
            {(openedLetter ? [openedLetter] : quoteLetters).map((letter) => (
              <button
                className={`letter-card ${openedLetterId === letter.id ? 'is-open' : ''}`}
                type="button"
                key={letter.id}
                onClick={() => handleOpenLetter(letter)}
                aria-pressed={openedLetterId === letter.id}
              >
                <span className="letter-paper">
                  <span className="letter-label">{copy.quote.letterLabel(Number(letter.id.split('-').pop()))}</span>
                  <span className="letter-quote">{quote}</span>
                </span>
                <span className="envelope-back" />
                <span className="envelope-flap" />
                <span className="envelope-left" />
                <span className="envelope-right" />
                <span className="envelope-front" />
              </button>
            ))}
          </div>
        </div>

        {quote && (
          <div className="quote-actions scroll-pop is-visible" aria-label={copy.quote.actionsLabel}>
            <button
              className={`quote-action-button ${isQuoteSaved ? 'is-active' : ''}`}
              type="button"
              aria-label={isQuoteSaved ? copy.quote.savedLabel : copy.quote.saveLabel}
              aria-pressed={isQuoteSaved}
              onClick={handleToggleSaveQuote}
            >
              <HeartIcon size={26} />
              <span>{isQuoteSaved ? copy.quote.saved : copy.quote.save}</span>
            </button>
            <button className="quote-action-button" type="button" aria-label={copy.quote.shareLabel} onClick={handleShareQuote}>
              <ShareIcon />
              <span>{copy.quote.share}</span>
            </button>
          </div>
        )}
      </section>

      <section className="decision-section" id="decision">
        <div className="decision-shell scroll-pop">
          <p>{copy.decision.eyebrow}</p>
          <h2>{copy.decision.title}</h2>
          <div className={`decision-stage ${decisionMotion !== 'idle' ? 'has-card' : ''}`}>
            <div
              className={`decision-card is-${decisionMotion}`}
              key={decisionAnimationKey}
              aria-live="polite"
              aria-hidden={decisionMotion === 'idle'}
            >
              <span>{decisionMessage || copy.decision.idle}</span>
            </div>
          </div>
          <button
            className={`decision-button ${decisionMotion === 'revealed' ? 'is-secondary' : ''}`}
            type="button"
            onClick={decisionMotion === 'revealed' ? handleChooseAgain : handleAskDecision}
          >
            {decisionMotion === 'revealed' ? copy.decision.again : copy.decision.ask}
          </button>
        </div>
      </section>

      <section className="ambient-section" id="ambient" aria-label={copy.ambient.label}>
        <div className="ambient-shell scroll-pop">
          <div className="ambient-heading">
            <p>{copy.ambient.eyebrow}</p>
            <h2>{copy.ambient.title}</h2>
          </div>

          <div className="ambient-controls">
            {ambientSoundOptions.map((sound) => (
              <button
                className={`ambient-button ${activeAmbientSound === sound.id ? 'is-active' : ''}`}
                type="button"
                key={sound.id}
                aria-pressed={activeAmbientSound === sound.id}
                onClick={() => handleAmbientSoundToggle(sound.id)}
              >
                <AmbientIcon type={sound.id} />
                <span>{copy.ambient.sounds[sound.id]}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="book-library-section" id="library">
        <div className="book-library-shell scroll-pop">
          <div className="book-library-heading">
            <p>{copy.library.eyebrow}</p>
            <h2>{copy.library.title}</h2>
          </div>

          <div className="featured-book" aria-live="polite">
            <div className={`featured-book-cover ${localizedActiveBook.coverClass}`} key={`${localizedActiveBook.id}-${bookAnimationKey}`}>
              <span>{localizedActiveBook.tag}</span>
              <strong>{localizedActiveBook.title}</strong>
              <em>{localizedActiveBook.author}</em>
            </div>

            <div className="featured-book-copy">
              <h3>{localizedActiveBook.title}</h3>
              <span>{localizedActiveBook.author}</span>
              <p>{localizedActiveBook.note}</p>
              <p>{localizedActiveBook.takeaway}</p>
              {localizedActiveBook.pdfUrl ? (
                <a className="book-pdf-link" href={localizedActiveBook.pdfUrl} target="_blank" rel="noreferrer">
                  {copy.library.read}
                </a>
              ) : (
                <button className="book-pdf-link is-disabled" type="button" disabled>
                  {copy.library.read}
                </button>
              )}
            </div>
          </div>

          <div className="book-shelf" aria-label={copy.library.shelfLabel}>
            {selfHelpBooks.map((book) => {
              const bookCopy = language === 'vi' ? {} : bookTranslations[language]?.[book.id] || bookTranslations.en[book.id] || {}
              const localizedBook = { ...book, ...bookCopy }

              return (
                <button
                  className={`book-spine ${localizedBook.coverClass} ${activeBookId === localizedBook.id ? 'is-active' : ''}`}
                  type="button"
                  key={localizedBook.id}
                  onClick={() => handleSelectBook(localizedBook.id)}
                  aria-label={copy.library.chooseBook(localizedBook.title)}
                  aria-pressed={activeBookId === localizedBook.id}
                >
                  <strong>{localizedBook.title}</strong>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="playlist-section" id="collection">
        <div className="spotify-caption scroll-pop">
          <p>{copy.playlist.eyebrow}</p>
          <h2>{copy.playlist.title}</h2>
        </div>

        <iframe
          className="spotify-player scroll-pop"
          title={copy.playlist.playerTitle}
          src="https://open.spotify.com/embed/playlist/1yd3LjXq6a5EXVA11w7UPH?utm_source=generator&theme=0"
          width="100%"
          height="560"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </section>

      <section className="pomodoro-section" id="focus">
        <div className="pomodoro-shell scroll-pop">
          <div className="pomodoro-heading">
            <p>{copy.timer.eyebrow}</p>
            <h2>{copy.timer.title}</h2>
          </div>

          <div className="pomodoro-card">
            <div className="timer-tabs" aria-label={copy.timer.tabsLabel}>
              {timerModeKeys.map((mode) => (
                <button
                  className={timerMode === mode ? 'is-active' : ''}
                  type="button"
                  key={mode}
                  onClick={() => handleTimerModeChange(mode)}
                >
                  {copy.timer.labels[mode]}
                </button>
              ))}
            </div>

            <div className="timer-display" aria-live="polite">
              {formatTime(secondsLeft)}
            </div>

            <div className="timer-actions">
              <button className="timer-start" type="button" onClick={handleTimerStartToggle}>
                {isTimerRunning ? copy.timer.pause : copy.timer.start}
              </button>
              <button className="timer-reset" type="button" onClick={handleResetTimer}>
                {copy.timer.reset}
              </button>
            </div>
          </div>

          <div className="focus-status">
            <span>{copy.timer.round(focusRound)}</span>
            <p>{activeTimerMessage}</p>
          </div>
        </div>
      </section>

      <section className="ending-section" id="about">
        <div className="ending-content scroll-pop">
          <HeartIcon size={190} />
          <h2>{copy.ending.title}</h2>
          <p>{copy.ending.body}</p>
          <a className="ending-link" href="https://138knitwear.com/" target="_blank" rel="noreferrer">
            {copy.ending.cta}
          </a>
          <span>♡ 138.LoveYourself</span>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-column footer-company scroll-pop">
            <h2>138knitwear</h2>
            <p>{copy.footer.business}</p>
            <p>{copy.footer.address}</p>
            <a href="tel:0867789138">0867789138</a>
            <a href="mailto:with138knitwear@gmail.com">with138knitwear@gmail.com</a>
            <p>{copy.footer.store}</p>
            <img className="commerce-badge" src="/image.png" alt={copy.footer.badgeAlt} />
          </div>

          <div className="footer-column footer-contact scroll-pop">
            <h3>{copy.footer.contact}</h3>
            <form className="footer-email-form" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="footer-email">{copy.footer.emailLabel}</label>
              <div>
                <input id="footer-email" type="email" aria-label={copy.footer.emailAria} />
                <button type="submit" aria-label={copy.footer.submitAria}>
                  <ShareIcon />
                </button>
              </div>
            </form>
            <div className="footer-socials" aria-label={copy.footer.socialsLabel}>
              <a className="social-zalo" href="https://zalo.me/0867789138" target="_blank" rel="noreferrer">
                Zalo
              </a>
              <a className="social-tiktok" href="https://www.tiktok.com/" target="_blank" rel="noreferrer">
                TikTok
              </a>
              <a className="social-instagram" href="https://www.instagram.com/" target="_blank" rel="noreferrer">
                IG
              </a>
              <a className="social-facebook" href="https://www.facebook.com/" target="_blank" rel="noreferrer">
                f
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">♡ 138.LoveYourself</div>
      </footer>

      <div className={`share-sheet-backdrop ${isShareSheetOpen ? 'is-open' : ''}`} aria-hidden={!isShareSheetOpen}>
        <button
          className="share-sheet-dismiss"
          type="button"
          aria-label={copy.shareSheet.close}
          onClick={() => setIsShareSheetOpen(false)}
        />
        <section
          className="share-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={copy.shareSheet.dialog}
          style={{
            '--share-bg': activeShareFrame.background,
            '--share-card': activeShareFrame.card,
            '--share-accent': activeShareFrame.accent,
            '--share-text': shareTextColor,
          }}
        >
          <button
            className="share-sheet-close"
            type="button"
            aria-label={copy.shareSheet.close}
            onClick={() => setIsShareSheetOpen(false)}
          >
            <CloseIcon />
          </button>

          <div
            className={`share-preview-letter ${activeShareFrame.imageUrl ? 'has-custom-frame' : ''}`}
            style={
              activeShareFrame.imageUrl
                ? {
                    backgroundImage: `url(${activeShareFrame.imageUrl})`,
                  }
                : undefined
            }
          >
            <div className="share-letter-paper">
              <strong style={{ '--share-quote-size': shareQuoteFontSize }}>{quote}</strong>
            </div>
          </div>

          <div className="share-frame-picker" aria-label={copy.shareSheet.framePicker}>
            {allShareFrames.map((frame) => (
              <button
                className={activeShareFrameId === frame.id ? 'is-active' : ''}
                type="button"
                key={frame.id}
                aria-label={copy.shareSheet.chooseFrame(frame.label)}
                aria-pressed={activeShareFrameId === frame.id}
                onClick={() => handleSelectShareFrame(frame)}
                style={{
                  '--frame-bg': frame.background,
                  '--frame-card': frame.card,
                }}
              >
                {frame.imageUrl && <img src={frame.imageUrl} alt="" />}
              </button>
            ))}
            <button
              className="share-frame-add"
              type="button"
              aria-label={copy.shareSheet.addFrame}
              onClick={() => customFrameInputRef.current?.click()}
            >
              +
            </button>
            <input
              ref={customFrameInputRef}
              className="share-frame-input"
              type="file"
              accept="image/*"
              onChange={handleAddCustomFrame}
            />
          </div>

          <div className="share-text-color-control" aria-label={copy.shareSheet.textColorLabel}>
            <span>{copy.shareSheet.textColor}</span>
            <div className="share-text-color-options">
              {shareTextColors.map((color) => (
                <button
                  className={shareTextColor.toLowerCase() === color ? 'is-active' : ''}
                  type="button"
                  key={color}
                  aria-label={copy.shareSheet.chooseTextColor(color)}
                  aria-pressed={shareTextColor.toLowerCase() === color}
                  onClick={() => setShareTextColor(color)}
                  style={{ '--text-color-option': color }}
                />
              ))}
              <label className="share-text-color-custom">
                <input
                  type="color"
                  value={shareTextColor}
                  onChange={(event) => setShareTextColor(event.target.value)}
                  aria-label={copy.shareSheet.customTextColor}
                />
              </label>
            </div>
          </div>

          <div className="share-sheet-actions" aria-label={copy.shareSheet.actions}>
            <button type="button" onClick={handleCopyShareQuote}>
              <span>
                <CopyIcon />
              </span>
              <p>{copy.shareSheet.copy}</p>
            </button>
            <button type="button" onClick={handleNativeShareQuote}>
              <span>
                <ShareIcon />
              </span>
              <p>{copy.shareSheet.share}</p>
            </button>
            <button type="button" onClick={handleShareInstagramStory}>
              <span>
                <InstagramIcon />
              </span>
              <p>{copy.shareSheet.instagram}</p>
            </button>
            <button type="button" onClick={handleDownloadShareImage}>
              <span>
                <DownloadIcon />
              </span>
              <p>{copy.shareSheet.download}</p>
            </button>
          </div>
        </section>
      </div>

      <div className={`toast-message ${toastMessage ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </main>
  )
}

export default App
