import { ShareIcon } from '../components/icons'

export function SiteFooter({ copy }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-column footer-company scroll-pop">
          <h2>138knitwear</h2>
          <p>{copy.footer.business}</p>
          <p>{copy.footer.address}</p>
          <a href="tel:0867789138">0867789138</a>
          <a href="mailto:with138knitwear@gmail.com">with138knitwear@gmail.com</a>
          <p>{copy.footer.store}</p>
          <img className="commerce-badge" src="/image.png" alt={copy.footer.badgeAlt} />
        </div>

        <div className="footer-column footer-contact scroll-pop">
          <h3>{copy.footer.contact}</h3>
          <form className="footer-email-form" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="footer-email">{copy.footer.emailLabel}</label>
            <div>
              <input id="footer-email" type="email" aria-label={copy.footer.emailAria} />
              <button type="submit" aria-label={copy.footer.submitAria}>
                <ShareIcon />
              </button>
            </div>
          </form>
          <div className="footer-socials" aria-label={copy.footer.socialsLabel}>
            <a className="social-zalo" href="https://zalo.me/0867789138" target="_blank" rel="noreferrer">
              Zalo
            </a>
            <a className="social-tiktok" href="https://www.tiktok.com/" target="_blank" rel="noreferrer">
              TikTok
            </a>
            <a className="social-instagram" href="https://www.instagram.com/" target="_blank" rel="noreferrer">
              IG
            </a>
            <a className="social-facebook" href="https://www.facebook.com/" target="_blank" rel="noreferrer">
              f
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">♡ 138.LoveYourself</div>
    </footer>
  )
}
