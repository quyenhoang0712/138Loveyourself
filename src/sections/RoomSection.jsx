export const roomIntroOpenEventName = 'love-yourself-room-intro-open'

export function RoomSection({ children, id }) {
  return (
    <section className="room-section" id={id}>
      <div className="room-inner">
        <div className="room-content">{children}</div>
      </div>
    </section>
  )
}
