import { AmbientIcon } from '../components/icons'

export function AmbientSection({ activeAmbientSound, copy, onAmbientSoundToggle, soundOptions }) {
  return (
    <section className="ambient-section" id="ambient" aria-label={copy.ambient.label}>
      <div className="ambient-shell scroll-pop">
        <div className="ambient-heading">
          <p>{copy.ambient.eyebrow}</p>
          <h2>{copy.ambient.title}</h2>
        </div>

        <div className="ambient-controls">
          {soundOptions.map((sound) => (
            <button
              className={`ambient-button ${activeAmbientSound === sound.id ? 'is-active' : ''}`}
              type="button"
              key={sound.id}
              aria-pressed={activeAmbientSound === sound.id}
              onClick={() => onAmbientSoundToggle(sound.id)}
            >
              <AmbientIcon type={sound.id} />
              <span>{copy.ambient.sounds[sound.id]}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
