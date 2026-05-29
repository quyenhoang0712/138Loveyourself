import { formatTime } from '../utils/time'
import { longBreakSeconds, shortBreakSeconds } from '../config/appConfig'

export function FocusSection({
  activeTimerMessage,
  canAddIceCube,
  copy,
  draggingIcePosition,
  focusRound,
  iceCubeCount,
  iceCubeSeconds,
  iceCupRef,
  iceDropAnimationKey,
  iceDropDepth,
  iceFadeProgress,
  iceImpactBottom,
  iceMeltProgress,
  iceShrinkProgress,
  iceStackLayout,
  iceWaterProgress,
  iceWaterSurface,
  isIceDroppingIntoCup,
  isTimerRunning,
  maxIceCubes,
  maxSelectableIceCubes,
  onIceCubeCountChange,
  onIceDragCancel,
  onIceDragEnd,
  onIceDragStart,
  onResetTimer,
  onSkipBreak,
  onStartBreak,
  onTimerStartToggle,
  secondsLeft,
  timerPhase,
}) {
  const isBreakReady = timerPhase === 'shortBreakReady' || timerPhase === 'longBreakReady'
  const isBreakPhase = timerPhase === 'shortBreak' || timerPhase === 'longBreak'
  const isTimerStartDisabled = timerPhase === 'focus' && iceCubeCount === 0
  const timerStartLabel = isTimerRunning
    ? copy.timer.pause
    : timerPhase === 'shortBreakReady'
      ? 'Nghỉ 5 phút'
      : timerPhase === 'longBreakReady'
        ? 'Nghỉ 15 phút'
        : isBreakPhase
          ? 'Tiếp tục nghỉ'
          : copy.timer.start
  const displayedSeconds =
    timerPhase === 'shortBreakReady' ? shortBreakSeconds : timerPhase === 'longBreakReady' ? longBreakSeconds : secondsLeft

  return (
    <section className="pomodoro-section" id="focus">
      <div className="pomodoro-shell scroll-pop">
        <div className="pomodoro-heading">
          <p>{copy.timer.eyebrow}</p>
          <h2>{copy.timer.title}</h2>
        </div>

        <div className="pomodoro-card">
          <div className="ice-study-stage">
            <div
              className={`ice-cup ${isTimerRunning ? 'is-running' : ''} ${
                secondsLeft === 0 && iceCubeCount > 0 ? 'is-finished' : ''
              } ${
                (draggingIcePosition || isIceDroppingIntoCup) && canAddIceCube ? 'is-drop-target' : ''
              }`}
              ref={iceCupRef}
              style={{
                '--melt-progress': iceMeltProgress,
                '--ice-water-progress': iceWaterProgress,
                '--ice-shrink-progress': iceShrinkProgress,
                '--ice-fade-progress': iceFadeProgress,
                '--ice-drop-depth': iceDropDepth,
                '--ice-impact-bottom': iceImpactBottom,
                '--ice-water-surface': iceWaterSurface,
              }}
              aria-hidden="true"
            >
              <div className="ice-cup-rim" />
              {draggingIcePosition && canAddIceCube && <div className="ice-drop-hint">Thả vào miệng ly</div>}
              <div className="ice-cup-glass">
                <div className="ice-water" />
                {isIceDroppingIntoCup && (
                  <>
                    <span className="ice-cup-drop-cube" key={`cube-${iceDropAnimationKey}`} aria-hidden="true" />
                    <span className="ice-water-impact" key={`water-${iceDropAnimationKey}`} aria-hidden="true">
                      {Array.from({ length: 9 }, (_, index) => (
                        <span
                          key={`water-drop-${index}`}
                          style={{
                            '--water-drop-left': `${(index - 4) * 8}%`,
                            '--water-drop-peak-x': `${(index - 4) * 4}px`,
                            '--water-drop-peak-y': `${-20 - (index % 3) * 5}px`,
                            '--water-drop-end-x': `${(index - 4) * 9}px`,
                            '--water-drop-end-y': `${10 + (index % 2) * 4}px`,
                          }}
                        />
                      ))}
                    </span>
                    <span className="ice-cup-drop-splash" key={`splash-${iceDropAnimationKey}`} aria-hidden="true">
                      {Array.from({ length: 7 }, (_, index) => (
                        <span key={`drop-spark-${index}`} style={{ '--splash-index': index }} />
                      ))}
                    </span>
                  </>
                )}
                <div className="ice-cubes">
                  {Array.from({ length: iceCubeCount }, (_, index) => {
                    const cubeLayout = iceStackLayout[index % iceStackLayout.length]

                    return (
                      <span
                        className="ice-cube"
                        key={`ice-${index}`}
                        style={{
                          '--cube-index': index,
                          '--cube-left': `${cubeLayout.left}%`,
                          '--cube-bottom': `${cubeLayout.bottom}%`,
                          '--cube-rotate': `${cubeLayout.rotate}deg`,
                          '--cube-size': cubeLayout.size,
                          '--cube-z': cubeLayout.z,
                        }}
                      />
                    )
                  })}
                </div>
                <div className="ice-bubbles">
                  {Array.from({ length: 12 }, (_, index) => (
                    <span
                      key={`bubble-${index}`}
                      style={{
                        '--bubble-index': index,
                        '--bubble-left': `${(index * 19) % 100}%`,
                        '--bubble-bottom': `${(index * 11) % 58}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="ice-cup-shadow" />
            </div>

            <div className="ice-bucket-panel">
              <div
                className={`ice-bucket ${canAddIceCube ? '' : 'is-disabled'}`}
                role="button"
                tabIndex={canAddIceCube ? 0 : -1}
                aria-disabled={!canAddIceCube}
                aria-label="Kéo một viên đá vào cốc"
                onPointerDown={onIceDragStart}
                onPointerUp={onIceDragEnd}
                onPointerCancel={onIceDragCancel}
              >
                <span className="ice-bucket-handle" />
                <span className="ice-bucket-body">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span className="ice-bucket-cube" key={`bucket-ice-${index}`} />
                  ))}
                </span>
                <span className="ice-bucket-grabber" aria-hidden="true">
                  <span className="ice-bucket-grab-cube" />
                </span>
                <span className="ice-bucket-label">Kéo đá</span>
              </div>
              {draggingIcePosition && (
                <span
                  className={`ice-drag-ghost ${draggingIcePosition.isDropping ? 'is-dropping' : ''} ${
                    draggingIcePosition.isReturning ? 'is-returning' : ''
                  }`}
                  style={{
                    '--drag-x': `${draggingIcePosition.x}px`,
                    '--drag-y': `${draggingIcePosition.y}px`,
                    '--drop-mid': `${draggingIcePosition.dropMid || 0}px`,
                    '--drop-end': `${draggingIcePosition.dropEnd || 0}px`,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          <div className="ice-picker" aria-label="Chọn số viên đá">
              <button
                type="button"
                onClick={() => onIceCubeCountChange(iceCubeCount - 1)}
                disabled={isTimerRunning || timerPhase !== 'focus' || maxSelectableIceCubes === 0 || iceCubeCount === 0}
                aria-label="Giảm một viên đá"
              >
              −
            </button>
            <div>
              <strong>{iceCubeCount}</strong>
              <span>{iceCubeCount * iceCubeSeconds} giây</span>
            </div>
              <button
                type="button"
                onClick={() => onIceCubeCountChange(iceCubeCount + 1)}
                disabled={isTimerRunning || timerPhase !== 'focus' || iceCubeCount >= maxSelectableIceCubes}
                aria-label="Thêm một viên đá"
              >
              +
            </button>
          </div>

          <div className="ice-cube-tray">
            {Array.from({ length: maxIceCubes }, (_, index) => (
              <button
                className={index < iceCubeCount ? 'is-active' : ''}
                type="button"
                key={`ice-choice-${index}`}
                onClick={() => onIceCubeCountChange(index + 1)}
                disabled={isTimerRunning || timerPhase !== 'focus' || index + 1 > maxSelectableIceCubes}
                aria-label={`Chọn ${index + 1} viên đá`}
                aria-pressed={index < iceCubeCount}
              >
                <span />
              </button>
            ))}
          </div>

          <div className="timer-display" aria-live="polite">
            {formatTime(displayedSeconds)}
          </div>

          <div className="timer-actions">
            <button className="timer-start" type="button" onClick={onTimerStartToggle} disabled={isTimerStartDisabled}>
              {timerStartLabel}
            </button>
            {timerPhase === 'longBreakReady' && (
              <button className="timer-break-option" type="button" onClick={() => onStartBreak('short')}>
                Nghỉ 5 phút
              </button>
            )}
            {isBreakReady && iceCubeCount > 0 && (
              <button className="timer-break-option" type="button" onClick={onSkipBreak}>
                Tiếp tục học
              </button>
            )}
            <button className="timer-reset" type="button" onClick={onResetTimer}>
              {copy.timer.reset}
            </button>
          </div>
        </div>

        <div className="focus-status">
          <span>{copy.timer.round(focusRound)}</span>
          <p>{activeTimerMessage}</p>
        </div>
      </div>
    </section>
  )
}
