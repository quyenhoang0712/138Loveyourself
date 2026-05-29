import { DayNightSwitch } from './DayNightSwitch'
import { HeartIcon } from './icons'

export function SiteHeader({
  copy,
  isLanguageMenuOpen,
  isNightMode,
  language,
  languageOptions,
  languageSwitcherRef,
  onLanguageChange,
  onLanguageMenuToggle,
  onToggleColorMode,
}) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="138.LoveYourself">
        <HeartIcon />
        <span>138.LoveYourself</span>
      </a>
      <div className="header-actions">
        <div className={`language-switcher ${isLanguageMenuOpen ? 'is-open' : ''}`} ref={languageSwitcherRef}>
          <button
            className="language-trigger"
            type="button"
            aria-label={copy.language.toggle}
            aria-expanded={isLanguageMenuOpen}
            aria-haspopup="listbox"
            onClick={onLanguageMenuToggle}
          >
            <span>{copy.language.trigger}</span>
            <span className="language-trigger-chevron" aria-hidden="true">
              ⌄
            </span>
          </button>
          <div className="language-menu" role="listbox" aria-label={copy.language.label}>
            {languageOptions.map((option) => (
              <button
                className={language === option.id ? 'is-active' : ''}
                type="button"
                key={option.id}
                role="option"
                aria-selected={language === option.id}
                onClick={() => onLanguageChange(option.id)}
              >
                <span>{option.label}</span>
                <small>{option.name}</small>
              </button>
            ))}
          </div>
        </div>
        <DayNightSwitch isNightMode={isNightMode} labels={copy.theme} onToggle={onToggleColorMode} />
      </div>
    </header>
  )
}
