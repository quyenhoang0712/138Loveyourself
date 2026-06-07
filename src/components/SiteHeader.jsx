export function SiteHeader({ variant = 'sticky' }) {
  return (
    <header className={`site-header site-header-${variant}`}>
      <a className="brand" href="/" aria-label="Love Yourself 138knitwear">
        <span>LOVE YOURSELF</span>
        <small>138knitwear</small>
      </a>
    </header>
  )
}
