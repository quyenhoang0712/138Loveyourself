import { HeartIcon, ShareIcon } from '../components/icons'
import { assetUrl } from '../utils/assets'

const closedLetterImage = assetUrl('letter-closed.png')
const openLetterImage = assetUrl('letter-open.png')
const messageEnvelopeImages = [1, 2, 3, 4].map((number) => `/thong-diep/thu${number}.svg`)

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
  return (
    <section className="quote-section" id="quote">
      <div className={`quote-envelope-content ${openedLetter ? 'is-open' : ''}`}>
        <div className="quote-section-heading">
          <h2>Phòng thông điệp</h2>
          <p>Bạn hãy nhắm mắt lại và lắng nghe con tim mình mách bảo nha.</p>
        </div>

        <div className={`letter-grid ${openedLetter ? 'has-open-letter' : ''}`} aria-label={copy.quote.gridLabel}>
          {(openedLetter ? [openedLetter] : quoteLetters).map((letter, index) => (
            <button
              className={`letter-card ${openedLetterId === letter.id ? 'is-open' : ''}`}
              type="button"
              key={letter.id}
              onClick={() => onOpenLetter(letter)}
              aria-pressed={openedLetterId === letter.id}
            >
              <span className="letter-paper">
                <span className="letter-label">{copy.quote.letterLabel(Number(letter.id.split('-').pop()))}</span>
                <span className="letter-quote">{quote}</span>
              </span>
              <img className="letter-envelope-image letter-envelope-image-closed" src={openedLetter ? closedLetterImage : messageEnvelopeImages[index % messageEnvelopeImages.length]} alt="" aria-hidden="true" />
              <img className="letter-envelope-image letter-envelope-image-open" src={openLetterImage} alt="" aria-hidden="true" />
            </button>
          ))}
        </div>

        {!openedLetter ? <div className="message-room-decoration" aria-hidden="true">
          <img className="message-room-line" src="/thong-diep/line.svg" alt="" />
          <img className="message-room-mascot" src="/thong-diep/mastcot1.svg" alt="" />
        </div> : null}
      </div>

      {quote && (
        <div className="quote-actions scroll-pop is-visible" aria-label={copy.quote.actionsLabel}>
          <button
            className={`quote-action-button ${isQuoteSaved ? 'is-active' : ''}`}
            type="button"
            aria-label={isQuoteSaved ? copy.quote.savedLabel : copy.quote.saveLabel}
            aria-pressed={isQuoteSaved}
            onClick={onToggleSaveQuote}
          >
            <HeartIcon size={26} />
            <span>{isQuoteSaved ? copy.quote.saved : copy.quote.save}</span>
          </button>
          <button className="quote-action-button" type="button" aria-label={copy.quote.shareLabel} onClick={onShareQuote}>
            <ShareIcon />
            <span>{copy.quote.share}</span>
          </button>
        </div>
      )}
    </section>
  )
}
