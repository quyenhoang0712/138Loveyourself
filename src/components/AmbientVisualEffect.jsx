const rainDropCount = 42
const waveRippleCount = 12
const fireSparkCount = 24

export function AmbientVisualEffect({ activeSound }) {
  if (!activeSound) return null

  return (
    <div className={`ambient-visual ambient-visual-${activeSound}`} aria-hidden="true">
      {activeSound === 'rain' && (
        <div className="rain-field">
          {Array.from({ length: rainDropCount }, (_, index) => (
            <span
              className="rain-drop"
              key={`rain-${index}`}
              style={{
                '--drop-left': `${(index * 37) % 101}%`,
                '--drop-delay': `${-((index * 0.19) % 2.6)}s`,
                '--drop-duration': `${0.82 + (index % 7) * 0.08}s`,
                '--drop-length': `${48 + (index % 5) * 12}px`,
                '--drop-opacity': `${0.24 + (index % 6) * 0.06}`,
              }}
            />
          ))}
        </div>
      )}

      {activeSound === 'waves' && (
        <div className="wave-field">
          {Array.from({ length: waveRippleCount }, (_, index) => (
            <span
              className="wave-ripple"
              key={`wave-${index}`}
              style={{
                '--ripple-left': `${6 + ((index * 17) % 88)}%`,
                '--ripple-bottom': `${18 + (index % 5) * 19}px`,
                '--ripple-delay': `${-((index * 0.42) % 4.8)}s`,
                '--ripple-duration': `${3.6 + (index % 4) * 0.55}s`,
                '--ripple-width': `${96 + (index % 6) * 28}px`,
              }}
            />
          ))}
        </div>
      )}

      {activeSound === 'fire' && (
        <div className="fire-field">
          <span className="fire-glow" />
          {Array.from({ length: fireSparkCount }, (_, index) => (
            <span
              className="fire-spark"
              key={`fire-${index}`}
              style={{
                '--spark-left': `${8 + ((index * 11) % 84)}%`,
                '--spark-delay': `${-((index * 0.23) % 2.8)}s`,
                '--spark-duration': `${1.2 + (index % 7) * 0.16}s`,
                '--spark-size': `${4 + (index % 5) * 2}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
