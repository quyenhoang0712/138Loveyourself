export function IntroVideoSection({ copy, videoUrl }) {
  return (
    <section className="intro-video-section">
      <div className="intro-video-frame scroll-pop">
        <video
          className="intro-video"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-label="138 LoveYourself opening video"
        />
        <div className="intro-video-copy">
          <p>{copy.hero.eyebrow}</p>
          <h1>{copy.hero.title}</h1>
          <span>{copy.hero.body}</span>
        </div>
      </div>
    </section>
  )
}
