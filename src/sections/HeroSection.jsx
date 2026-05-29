export function HeroSection({ copy, videoUrl }) {
  return (
    <section className="hero-section" id="home">
      <video className="hero-video scroll-pop" src={videoUrl} autoPlay muted loop playsInline aria-label="138 LoveYourself opening video" />
      <div className="hero-intro scroll-pop">
        <p>{copy.hero.eyebrow}</p>
        <h1>{copy.hero.title}</h1>
        <span>{copy.hero.body}</span>
        <div className="hero-flow" aria-label={copy.hero.flowLabel}>
          <a href="#quote">1. {copy.hero.flow[0]}</a>
          <a href="#decision">2. {copy.hero.flow[1]}</a>
          <a href="#ambient">3. {copy.hero.flow[2]}</a>
          <a href="#library">4. {copy.hero.flow[3]}</a>
          <a href="#collection">5. {copy.hero.flow[4]}</a>
          <a href="#focus">6. {copy.hero.flow[5]}</a>
          <a href="#about">7. {copy.hero.flow[6]}</a>
        </div>
      </div>
    </section>
  )
}
