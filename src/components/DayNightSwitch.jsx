export function DayNightSwitch({ isNightMode, labels, onToggle }) {
  return (
    <button
      className={`day-night-switch ${isNightMode ? 'is-night' : ''}`}
      type="button"
      aria-label={isNightMode ? labels.toDay : labels.toNight}
      aria-pressed={isNightMode}
      onClick={onToggle}
    >
      <span className="switch-scene" aria-hidden="true">
        <span className="switch-sky">
          <span className="switch-cloud switch-cloud-one" />
          <span className="switch-cloud switch-cloud-two" />
          <span className="switch-cloud switch-cloud-three" />
          <span className="switch-star switch-star-one" />
          <span className="switch-star switch-star-two" />
          <span className="switch-star switch-star-three" />
          <span className="switch-star switch-star-four" />
          <span className="switch-star switch-star-five" />
        </span>
        <span className="switch-orb">
          <span className="switch-hand switch-hand-long" />
          <span className="switch-hand switch-hand-short" />
          <span className="switch-pin" />
        </span>
        <span className="switch-person">
          <span className="person-shadow" />
          <span className="person-leg person-leg-back" />
          <span className="person-leg person-leg-front" />
          <span className="person-dress" />
          <span className="person-arm person-arm-back" />
          <span className="person-arm person-arm-front" />
          <span className="person-neck" />
          <span className="person-head" />
          <span className="person-hair" />
          <span className="person-sign">{isNightMode ? 'OFF' : 'ON'}</span>
        </span>
      </span>
    </button>
  )
}
