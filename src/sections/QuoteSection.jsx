import { useEffect, useState } from 'react'
import { HeartIcon, ShareIcon } from '../components/icons'
import { assetUrl } from '../utils/assets'

const closedLetterImage = assetUrl('letter-closed.png')
const openLetterImage = assetUrl('letter-open.png')
const messageEnvelopeImages = [1, 2, 3, 4].map((number) => assetUrl(`thong-diep/thu${number}.svg`))

export function QuoteSection({
  copy,
  isQuoteSaved,
  onOpenLetter,
  onShareQuote,
  onToggleSaveQuote,
  openedLetter,
  openedLetterId,
  quote,
  quoteLetters,
}) {
  const [revealedLetterId, setRevealedLetterId] = useState(null)
  const [visualConfig, setVisualConfig] = useState(null)
  const [visualBreakpoint, setVisualBreakpoint] = useState(() => window.innerWidth <= 760 ? 'mobile' : window.innerWidth <= 1100 ? 'tablet' : 'desktop')
  const isQuoteRevealed = Boolean(openedLetterId && revealedLetterId === openedLetterId)
  const getLetterColorIndex = (letter) => Number(letter.id.split('-').pop()) || 1

  useEffect(() => {
    if (!openedLetterId) return undefined

    const revealTimeout = window.setTimeout(() => setRevealedLetterId(openedLetterId), 1600)
    return () => window.clearTimeout(revealTimeout)
  }, [openedLetterId])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/developer/visual/card-room/published', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.config) setVisualConfig(data.config) })
      .catch(() => {})
    const handleResize = () => setVisualBreakpoint(window.innerWidth <= 760 ? 'mobile' : window.innerWidth <= 1100 ? 'tablet' : 'desktop')
    const handleEditorConfig = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'visual-editor-config') return
      setVisualConfig(event.data.config)
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('message', handleEditorConfig)
    return () => { controller.abort(); window.removeEventListener('resize', handleResize); window.removeEventListener('message', handleEditorConfig) }
  }, [])

  const visual = visualConfig?.[visualBreakpoint] || {}
  const positionStyle = (element) => ({ translate: `${visual[element]?.x || 0}px ${visual[element]?.y || 0}px` })

  return (
    <section className="quote-section" id="quote">
      <div className={`quote-envelope-content ${openedLetter ? 'is-open' : ''}`}>
        <div className="quote-section-heading">
          <h2 data-visual-id="heading" style={!openedLetter ? positionStyle('heading') : undefined}>{openedLetter ? 'LỜI NHẮN CHO BẠN NÈ' : visualConfig?.content?.title || 'Phòng thông điệp'}</h2>
          <p data-visual-id="subtitle" style={positionStyle('subtitle')}>{visualConfig?.content?.subtitle || 'Bạn hãy nhắm mắt lại và lắng nghe con tim mình mách bảo nha.'}</p>
        </div>

        <div className={`letter-grid ${openedLetter ? 'has-open-letter' : ''}`} data-visual-id="letters" style={!openedLetter ? { ...positionStyle('letters'), scale: visual.letters?.scale || 1 } : undefined} aria-label={copy.quote.gridLabel}>
          {!openedLetter ? (
            <svg
              className="message-room-frame"
              viewBox="0 0 1040 325"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path className="message-room-frame-box message-room-frame-desktop" d="M900 224 H14 Q4 224 4 214 V24 Q4 14 14 14 H1026 Q1036 14 1036 24 V214 Q1036 224 1026 224 H980" />
              <path className="message-room-frame-tail message-room-frame-desktop" d="M900 224 C906 266 930 296 998 306 C964 278 958 248 980 224" />
              <path className="message-room-frame-box message-room-frame-tablet" d="M820 224 H14 Q4 224 4 214 V24 Q4 14 14 14 H1026 Q1036 14 1036 24 V214 Q1036 224 1026 224 H900" />
              <path className="message-room-frame-tail message-room-frame-tablet" d="M820 224 C824 264 842 294 886 306 C864 280 866 248 900 224" />
              <path className="message-room-frame-box message-room-frame-pro" d="M820 250 H14 Q4 250 4 240 V24 Q4 14 14 14 H1026 Q1036 14 1036 24 V240 Q1036 250 1026 250 H900" />
              <path className="message-room-frame-tail message-room-frame-pro" d="M820 250 C826 274 846 298 886 316 C866 292 868 268 900 250" />
              <path className="message-room-frame-box message-room-frame-mobile" d="M840 292 H18 Q4 292 4 278 V28 Q4 14 18 14 H1022 Q1036 14 1036 28 V278 Q1036 292 1022 292 H940" />
              <path className="message-room-frame-tail message-room-frame-mobile" d="M840 292 C852 310 874 320 900 322 C888 309 901 298 940 292" />
            </svg>
          ) : null}
          {(openedLetter ? [openedLetter] : quoteLetters).map((letter, index) => (
            <button
              className={`letter-card letter-color-${getLetterColorIndex(letter)} ${openedLetterId === letter.id ? 'is-open' : ''}`}
              type="button"
              key={letter.id}
              onClick={() => {
                if (!openedLetterId) onOpenLetter(letter)
              }}
              aria-pressed={openedLetterId === letter.id}
              aria-disabled={openedLetterId === letter.id}
            >
              <span className="letter-paper">
                <img className="letter-paper-art" src={assetUrl('thong-diep/lathu.svg')} alt="" aria-hidden="true" />
                <span className="letter-label">{copy.quote.letterLabel(Number(letter.id.split('-').pop()))}</span>
                <span className={`letter-quote ${!isQuoteRevealed ? 'is-waiting' : ''}`}>
                  {isQuoteRevealed ? (
                    <span className="letter-quote-content is-revealed" key={`quote-${openedLetterId}`}>{quote}</span>
                  ) : (
                    <span className="letter-quote-content is-waiting" key={`waiting-${openedLetterId}`}>
                      <span>chờ đợi</span><span>là</span><span>hạnh phúc</span>
                    </span>
                  )}
                </span>
              </span>
              <img className="letter-envelope-image letter-envelope-image-closed" src={openedLetter ? closedLetterImage : messageEnvelopeImages[index % messageEnvelopeImages.length]} alt="" aria-hidden="true" />
              <img className="letter-envelope-image letter-envelope-image-open" src={openLetterImage} alt="" aria-hidden="true" />
              {openedLetterId === letter.id ? <span className="letter-open-seal" aria-hidden="true">
                <img src={messageEnvelopeImages[getLetterColorIndex(letter) - 1]} alt="" />
              </span> : null}
            </button>
          ))}
        </div>

        <div className="message-room-decoration" data-visual-id="decoration" style={positionStyle('decoration')} aria-hidden="true">
          <img className="message-room-line" src={assetUrl('thong-diep/linexanh.svg')} alt="" />
          {!openedLetter ? <img className="message-room-mascot" data-visual-id="mascot" style={{ ...positionStyle('mascot'), ...(visual.mascot?.width ? { width: `${visual.mascot.width}px` } : {}) }} src={assetUrl('thong-diep/mastcot1.svg')} alt="" /> : null}
        </div>
      </div>

      {quote && (
        <div className="quote-actions scroll-pop is-visible" aria-label={copy.quote.actionsLabel}>
          <button
            className={`quote-action-button ${isQuoteSaved ? 'is-active' : ''}`}
            type="button"
            aria-label={isQuoteSaved ? copy.quote.savedLabel : copy.quote.saveLabel}
            aria-pressed={isQuoteSaved}
            disabled={!isQuoteRevealed}
            onClick={onToggleSaveQuote}
          >
            <HeartIcon size={26} />
            <span>{isQuoteSaved ? copy.quote.saved : copy.quote.save}</span>
          </button>
          <button className="quote-action-button" type="button" aria-label={copy.quote.shareLabel} disabled={!isQuoteRevealed} onClick={onShareQuote}>
            <ShareIcon />
            <span>{copy.quote.share}</span>
          </button>
        </div>
      )}
    </section>
  )
}
