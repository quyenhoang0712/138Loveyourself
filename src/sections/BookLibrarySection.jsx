export function BookLibrarySection({
  activeBookId,
  bookAnimationKey,
  bookTranslations,
  copy,
  language,
  localizedActiveBook,
  onSelectBook,
  selfHelpBooks,
}) {
  return (
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
                onClick={() => onSelectBook(localizedBook.id)}
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
  )
}
