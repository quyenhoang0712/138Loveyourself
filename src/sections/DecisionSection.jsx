import { useEffect, useRef, useState } from 'react'

export function DecisionSection({ copy, decisionAnimationKey, decisionMessage, decisionMotion, decisionThread = [], onAskDecision }) {
  const threadRef = useRef(null)
  const [decisionPrompt, setDecisionPrompt] = useState('')
  const isThinking = decisionMotion === 'thinking'
  const hasConversation = decisionThread.length > 0

  useEffect(() => {
    if (!threadRef.current) return
    threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [decisionAnimationKey, decisionThread])

  return (
    <section className="decision-section" id="decision">
      <div className="decision-shell scroll-pop">
        <div className="decision-banner" aria-hidden="true">
          <div className="decision-character">
            <img src="/Vector.svg" alt="" className="decision-mascot-body" />
            <img src="/Vector-2.svg" alt="" className="decision-mascot-eye-left" />
            <img src="/Vector-3.svg" alt="" className="decision-mascot-eye-right" />
            <img src="/Vector-1.svg" alt="" className="decision-mascot-mouth" />
          </div>
          <div className="decision-speech">
            <img src="/Line139.svg" alt="" className="decision-speech-top-line" />
            <img src="/hoituidiroituitraloicho.svg" alt="hỏi tui đi rồi tui trả lời cho" className="decision-speech-text" />
            <img src="/Line140.svg" alt="" className="decision-speech-bottom-line" />
          </div>
        </div>

        <div className={`decision-chat ${hasConversation ? 'has-conversation' : ''}`}>
          <h3 className="decision-chat-title">Hộp thư thoại của LOVA</h3>

          <div className={`decision-chat-thread ${!hasConversation ? 'is-empty' : ''}`} aria-live="polite" ref={threadRef}>
            {hasConversation && decisionThread.map((entry) => (
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
            ))}
          </div>

          <form className="decision-chat-form" onSubmit={(event) => {
            event.preventDefault()
            const normalizedPrompt = decisionPrompt.trim()

            if (!isThinking && normalizedPrompt) {
              onAskDecision(normalizedPrompt)
              setDecisionPrompt('')
            }
          }}>
            <label htmlFor="decision-chat-input" className="sr-only">Nhắn cho vị thần</label>
            <div className="decision-chat-input-row">
              <input
                id="decision-chat-input"
                type="text"
                value={decisionPrompt}
                maxLength="120"
                placeholder="Thắc mắc của bạn là gì?"
                onChange={(event) => setDecisionPrompt(event.target.value)}
              />
              <button type="submit" aria-label="Gửi câu hỏi" disabled={isThinking || !decisionPrompt.trim()}>
                Gửi
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
