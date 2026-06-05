export function DecisionSection({ copy, decisionAnimationKey, decisionMessage, decisionMotion, onAskDecision, onChooseAgain }) {
  const isRevealed = decisionMotion === 'revealed'

  return (
    <section className="decision-section" id="decision">
      <div className="decision-shell scroll-pop">
        <p>{copy.decision.eyebrow}</p>
        <h2>{copy.decision.title}</h2>

        <div className={`decision-chat ${isRevealed ? 'has-response' : ''}`} key={decisionAnimationKey}>
          {!isRevealed ? (
            <form className="decision-chat-form" onSubmit={(event) => {
              event.preventDefault()
              onAskDecision()
            }}>
              <label htmlFor="decision-chat-input">Nhắn cho vị thần</label>
              <div className="decision-chat-input-row">
                <input id="decision-chat-input" type="text" value="xin 1 dấu hiệu" readOnly />
                <button type="submit" aria-label="Gửi câu hỏi">
                  gửi
                </button>
              </div>
            </form>
          ) : (
            <div className="decision-chat-response" aria-live="polite">
              <img className="decision-oracle-image is-sm1" src="/sm1.svg" alt="" aria-hidden="true" />
              <div className="decision-answer-bubble">
                <img src="/sm2.svg" alt="" aria-hidden="true" />
                <span>{decisionMessage || copy.decision.idle}</span>
              </div>
            </div>
          )}
        </div>

        {isRevealed ? (
          <button className="decision-button is-secondary" type="button" onClick={onChooseAgain}>
            {copy.decision.again}
          </button>
        ) : null}
      </div>
    </section>
  )
}
