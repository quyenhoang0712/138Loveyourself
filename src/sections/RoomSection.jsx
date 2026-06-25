import { useCallback, useEffect, useState } from 'react'

export const roomIntroOpenEventName = 'love-yourself-room-intro-open'

function RoomTitle({ title }) {
  let characterIndex = 0
  const titleWords = title.replaceAll('hôm nay', 'hôm\u00A0nay').split(' ')

  return (
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
  )
}

export function RoomSection({ body, children, eyebrow, id, title }) {
  const [introState, setIntroState] = useState({ isOpen: true, roomId: id })
  const isIntroOpen = introState.roomId !== id || introState.isOpen
  const closeIntro = useCallback(() => setIntroState({ isOpen: false, roomId: id }), [id])
  const openIntro = useCallback(() => setIntroState({ isOpen: true, roomId: id }), [id])

  useEffect(() => {
    if (!isIntroOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeIntro()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeIntro, isIntroOpen])

  useEffect(() => {
    const handleIntroOpen = (event) => {
      if (event.detail?.roomId !== id) return
      openIntro()
    }

    window.addEventListener(roomIntroOpenEventName, handleIntroOpen)
    return () => window.removeEventListener(roomIntroOpenEventName, handleIntroOpen)
  }, [id, openIntro])

  return (
    <section className="room-section" id={id}>
      <div className="room-inner">
        {isIntroOpen ? (
          <div className="room-intro-backdrop" role="presentation" onMouseDown={closeIntro}>
            <section
              className="room-intro-dialog room-heading"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-intro-title`}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button className="room-intro-close" type="button" aria-label="Đóng giới thiệu phòng" onClick={closeIntro}>
                ×
              </button>
              <p>{eyebrow}</p>
              <div id={`${id}-intro-title`}>
                <RoomTitle title={title} />
              </div>
              {body ? <span>{body}</span> : null}
            </section>
          </div>
        ) : null}

        <div className="room-content">{children}</div>
      </div>
    </section>
  )
}
