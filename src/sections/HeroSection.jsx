export function HeroSection({ videoUrl }) {
  return (
    <section className="hero-section" id="home">
      <video className="hero-video scroll-pop" src={videoUrl} autoPlay muted loop playsInline aria-label="138 LoveYourself opening video" />
    </section>
  )
}
