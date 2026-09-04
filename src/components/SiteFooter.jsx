import { assetUrl } from '../utils/assets'
import './SiteFooter.css'

const socialLinks = [
  {
    label: 'Instagram của 138knitwear',
    href: 'https://www.instagram.com/138.loveyourself',
    icon: assetUrl('footer/ig.svg'),
  },
  {
    label: 'Facebook của 138knitwear',
    href: 'https://www.facebook.com/profile.php?id=61592133620956',
    icon: assetUrl('footer/fb.svg'),
  },
  {
    label: 'TikTok của 138knitwear',
    href: 'https://www.tiktok.com/@138.loveyourself',
    icon: assetUrl('footer/tiktok.svg'),
  },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <img
          className="site-footer-mascot"
          src={assetUrl('footer/iconfront.svg')}
          alt=""
          aria-hidden="true"
        />
        <span>LOVE YOURSELF</span>
        <small>138knitwear</small>
      </div>

      <img
        className="site-footer-decoration"
        src={assetUrl('footer/vongduoi.svg')}
        alt=""
        aria-hidden="true"
      />

      <div className="site-footer-meta">
        <p className="site-footer-email">
          <strong>Gmail:</strong>
          <a href="mailto:138.loveyourself@gmail.com">138.loveyourself@gmail.com</a>
        </p>

        <address className="site-footer-address">
          <strong>The Love Exchange Store:</strong>{' '}
          <span>83 Thạch Thị Thanh,</span>
          <span>Phường Tân Định, Quận 1, Tp.Hồ Chí Minh</span>
        </address>

        <nav className="site-footer-socials" aria-label="Mạng xã hội của 138knitwear">
          {socialLinks.map((social) => (
            <a
              href={social.href}
              key={social.label}
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
            >
              <img src={social.icon} alt="" />
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
