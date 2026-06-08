import { HeartIcon, ShareIcon } from '../components/icons'

const closedLetterImage = '/thu%CC%9B_.svg'
const openLetterImage = '/thu%CC%9B%CC%89%20mo%CC%9B%CC%89.svg'

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
          <p>{copy.quote.eyebrow}</p>
          <h2>{copy.quote.title}</h2>
        </div>

        <div className={`letter-grid ${openedLetter ? 'has-open-letter' : ''}`} aria-label={copy.quote.gridLabel}>
          {(openedLetter ? [openedLetter] : quoteLetters).map((letter) => (
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
              <img className="letter-envelope-image letter-envelope-image-closed" src={closedLetterImage} alt="" aria-hidden="true" />
              <img className="letter-envelope-image letter-envelope-image-open" src={openLetterImage} alt="" aria-hidden="true" />
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
