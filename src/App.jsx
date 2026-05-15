import { useEffect, useRef, useState } from 'react'
import { quotes } from './quotes'
import './App.css'

const heroVideoUrl = 'https://cdn.hstatic.net/files/200001082964/file/website.mp4'
const defaultQuote = quotes[0]

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
  const toastTimeoutRef = useRef(null)
  const isQuoteSaved = savedQuotes.includes(quote)

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

  return (
    <main className="landing-page">
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
