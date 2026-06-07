export function DecisionSection({ copy, decisionAnimationKey, decisionMessage, decisionMotion, onAskDecision }) {
  const isRevealed = decisionMotion === 'revealed'
  const isThinking = decisionMotion === 'thinking'
  const hasConversation = isThinking || isRevealed
  const decisionPrompt = 'xin 1 dấu hiệu'

  return (
    <section className="decision-section" id="decision">
      <div className="decision-shell scroll-pop">
        <p>{copy.decision.eyebrow}</p>
        <h2>{copy.decision.title}</h2>

        <div className={`decision-chat ${hasConversation ? 'has-conversation' : ''}`}>
          <div className={`decision-chat-thread ${hasConversation ? '' : 'is-empty'}`} aria-live="polite" key={decisionAnimationKey}>
            {hasConversation ? (
              <>
                <div className="decision-message decision-message-user">
                  <span>{decisionPrompt}</span>
                </div>

                <div className={`decision-message decision-message-oracle ${isThinking ? 'is-typing' : ''}`}>
                  {isThinking ? (
                    <span className="decision-typing" aria-label="Đang trả lời">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <span>{decisionMessage || copy.decision.idle}</span>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <form className="decision-chat-form" onSubmit={(event) => {
            event.preventDefault()
            if (!isThinking) {
              onAskDecision()
            }
          }}>
            <label htmlFor="decision-chat-input">Nhắn cho vị thần</label>
            <div className="decision-chat-input-row">
              <input id="decision-chat-input" type="text" value={decisionPrompt} readOnly />
              <button type="submit" aria-label="Gửi câu hỏi" disabled={isThinking}>
                gửi
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
