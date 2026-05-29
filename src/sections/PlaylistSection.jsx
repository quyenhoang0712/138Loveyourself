export function PlaylistSection({ copy }) {
  return (
    <section className="playlist-section" id="collection">
      <div className="spotify-caption scroll-pop">
        <p>{copy.playlist.eyebrow}</p>
        <h2>{copy.playlist.title}</h2>
      </div>

      <iframe
        className="spotify-player scroll-pop"
        title={copy.playlist.playerTitle}
        src="https://open.spotify.com/embed/playlist/1yd3LjXq6a5EXVA11w7UPH?utm_source=generator&theme=0"
        width="100%"
        height="560"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </section>
  )
}
