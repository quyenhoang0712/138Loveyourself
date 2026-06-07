export function RoomSection({ body, children, eyebrow, id, title }) {
  return (
    <section className="room-section" id={id}>
      <div className="room-inner">
        <div className="room-heading scroll-pop">
          <p>{eyebrow}</p>
          <h2>{title}</h2>
          {body ? <span>{body}</span> : null}
        </div>
        <div className="room-content">{children}</div>
      </div>
    </section>
  )
}
