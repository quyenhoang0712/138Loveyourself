export function RoomSection({ body, children, eyebrow, id, title }) {
  let characterIndex = 0
  const titleWords = title.replaceAll('hôm nay', 'hôm\u00A0nay').split(' ')

  return (
    <section className="room-section" id={id}>
      <div className="room-inner">
        <div className="room-heading scroll-pop">
          <p>{eyebrow}</p>
          <h2 aria-label={title}>
            {titleWords.map((word, wordIndex) => (
              <span className="room-title-word" key={`${word}-${wordIndex}`}>
                {Array.from(word).map((character) => {
                  const currentCharacterIndex = characterIndex
                  characterIndex += 1

                  return (
                    <span
                      aria-hidden="true"
                      className="room-title-character"
                      key={`${character}-${currentCharacterIndex}`}
                      style={{ '--title-character-index': currentCharacterIndex }}
                    >
                      {character}
                    </span>
                  )
                })}
              </span>
            ))}
          </h2>
          {body ? <span>{body}</span> : null}
        </div>
        <div className="room-content">{children}</div>
      </div>
    </section>
  )
}
