import { useEffect, useRef, useState } from 'react'

export function DecisionSection({ copy, decisionAnimationKey, decisionMessage, decisionMotion, decisionThread = [], onAskDecision }) {
  const threadRef = useRef(null)
  const [decisionPrompt, setDecisionPrompt] = useState('xin 1 dấu hiệu')
  const isThinking = decisionMotion === 'thinking'
  const hasConversation = decisionThread.length > 0

  useEffect(() => {
    if (!threadRef.current) return
    threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [decisionAnimationKey, decisionThread])

  return (
    <section className="decision-section" id="decision">
      <div className="decision-shell scroll-pop">
        <p>{copy.decision.eyebrow}</p>
        <h2>{copy.decision.title}</h2>

        <div className={`decision-chat ${hasConversation ? 'has-conversation' : ''}`}>
          <div className={`decision-chat-thread ${hasConversation ? '' : 'is-empty'}`} aria-live="polite" ref={threadRef}>
            {hasConversation ? (
              decisionThread.map((entry) => (
                <div className="decision-chat-exchange" key={entry.id}>
                  <div className="decision-message decision-message-user">
                    <span>{entry.prompt}</span>
                  </div>

                  <div className={`decision-message decision-message-oracle ${entry.isThinking ? 'is-typing' : ''}`}>
                    {entry.isThinking ? (
                      <span className="decision-typing" aria-label="Đang trả lời">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : (
                      <span>{entry.response || decisionMessage || copy.decision.idle}</span>
                    )}
                  </div>
                </div>
              ))
            ) : null}
          </div>

          <form className="decision-chat-form" onSubmit={(event) => {
            event.preventDefault()
            const normalizedPrompt = decisionPrompt.trim()

            if (!isThinking && normalizedPrompt) {
              onAskDecision(normalizedPrompt)
              setDecisionPrompt('')
            }
          }}>
            <label htmlFor="decision-chat-input">Nhắn cho vị thần</label>
            <div className="decision-chat-input-row">
              <input
                id="decision-chat-input"
                type="text"
                value={decisionPrompt}
                maxLength="120"
                placeholder="xin 1 dấu hiệu"
                onChange={(event) => setDecisionPrompt(event.target.value)}
              />
              <button type="submit" aria-label="Gửi câu hỏi" disabled={isThinking || !decisionPrompt.trim()}>
                gửi
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
