import { HeartIcon } from '../components/icons'

export function EndingSection({ copy }) {
  return (
    <section className="ending-section" id="about">
      <div className="ending-content scroll-pop">
        <HeartIcon size={190} />
        <h2>{copy.ending.title}</h2>
        <p>{copy.ending.body}</p>
        <a className="ending-link" href="https://138knitwear.com/" target="_blank" rel="noreferrer">
          {copy.ending.cta}
        </a>
        <span>♡ 138.LoveYourself</span>
      </div>
    </section>
  )
}
