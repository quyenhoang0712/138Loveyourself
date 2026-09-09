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
  const isQuoteRevealed = Boolean(openedLetterId && revealedLetterId === openedLetterId)
  const getLetterColorIndex = (letter) => Number(letter.id.split('-').pop()) || 1

  useEffect(() => {
    if (!openedLetterId) return undefined

    const revealTimeout = window.setTimeout(() => setRevealedLetterId(openedLetterId), 1600)
    return () => window.clearTimeout(revealTimeout)
  }, [openedLetterId])

  return (
    <section className="quote-section" id="quote">
      <div className={`quote-envelope-content ${openedLetter ? 'is-open' : ''}`}>
        <div className="quote-section-heading">
          <h2>{openedLetter ? 'LỜI NHẮN CHO BẠN NÈ' : 'Phòng thông điệp'}</h2>
          <p>Bạn hãy nhắm mắt lại và lắng nghe con tim mình mách bảo nha.</p>
        </div>

        <div className={`letter-grid ${openedLetter ? 'has-open-letter' : ''}`} aria-label={copy.quote.gridLabel}>
          {!openedLetter ? <img className="message-room-frame" src={assetUrl('thong-diep/hop.svg')} alt="" aria-hidden="true" /> : null}
          {(openedLetter ? [openedLetter] : quoteLetters).map((letter, index) => (
            <button
              className={`letter-card letter-color-${getLetterColorIndex(letter)} ${openedLetterId === letter.id ? 'is-open' : ''}`}
              type="button"
              key={letter.id}
              onClick={() => onOpenLetter(letter)}
              aria-pressed={openedLetterId === letter.id}
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

        <div className="message-room-decoration" aria-hidden="true">
          <img className="message-room-line" src={assetUrl('thong-diep/linexanh.svg')} alt="" />
          {!openedLetter ? <img className="message-room-mascot" src={assetUrl('thong-diep/mastcot1.svg')} alt="" /> : null}
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
