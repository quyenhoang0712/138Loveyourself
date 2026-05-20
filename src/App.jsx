import { useEffect, useRef, useState } from 'react'
import { quotes } from './quotes'
import './App.css'

const heroVideoUrl = 'https://cdn.hstatic.net/files/200001082964/file/website.mp4'
const defaultQuote = quotes[0]
const timerModes = {
  pomodoro: {
    label: 'Pomodoro',
    minutes: 25,
    message: 'Time to focus!',
  },
  short: {
    label: 'Short Break',
    minutes: 5,
    message: 'Take a soft break.',
  },
  long: {
    label: 'Long Break',
    minutes: 15,
    message: 'Rest a little deeper.',
  },
}
const timerModeKeys = Object.keys(timerModes)

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getRandomQuote(currentQuote) {
  if (quotes.length < 2) {
    return quotes[0]
  }

  const availableQuotes = quotes.filter((item) => item !== currentQuote)
  return availableQuotes[Math.floor(Math.random() * availableQuotes.length)]
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

function PlayIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v13.72c0 .79.87 1.27 1.54.84l10.72-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
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

function PlusIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4a1.25 1.25 0 0 1 1.25 1.25v5.5h5.5a1.25 1.25 0 1 1 0 2.5h-5.5v5.5a1.25 1.25 0 1 1-2.5 0v-5.5h-5.5a1.25 1.25 0 1 1 0-2.5h5.5v-5.5A1.25 1.25 0 0 1 12 4Z" />
    </svg>
  )
}

function App() {
  const [quote, setQuote] = useState(defaultQuote)
  const [quoteMotion, setQuoteMotion] = useState('idle')
  const [isQuoteVisible, setIsQuoteVisible] = useState(false)
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
  const [taskInput, setTaskInput] = useState('')
  const [tasks, setTasks] = useState([])
  const toastTimeoutRef = useRef(null)
  const isQuoteSaved = savedQuotes.includes(quote)
  const activeTimerMode = timerModes[timerMode]

  useEffect(() => {
    if (!isTimerRunning) return undefined

    const timerId = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(timerId)
          setIsTimerRunning(false)

          if (timerMode === 'pomodoro') {
            setFocusRound((currentRound) => currentRound + 1)
          }

          return 0
        }

        return currentSeconds - 1
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [isTimerRunning, timerMode])

  useEffect(() => {
    const animatedElements = document.querySelectorAll('.scroll-pop')
    const quoteInput = document.querySelector('.quote-input')

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

    const quoteObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsQuoteVisible(true)
          quoteObserver.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    )

    if (quoteInput) {
      quoteObserver.observe(quoteInput)
    }

    return () => {
      observer.disconnect()
      quoteObserver.disconnect()
    }
  }, [])

  const handleNewQuote = () => {
    if (quoteMotion !== 'idle') return

    setQuoteMotion('leaving')

    window.setTimeout(() => {
      setQuote(getRandomQuote(quote))
      setQuoteMotion('entering')

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setQuoteMotion('idle')
        })
      })
    }, 1500)
  }

  const showToast = (message) => {
    setToastMessage(message)
    window.clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('')
    }, 2200)
  }

  const handleToggleSaveQuote = () => {
    const nextSavedQuotes = isQuoteSaved
      ? savedQuotes.filter((savedQuote) => savedQuote !== quote)
      : [...savedQuotes, quote]

    setSavedQuotes(nextSavedQuotes)
    localStorage.setItem('savedQuotes', JSON.stringify(nextSavedQuotes))
    showToast(isQuoteSaved ? 'Đã bỏ lưu câu này' : 'Đã lưu câu này')
  }

  const handleShareQuote = async () => {
    const shareData = {
      title: '138.loveyourself',
      text: quote,
      url: window.location.href.split('#')[0],
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        showToast('Đã mở chia sẻ')
        return
      }

      await navigator.clipboard.writeText(`${quote}\n\n${shareData.url}`)
      showToast('Đã sao chép quote')
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast('Chưa thể chia sẻ lúc này')
      }
    }
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

  const handleAddTask = (event) => {
    event.preventDefault()

    const trimmedTask = taskInput.trim()
    if (!trimmedTask) return

    setTasks((currentTasks) => [
      ...currentTasks,
      {
        id: crypto.randomUUID(),
        title: trimmedTask,
        done: false,
      },
    ])
    setTaskInput('')
  }

  const handleToggleTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    )
  }

  return (
    <main className={`landing-page timer-theme-${timerMode}`}>
      <header className="site-header">
        <a className="brand" href="/" aria-label="138.loveyourself">
          <HeartIcon />
          <span>138.loveyourself</span>
        </a>
      </header>

      <section className="hero-section" id="home">
        <video
          className="hero-video scroll-pop"
          src={heroVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-label="138 love yourself opening video"
        />
      </section>

      <section className="quote-section" id="quote">
        <label className="quote-label" htmlFor="quote-input">
          Nhập câu của bạn
        </label>
        <textarea
          id="quote-input"
          className={`quote-input quote-reveal ${isQuoteVisible ? 'is-visible' : ''} ${quoteMotion !== 'idle' ? `is-${quoteMotion}` : ''}`}
          value={quote}
          onChange={(event) => setQuote(event.target.value)}
          spellCheck="false"
          rows="3"
          aria-label="Nhập câu quote của bạn"
        />

        <div className="quote-actions scroll-pop" aria-label="Quote actions">
          <button className="primary-action" type="button" onClick={handleNewQuote}>
            <PlayIcon />
            <span>Câu Mới</span>
          </button>
          <button
            className={`circle-action ${isQuoteSaved ? 'is-active' : ''}`}
            type="button"
            aria-label={isQuoteSaved ? 'Bỏ lưu quote' : 'Lưu quote'}
            aria-pressed={isQuoteSaved}
            onClick={handleToggleSaveQuote}
          >
            <HeartIcon size={26} />
          </button>
          <button className="circle-action" type="button" aria-label="Chia sẻ quote" onClick={handleShareQuote}>
            <ShareIcon />
          </button>
        </div>
      </section>

      <section className="pomodoro-section" id="focus">
        <div className="pomodoro-shell scroll-pop">
          <div className="pomodoro-heading">
            <p>Focus room</p>
            <h2>Pomodoro cho một ngày dịu hơn.</h2>
          </div>

          <div className="pomodoro-card">
            <div className="timer-tabs" aria-label="Chọn chế độ timer">
              {timerModeKeys.map((mode) => (
                <button
                  className={timerMode === mode ? 'is-active' : ''}
                  type="button"
                  key={mode}
                  onClick={() => handleTimerModeChange(mode)}
                >
                  {timerModes[mode].label}
                </button>
              ))}
            </div>

            <div className="timer-display" aria-live="polite">
              {formatTime(secondsLeft)}
            </div>

            <div className="timer-actions">
              <button className="timer-start" type="button" onClick={() => setIsTimerRunning((current) => !current)}>
                {isTimerRunning ? 'PAUSE' : 'START'}
              </button>
              <button className="timer-reset" type="button" onClick={handleResetTimer}>
                Reset
              </button>
            </div>
          </div>

          <div className="focus-status">
            <span>#{focusRound}</span>
            <p>{activeTimerMode.message}</p>
          </div>

          <div className="tasks-panel">
            <div className="tasks-header">
              <h3>Tasks</h3>
              <span>{tasks.filter((task) => task.done).length}/{tasks.length}</span>
            </div>

            <form className="task-form" onSubmit={handleAddTask}>
              <label className="task-label" htmlFor="task-input">
                Thêm task
              </label>
              <input
                id="task-input"
                type="text"
                value={taskInput}
                onChange={(event) => setTaskInput(event.target.value)}
                placeholder="Việc cần làm..."
              />
              <button type="submit" aria-label="Thêm task">
                <PlusIcon />
              </button>
            </form>

            {tasks.length > 0 && (
              <ul className="task-list" aria-label="Danh sách task">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <label>
                      <input type="checkbox" checked={task.done} onChange={() => handleToggleTask(task.id)} />
                      <span>{task.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="playlist-section" id="collection">
        <div className="spotify-caption scroll-pop">
          <p>Playlist dành cho hôm nay</p>
          <h2>Chọn một bài nhạc và thở chậm lại một chút.</h2>
        </div>

        <iframe
          className="spotify-player scroll-pop"
          title="Spotify playlist player"
          src="https://open.spotify.com/embed/playlist/1yd3LjXq6a5EXVA11w7UPH?utm_source=generator&theme=0"
          width="100%"
          height="560"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </section>

      <section className="brand-story-section" id="about">
        <div className="brand-story-content scroll-pop">
          <HeartIcon size={190} />
          <h2>Love Yourself</h2>
          <p>
          138 love yourself - Thương hiệu thời trang mang thông điệp yêu bản thân.
          Mỗi sản phẩm được thiết kế với tình yêu, khuyến khích bạn tự tin và thoải
          mái làm chính mình. Vì bạn xứng đáng được yêu thương.
          </p>
          <a className="discover-link" href="https://138knitwear.com/" target="_blank" rel="noreferrer">
            Khám Phá Ngay
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-column footer-company scroll-pop">
          </div>

          <div className="footer-column scroll-pop">
          </div>

          <div className="footer-column scroll-pop">
          </div>

          <div className="footer-column footer-contact scroll-pop">
          </div>
        </div>

        <div className="footer-bottom"></div>
      </footer>

      <div className={`toast-message ${toastMessage ? 'is-visible' : ''}`} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </main>
  )
}

export default App
