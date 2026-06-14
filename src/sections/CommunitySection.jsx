import { useEffect, useRef, useState } from 'react'
import { TrashIcon } from '../components/icons'

const closedLetterImage = '/letter-closed.svg'
const openLetterImage = '/letter-open.svg'
const envelopeColorOptions = [
  { id: 'blue', label: 'Xanh', swatch: '#4b91cf', filter: 'none' },
  { id: 'pink', label: 'Hồng', swatch: '#d77f9c', filter: 'hue-rotate(122deg) saturate(0.72) brightness(1.08)' },
  { id: 'green', label: 'Xanh lá', swatch: '#6ca58b', filter: 'hue-rotate(286deg) saturate(0.62) brightness(0.98)' },
  { id: 'violet', label: 'Tím', swatch: '#8c83c7', filter: 'hue-rotate(52deg) saturate(0.72) brightness(1.02)' },
]
const sealColorOptions = [
  { id: 'cream', label: 'Kem', color: '#fff1bf' },
  { id: 'pink', label: 'Hồng', color: '#efb1bd' },
  { id: 'mint', label: 'Bạc hà', color: '#b9ddc9' },
  { id: 'lavender', label: 'Oải hương', color: '#cbc2eb' },
]

function getEnvelopeFilter(colorId) {
  return envelopeColorOptions.find((option) => option.id === colorId)?.filter || 'none'
}

async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error('Máy chủ chưa sẵn sàng. Bạn thử lại sau một chút nha.')
  }

  return response.json()
}

export function CommunitySection() {
  const [letters, setLetters] = useState([])
  const [communityLetters, setCommunityLetters] = useState([])
  const [isLoadingCommunityLetters, setIsLoadingCommunityLetters] = useState(true)
  const [isLoadingSentLetters, setIsLoadingSentLetters] = useState(false)
  const [user, setUser] = useState(null)
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const [recipient, setRecipient] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [envelopeColor, setEnvelopeColor] = useState('blue')
  const [sealColor, setSealColor] = useState('cream')
  const [message, setMessage] = useState('')
  const [isSendPopupOpen, setIsSendPopupOpen] = useState(false)
  const [isSubmittingLetter, setIsSubmittingLetter] = useState(false)
  const [isSendingLetter, setIsSendingLetter] = useState(false)
  const [sendingLetter, setSendingLetter] = useState(null)
  const [isSentLetterOpen, setIsSentLetterOpen] = useState(false)
  const [flyingLetter, setFlyingLetter] = useState(null)
  const [draggingLetter, setDraggingLetter] = useState(null)
  const [popupMessage, setPopupMessage] = useState('')
  const sendAnimationTimeoutRef = useRef(null)
  const openLetterTimeoutRef = useRef(null)
  const letterFormRef = useRef(null)
  const titleInputRef = useRef(null)
  const trashDropRef = useRef(null)
  const draggingLetterRef = useRef(null)
  const draggedLetterRef = useRef(false)
  const canWriteLetter = Boolean(user)

  useEffect(() => {
    let ignore = false

    async function checkUser() {
      setIsCheckingUser(true)

      try {
        const response = await fetch('/api/auth/me')
        const data = await readApiResponse(response)
        if (!ignore) setUser(data.user || null)
      } catch {
        if (!ignore) setUser(null)
      } finally {
        if (!ignore) setIsCheckingUser(false)
      }
    }

    async function loadCommunityLetters() {
      setIsLoadingCommunityLetters(true)

      try {
        const response = await fetch('/api/community-letters')
        const data = await readApiResponse(response)
        if (!response.ok) throw new Error(data.error)
        if (!ignore) setCommunityLetters(Array.isArray(data.letters) ? data.letters : [])
      } catch {
        if (!ignore) setCommunityLetters([])
      } finally {
        if (!ignore) setIsLoadingCommunityLetters(false)
      }
    }

    checkUser()
    loadCommunityLetters()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadSentLetters() {
      if (!user) {
        setLetters([])
        return
      }

      setIsLoadingSentLetters(true)

      try {
        const response = await fetch('/api/community-letters/mine')
        const data = await readApiResponse(response)
        if (!response.ok) throw new Error(data.error)
        if (!ignore) setLetters(Array.isArray(data.letters) ? data.letters : [])
      } catch {
        if (!ignore) setLetters([])
      } finally {
        if (!ignore) setIsLoadingSentLetters(false)
      }
    }

    loadSentLetters()

    return () => {
      ignore = true
    }
  }, [user])

  useEffect(() => () => {
    if (sendAnimationTimeoutRef.current) clearTimeout(sendAnimationTimeoutRef.current)
    if (openLetterTimeoutRef.current) clearTimeout(openLetterTimeoutRef.current)
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!canWriteLetter) {
      setMessage('Bạn đăng nhập rồi mới gửi lá thư nha.')
      return
    }

    if (title.trim().length < 2 || body.trim().length < 8) {
      setMessage('Bạn viết tiêu đề và nội dung dài hơn một chút nha.')
      return
    }

    const packagedLetter = {
      id: `draft-${Date.now()}`,
      isDraft: true,
      recipient: 'Cộng đồng',
      title: title.trim(),
      body: body.trim(),
      envelopeColor,
      sealColor,
    }

    setSendingLetter(packagedLetter)
    setIsSentLetterOpen(false)
    setIsSendingLetter(true)
    setMessage('')
    setPopupMessage('')

    sendAnimationTimeoutRef.current = setTimeout(() => {
      setIsSendingLetter(false)
      setMessage('Lá thư đã được đóng gói.')
    }, 1900)
  }

  const handleSendLetter = async (event) => {
    event.preventDefault()
    const normalizedRecipient = recipient.trim()
    const normalizedTitle = title.trim()
    const normalizedBody = body.trim()
    const isCommunityLetter = !normalizedRecipient

    setIsSubmittingLetter(true)
    setPopupMessage('')

    try {
      const response = await fetch('/api/community-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: normalizedRecipient || 'Cộng đồng',
          title: normalizedTitle,
          body: normalizedBody,
          isAnonymous,
          envelopeColor,
          sealColor,
        }),
      })
      const data = await readApiResponse(response)

      if (!response.ok) throw new Error(data.error || 'Chưa thể gửi lá thư lúc này.')

      const nextLetter = { ...data.letter, hasVoted: false }

      if (isCommunityLetter) {
        setCommunityLetters((currentLetters) => [
          nextLetter,
          ...currentLetters.filter((letter) => letter.id !== nextLetter.id),
        ].slice(0, 50))
      }

      setLetters((currentLetters) => [
        nextLetter,
        ...currentLetters.filter((letter) => letter.id !== nextLetter.id),
      ].slice(0, 50))
      setSendingLetter(null)
      setIsSentLetterOpen(false)
      setIsSendPopupOpen(false)
      setRecipient('')
      setTitle('')
      setBody('')
      setIsAnonymous(false)
      setMessage('')
      setPopupMessage('')
      setEnvelopeColor('blue')
      setSealColor('cream')
      requestAnimationFrame(() => {
        letterFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        titleInputRef.current?.focus({ preventScroll: true })
      })
    } catch (error) {
      setPopupMessage(error.message || 'Chưa thể gửi lá thư lúc này.')
    } finally {
      setIsSubmittingLetter(false)
    }
  }

  const handleCancelSend = () => {
    if (isSubmittingLetter) return
    setIsSendPopupOpen(false)
  }

  const handleOpenSendPopup = () => {
    setPopupMessage('')
    setIsSendPopupOpen(true)
  }

  const handleEnvelopeColorChange = (colorId) => {
    setEnvelopeColor(colorId)
    setSendingLetter((letter) => letter ? { ...letter, envelopeColor: colorId } : letter)
  }

  const handleSealColorChange = (colorId) => {
    setSealColor(colorId)
    setSendingLetter((letter) => letter ? { ...letter, sealColor: colorId } : letter)
  }

  const handleOpenStoredLetter = (letter, stackId, event) => {
    if (draggedLetterRef.current) {
      draggedLetterRef.current = false
      return
    }

    if (isSendingLetter || flyingLetter || draggingLetterRef.current) return

    const sourceRect = event.currentTarget.getBoundingClientRect()
    const targetRect = letterFormRef.current?.getBoundingClientRect()
    const sourceCenterX = sourceRect.left + sourceRect.width / 2
    const sourceCenterY = sourceRect.top + sourceRect.height / 2
    const targetCenterX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2
    const targetCenterY = targetRect ? targetRect.top + targetRect.height / 2 : 0

    setFlyingLetter({
      id: letter.id,
      stackId,
      x: targetCenterX - sourceCenterX,
      y: targetCenterY - sourceCenterY,
    })

    openLetterTimeoutRef.current = setTimeout(() => {
      setSendingLetter(letter)
      setIsSentLetterOpen(true)
      setFlyingLetter(null)
      requestAnimationFrame(() => {
        letterFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }, 620)
  }

  const handleVoteLetter = () => {
    if (!sendingLetter) return

    const hasVoted = Boolean(sendingLetter.hasVoted)
    const nextLetter = {
      ...sendingLetter,
      hasVoted: !hasVoted,
      votes: Math.max(0, Number(sendingLetter.votes || 0) + (hasVoted ? -1 : 1)),
    }
    setSendingLetter(nextLetter)
    setLetters((currentLetters) => currentLetters.map((letter) => (
      letter.id === nextLetter.id ? nextLetter : letter
    )))
    setCommunityLetters((currentLetters) => currentLetters.map((letter) => (
      letter.id === nextLetter.id ? nextLetter : letter
    )))
  }

  const handleWriteNewLetter = () => {
    setSendingLetter(null)
    setIsSentLetterOpen(false)
    setTitle('')
    setBody('')
    setMessage('')
    setEnvelopeColor('blue')
    setSealColor('cream')
    requestAnimationFrame(() => {
      letterFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      titleInputRef.current?.focus({ preventScroll: true })
    })
  }

  const updateDraggingLetter = (nextDrag) => {
    draggingLetterRef.current = nextDrag
    setDraggingLetter(nextDrag)
  }

  const handleLetterDragStart = (letter, stackId, event) => {
    if (isSendingLetter || flyingLetter || event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    draggedLetterRef.current = false
    updateDraggingLetter({
      id: letter.id,
      stackId,
      startX: event.clientX,
      startY: event.clientY,
      x: 0,
      y: 0,
      isOverTrash: false,
    })
  }

  const handleLetterDragMove = (event) => {
    const currentDrag = draggingLetterRef.current
    if (!currentDrag) return

    const x = event.clientX - currentDrag.startX
    const y = event.clientY - currentDrag.startY
    if (Math.hypot(x, y) > 7) draggedLetterRef.current = true

    const trashRect = trashDropRef.current?.getBoundingClientRect()
    const isOverTrash = Boolean(
      trashRect &&
      event.clientX >= trashRect.left &&
      event.clientX <= trashRect.right &&
      event.clientY >= trashRect.top &&
      event.clientY <= trashRect.bottom
    )

    updateDraggingLetter({ ...currentDrag, x, y, isOverTrash })
  }

  const handleLetterDragEnd = async (letter, event) => {
    const currentDrag = draggingLetterRef.current
    if (!currentDrag) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (currentDrag.isOverTrash && draggedLetterRef.current) {
      try {
        const response = await fetch(`/api/community-letters/${letter.id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error()
        setCommunityLetters((currentLetters) => (
          currentLetters.filter((communityLetter) => communityLetter.id !== letter.id)
        ))
      } catch {
        setMessage('Chưa thể xóa lá thư này.')
        updateDraggingLetter(null)
        return
      }

      const nextLetters = letters.filter((storedLetter) => storedLetter.id !== letter.id)
      setLetters(nextLetters)

      if (sendingLetter?.id === letter.id) {
        setSendingLetter(null)
        setIsSentLetterOpen(false)
      }
    }

    updateDraggingLetter(null)
  }

  const renderLetterStack = (stackLetters, emptyText, { canDelete = false, stackId } = {}) => {
    if (!stackLetters.length) {
      return <p className="community-sent-letter-empty">{emptyText}</p>
    }

    return (
      <div
        className="community-sent-letter-stack"
        style={{ '--sent-letter-tail': `${Math.max(0, stackLetters.length - 1) * 24}px` }}
      >
        {[...stackLetters].reverse().map((letter, index) => (
          <button
            className={`community-sent-letter-sheet ${sendingLetter?.id === letter.id ? 'is-selected' : ''} ${
              flyingLetter?.id === letter.id && flyingLetter.stackId === stackId ? 'is-flying' : ''
            } ${draggingLetter?.id === letter.id && draggingLetter.stackId === stackId ? 'is-dragging' : ''}`}
            style={{
              '--sent-letter-angle': '0deg',
              '--sent-letter-drag-x': `${draggingLetter?.id === letter.id && draggingLetter.stackId === stackId ? draggingLetter.x : 0}px`,
              '--sent-letter-drag-y': `${draggingLetter?.id === letter.id && draggingLetter.stackId === stackId ? draggingLetter.y : 0}px`,
              '--sent-letter-fly-x': `${flyingLetter?.id === letter.id && flyingLetter.stackId === stackId ? flyingLetter.x : 0}px`,
              '--sent-letter-fly-y': `${flyingLetter?.id === letter.id && flyingLetter.stackId === stackId ? flyingLetter.y : 0}px`,
              '--sent-letter-layer': index + 1,
              '--sent-letter-top': `${index * 24}px`,
            }}
            type="button"
            key={letter.id}
            disabled={isSendingLetter || Boolean(flyingLetter)}
            onClick={(event) => handleOpenStoredLetter(letter, stackId, event)}
            onPointerCancel={canDelete ? (event) => handleLetterDragEnd(letter, event) : undefined}
            onPointerDown={canDelete ? (event) => handleLetterDragStart(letter, stackId, event) : undefined}
            onPointerMove={canDelete ? handleLetterDragMove : undefined}
            onPointerUp={canDelete ? (event) => handleLetterDragEnd(letter, event) : undefined}
          >
            <img
              src={closedLetterImage}
              alt=""
              aria-hidden="true"
              style={{ filter: getEnvelopeFilter(letter.envelopeColor) }}
            />
            <span
              className="community-sent-letter-seal"
              style={{
                '--community-seal-color': sealColorOptions.find((option) => option.id === letter.sealColor)?.color || '#fff1bf',
              }}
              aria-hidden="true"
            >
              ♥
            </span>
            <span className="community-sent-letter-label">
              <small>Gửi {letter.recipient}</small>
              <strong>{letter.title}</strong>
              <em>{Number(letter.votes || 0)} vote</em>
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <section className="community-section" id="community" aria-labelledby="community-title">
      <div className="community-letter-heading">
        <p>Phòng cộng đồng</p>
        <h1 id="community-title">Viết một lá thư nhỏ để ở lại cùng mọi người.</h1>
        <span>
          Đây là góc để anh gửi lại một lời nhắn dịu dàng cho ai đó, hoặc cho chính mình.
          Mỗi lá thư có người nhận, tiêu đề và nội dung riêng; mình giữ chúng như một khoảng nhỏ
          để cộng đồng có thể chậm lại, lắng nghe nhau và ở cạnh nhau nhẹ hơn.
        </span>
      </div>

      <div className="community-letter-room">
        <div className="community-letter-compose">
          <form
            ref={letterFormRef}
            className={`community-letter-form ${canWriteLetter ? '' : 'is-locked'} ${isSendingLetter ? 'is-folding-letter' : ''} ${
              sendingLetter && !isSendingLetter ? 'has-sent-letter' : ''
            }`}
            onSubmit={handleSubmit}
          >
            {!canWriteLetter ? (
              <div className="community-letter-login-overlay">
                <p>{isCheckingUser ? 'Đang kiểm tra tài khoản...' : 'Đăng nhập / Đăng ký để viết thư'}</p>
                {!isCheckingUser ? <a href="/auth">Đăng nhập / Đăng ký</a> : null}
              </div>
            ) : null}
            {sendingLetter ? (
              <div className={`community-letter-fold-overlay ${
                isSentLetterOpen || (sendingLetter.isDraft && !isSendingLetter) ? 'is-interactive' : ''
              }`}>
                {isSentLetterOpen ? (
                  <article className="community-letter-reader" key={`reader-${sendingLetter.id}`}>
                    <header>
                      <small>Gửi {sendingLetter.recipient || 'Cộng đồng'}</small>
                      <h2>{sendingLetter.title}</h2>
                    </header>
                    <div className="community-letter-reader-body">{sendingLetter.body}</div>
                    <footer>
                      <span>
                        {sendingLetter.isAnonymous ? 'Ẩn danh' : sendingLetter.authorName || 'Một người bạn'}
                      </span>
                      <div className="community-letter-reader-actions">
                        <button
                          className={sendingLetter.hasVoted ? 'is-voted' : ''}
                          type="button"
                          aria-pressed={Boolean(sendingLetter.hasVoted)}
                          onClick={handleVoteLetter}
                        >
                          <span aria-hidden="true">♡</span>
                          {Number(sendingLetter.votes || 0)}
                        </button>
                        <button className="community-letter-write-new" type="button" onClick={handleWriteNewLetter}>
                          Viết lá thư mới
                        </button>
                      </div>
                    </footer>
                  </article>
                ) : (
                  <div
                    className={`community-letter-send-card ${!isSendingLetter ? 'is-closed-letter' : ''}`}
                    key={sendingLetter.id}
                    style={{
                      '--community-envelope-filter': getEnvelopeFilter(sendingLetter.envelopeColor),
                      '--community-seal-color': sealColorOptions.find((option) => option.id === sendingLetter.sealColor)?.color || '#fff1bf',
                    }}
                  >
                    <div className="community-letter-send-paper">
                      <small>Gửi {sendingLetter.recipient || 'Cộng đồng'}</small>
                      <strong>{sendingLetter.title}</strong>
                      <p>{sendingLetter.body}</p>
                    </div>
                    <img className="community-letter-send-envelope community-letter-send-envelope-open" src={openLetterImage} alt="" />
                    <img className="community-letter-send-envelope community-letter-send-envelope-front" src={openLetterImage} alt="" />
                    <img className="community-letter-send-envelope community-letter-send-envelope-closed" src={closedLetterImage} alt="" />
                    <span className="community-letter-custom-seal" aria-hidden="true">♥</span>
                  </div>
                )}
                {sendingLetter.isDraft && !isSendingLetter ? (
                  <>
                    <div className="community-packaged-letter-controls">
                      <fieldset>
                        <legend>Màu phong bì</legend>
                        <div>
                          {envelopeColorOptions.map((option) => (
                            <button
                              className={sendingLetter.envelopeColor === option.id ? 'is-active' : ''}
                              style={{ '--swatch-color': option.swatch }}
                              type="button"
                              key={option.id}
                              aria-label={option.label}
                              title={option.label}
                              onClick={() => handleEnvelopeColorChange(option.id)}
                            />
                          ))}
                        </div>
                      </fieldset>
                      <fieldset>
                        <legend>Con dấu</legend>
                        <div>
                          {sealColorOptions.map((option) => (
                            <button
                              className={sendingLetter.sealColor === option.id ? 'is-active' : ''}
                              style={{ '--swatch-color': option.color }}
                              type="button"
                              key={option.id}
                              aria-label={option.label}
                              title={option.label}
                              onClick={() => handleSealColorChange(option.id)}
                            />
                          ))}
                        </div>
                      </fieldset>
                    </div>
                    <button className="community-packaged-letter-send" type="button" onClick={handleOpenSendPopup}>
                      Gửi lá thư
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}

            {!sendingLetter ? (
              <>
                <label>
                  <span>Tiêu đề lá thư</span>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ví dụ: Gửi một ngày hơi mệt"
                    maxLength="90"
                    disabled={!canWriteLetter || isSendingLetter}
                    required
                  />
                </label>

                <label>
                  <span>Nội dung</span>
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Bạn muốn viết điều gì cho cộng đồng?"
                    maxLength="900"
                    disabled={!canWriteLetter || isSendingLetter}
                    required
                  />
                </label>

                {message ? <p className="community-letter-message">{message}</p> : null}

                <button type="submit" disabled={!canWriteLetter || isCheckingUser || isSendingLetter}>
                  {isSendingLetter ? 'Đang đóng gói...' : 'Đóng gói lá thư'}
                </button>
              </>
            ) : null}
          </form>
        </div>
      </div>

      <section className="community-sent-letters" aria-labelledby="community-sent-letters-title">
        <div className="community-sent-letters-heading">
          <p>Hộp thư đã gửi</p>
          <h2 id="community-sent-letters-title">Những lá thư bạn đã để lại.</h2>
        </div>

        <div className="community-sent-letter-boxes">
          <section className="community-sent-letter-box" aria-labelledby="personal-sent-letters-title">
            <h3 id="personal-sent-letters-title">Thư bạn đã gửi</h3>
            {renderLetterStack(
              user ? letters : [],
              user
                ? (isLoadingSentLetters ? 'Đang mở hộp thư của bạn...' : 'Bạn chưa gửi lá thư nào.')
                : 'Đăng nhập để xem thư bạn đã gửi.',
              { canDelete: true, stackId: 'sent' }
            )}
          </section>

          <section className="community-sent-letter-box" aria-labelledby="community-sent-stack-title">
            <h3 id="community-sent-stack-title">Thư cộng đồng</h3>
            {renderLetterStack(
              communityLetters,
              isLoadingCommunityLetters ? 'Đang mở hộp thư cộng đồng...' : 'Chưa có thư cộng đồng.',
              { canDelete: false, stackId: 'community' }
            )}
          </section>
        </div>

        {draggingLetter ? (
          <div
            className={`community-letter-trash ${draggingLetter.isOverTrash ? 'is-active' : ''}`}
            ref={trashDropRef}
            role="status"
          >
            <TrashIcon />
            <span>Thả vào đây để xóa thư</span>
          </div>
        ) : null}
      </section>

      {isSendPopupOpen ? (
        <div className="community-letter-popup-backdrop" role="presentation" onClick={handleCancelSend}>
          <div
            className="community-letter-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-letter-popup-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p>Gửi lá thư</p>
            <h2 id="community-letter-popup-title">Bạn muốn gửi lá thư này cho ai?</h2>
            <form className="community-letter-popup-form" onSubmit={handleSendLetter}>
              <label>
                <span>Gửi cho ai</span>
                <input
                  type="text"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder="Để trống nếu gửi cho cộng đồng"
                  maxLength="90"
                  autoFocus
                  disabled={isSubmittingLetter}
                />
              </label>

              <label className="community-letter-popup-check">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  disabled={isSubmittingLetter}
                />
                <span>Gửi ẩn danh</span>
              </label>

              {popupMessage ? <small>{popupMessage}</small> : null}

              <div>
                <button type="button" onClick={handleCancelSend} disabled={isSubmittingLetter}>
                  Quay lại
                </button>
                <button type="submit" disabled={isSubmittingLetter}>
                  {isSubmittingLetter ? 'Đang gửi...' : 'Gửi lá thư'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
