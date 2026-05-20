import { useEffect, useRef, useState } from 'react'
import { selfHelpBooks } from './books'
import { quotes } from './quotes'
import './App.css'

const heroVideoUrl = 'https://cdn.hstatic.net/files/200001082964/file/website.mp4'
const letterCount = 4
const lastQuoteStorageKey = 'lastOpenedQuote'
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
  const [activeBookId, setActiveBookId] = useState(selfHelpBooks[0].id)
  const [bookAnimationKey, setBookAnimationKey] = useState(0)
  const toastTimeoutRef = useRef(null)
  const isQuoteSaved = savedQuotes.includes(quote)
  const activeTimerMode = timerModes[timerMode]
  const openedLetter = quoteLetters.find((letter) => letter.id === openedLetterId)
  const activeBook = selfHelpBooks.find((book) => book.id === activeBookId) || selfHelpBooks[0]

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
    showToast(isQuoteSaved ? 'Đã bỏ khỏi mục yêu thích' : 'Đã lưu lại cho bạn')
  }

  const handleShareQuote = async () => {
    if (!quote) return

    const shareData = {
      title: '138.loveyourself',
      text: quote,
      url: window.location.href.split('#')[0],
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        showToast('Bạn có thể chia sẻ câu này rồi')
        return
      }

      await navigator.clipboard.writeText(`${quote}\n\n${shareData.url}`)
      showToast('Đã sao chép câu quote')
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

  const handleSelectBook = (bookId) => {
    setActiveBookId(bookId)
    setBookAnimationKey((currentKey) => currentKey + 1)
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
        <div className={`quote-envelope-content ${openedLetter ? 'is-open' : ''}`}>
          <div className="quote-section-heading">
            <p>Open a letter</p>
            <h2>Chọn một phong thư cho hôm nay.</h2>
          </div>

          <div className={`letter-grid ${openedLetter ? 'has-open-letter' : ''}`} aria-label="Chọn phong thư quote">
            {(openedLetter ? [openedLetter] : quoteLetters).map((letter) => (
              <button
                className={`letter-card ${openedLetterId === letter.id ? 'is-open' : ''}`}
                type="button"
                key={letter.id}
                onClick={() => handleOpenLetter(letter)}
                aria-pressed={openedLetterId === letter.id}
              >
                <span className="letter-paper">
                  <span className="letter-label">{letter.label}</span>
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
          <div className="quote-actions scroll-pop is-visible" aria-label="Quote actions">
            <button
              className={`quote-action-button ${isQuoteSaved ? 'is-active' : ''}`}
              type="button"
              aria-label={isQuoteSaved ? 'Bỏ lưu quote' : 'Lưu quote'}
              aria-pressed={isQuoteSaved}
              onClick={handleToggleSaveQuote}
            >
              <HeartIcon size={26} />
              <span>{isQuoteSaved ? 'Đã lưu' : 'Lưu lại'}</span>
            </button>
            <button className="quote-action-button" type="button" aria-label="Chia sẻ quote" onClick={handleShareQuote}>
              <ShareIcon />
              <span>Chia sẻ</span>
            </button>
          </div>
        )}
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
        </div>
      </section>

      <section className="book-library-section" id="library">
        <div className="book-library-shell scroll-pop">
          <div className="book-library-heading">
            <p>Self-help library</p>
            <h2>Một kệ sách nhỏ để quay về với mình.</h2>
          </div>

          <div className="featured-book" aria-live="polite">
            <div className={`featured-book-cover ${activeBook.coverClass}`} key={`${activeBook.id}-${bookAnimationKey}`}>
              <span>{activeBook.tag}</span>
              <strong>{activeBook.title}</strong>
              <em>{activeBook.author}</em>
            </div>

            <div className="featured-book-copy">
              <p>{activeBook.tag}</p>
              <h3>{activeBook.title}</h3>
              <span>{activeBook.author}</span>
              <p>{activeBook.note}</p>
              <p>{activeBook.takeaway}</p>
              {activeBook.pdfUrl ? (
                <a className="book-pdf-link" href={activeBook.pdfUrl} target="_blank" rel="noreferrer">
                  Đọc sách
                </a>
              ) : (
                <button className="book-pdf-link is-disabled" type="button" disabled>
                  Đọc sách
                </button>
              )}
            </div>
          </div>

          <div className="book-shelf" aria-label="Chọn sách self-help">
            {selfHelpBooks.map((book) => (
              <button
                className={`book-spine ${book.coverClass} ${activeBookId === book.id ? 'is-active' : ''}`}
                type="button"
                key={book.id}
                onClick={() => handleSelectBook(book.id)}
                aria-pressed={activeBookId === book.id}
              >
                <strong>{book.title}</strong>
              </button>
            ))}
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
