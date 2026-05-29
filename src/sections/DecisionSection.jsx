export function DecisionSection({ copy, decisionAnimationKey, decisionMessage, decisionMotion, onAskDecision, onChooseAgain }) {
  return (
    <section className="decision-section" id="decision">
      <div className="decision-shell scroll-pop">
        <p>{copy.decision.eyebrow}</p>
        <h2>{copy.decision.title}</h2>
        <div className={`decision-stage ${decisionMotion !== 'idle' ? 'has-card' : ''}`}>
          <div className={`decision-card is-${decisionMotion}`} key={decisionAnimationKey} aria-live="polite" aria-hidden={decisionMotion === 'idle'}>
            <span>{decisionMessage || copy.decision.idle}</span>
          </div>
        </div>
        <button
          className={`decision-button ${decisionMotion === 'revealed' ? 'is-secondary' : ''}`}
          type="button"
          onClick={decisionMotion === 'revealed' ? onChooseAgain : onAskDecision}
        >
          {decisionMotion === 'revealed' ? copy.decision.again : copy.decision.ask}
        </button>
      </div>
    </section>
  )
}
