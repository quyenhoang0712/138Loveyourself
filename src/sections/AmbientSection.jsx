import { AmbientIcon } from '../components/icons'

export function AmbientSection({ activeAmbientSound, copy, onAmbientSoundToggle, soundOptions }) {
  return (
    <section className="ambient-section" id="ambient" aria-label={copy.ambient.label}>
      <div className="ambient-shell scroll-pop">
        <div className="ambient-heading" style={{ textAlign: 'center' }}>
          <h2 className="ambient-title" style={{ textAlign: 'center' }}>{copy.ambient.roomTitle || 'Phòng tập trung'}</h2>
          <p className="ambient-subtitle" style={{ textAlign: 'center' }}>{copy.ambient.subtitle || copy.ambient.title || 'Chọn âm thanh để có thể tập trung làm việc hơn nha'}</p>
        </div>

        <div className="ambient-stage">
          <div className="ambient-controls" role="group" aria-label={copy.ambient.label}>
            {soundOptions.map((sound) => (
              <button
                className={`ambient-button ${activeAmbientSound === sound.id ? 'is-active' : ''}`}
                type="button"
                key={sound.id}
                aria-label={copy.ambient.sounds[sound.id]}
                title={copy.ambient.sounds[sound.id]}
                aria-pressed={activeAmbientSound === sound.id}
                onClick={() => onAmbientSoundToggle(sound.id)}
              >
                <AmbientIcon type={sound.id} />
              </button>
            ))}
          </div>

          <div className="ambient-mascot" aria-hidden="true">
            <img
              src="https://dccpjtvtpue8ic8d.public.blob.vercel-storage.com/assets/public/mascottaptrung-uVPEzbBGIVZJqt3QVm5JIa00vo7q4r.svg"
              alt=""
              width="284"
              height="399"
              className="ambient-mascot-img"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
