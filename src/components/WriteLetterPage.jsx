import { useEffect, useState } from 'react'
import { SiteFooter } from './SiteFooter'
import { assetUrl } from '../utils/assets'
import './WriteLetterPage.css'

const stampUrl = assetUrl('tem/Letter 138knitwear-12.svg')
const openEnvelopeUrl = assetUrl('letter-open.png')
const closedEnvelopeUrl = assetUrl('letter-closed.png')
const envelopeOptions = [
  { id: 'blue', label: 'Xanh', color: '#4b91cf', filter: 'none' },
  { id: 'pink', label: 'Hồng', color: '#d77f9c', filter: 'hue-rotate(122deg) saturate(0.72) brightness(1.08)' },
  { id: 'green', label: 'Nâu', color: '#796b50', filter: 'sepia(.72) saturate(.65) brightness(.72)' },
  { id: 'violet', label: 'Vàng', color: '#f8db8e', filter: 'sepia(.9) saturate(1.2) brightness(1.15)' },
]
const sealOptions = [
  { id: 'cream', label: 'Xanh', color: '#478dc9', filter: 'hue-rotate(170deg) saturate(1.1)' },
  { id: 'pink', label: 'Hồng', color: '#efa9b8', filter: 'hue-rotate(305deg) saturate(.85)' },
  { id: 'mint', label: 'Nâu', color: '#796b50', filter: 'sepia(.7) saturate(.7) brightness(.72)' },
  { id: 'lavender', label: 'Vàng', color: '#f8db8e', filter: 'none' },
]

export function WriteLetterPage() {
  const [user, setUser] = useState(null)
  const [isCheckingUser, setIsCheckingUser] = useState(true)
  const [recipient, setRecipient] = useState('Cộng đồng')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPackaged, setIsPackaged] = useState(false)
  const [isPackaging, setIsPackaging] = useState(false)
  const [envelopeColor, setEnvelopeColor] = useState('blue')
  const [sealColor, setSealColor] = useState('lavender')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch((error) => {
        if (error.name !== 'AbortError') setUser(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCheckingUser(false)
      })

    return () => controller.abort()
  }, [])

  function handlePackage(event) {
    event.preventDefault()
    if (!user || isPackaging) return
    if (title.trim().length < 2 || body.trim().length < 8) {
      setMessage('Bạn viết tiêu đề và nội dung dài hơn một chút nha.')
      return
    }

    setMessage('')
    setIsPackaged(true)
    setIsPackaging(true)
    window.setTimeout(() => setIsPackaging(false), 1900)
  }

  async function handleSend() {
    if (!user || isSubmitting || isPackaging) return

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/community-letters', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          title,
          body,
          isAnonymous: false,
          envelopeColor,
          sealColor,
          stampId: 'letter-12',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Chưa thể gửi lá thư.')

      window.location.assign('/#community')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="write-letter-page">
      <header className="write-letter-header">
        <a className="write-letter-brand" href="/">
          <strong>LOVE YOURSELF</strong>
          <span>138knitwear</span>
        </a>
        <div className="write-letter-account">
          {!isCheckingUser && !user ? <a href="/auth?returnTo=/write-letter">Đăng nhập/Đăng ký</a> : null}
          {user ? <span>{user.name}</span> : null}
          <a className="write-letter-home" href="/" aria-label="Về trang chủ">↪</a>
        </div>
      </header>

      <section className={`write-letter-stage ${isPackaged ? 'is-packaging' : ''}`} aria-labelledby="write-letter-title">
        {!isPackaged ? <h1 id="write-letter-title">HÃY ĐỂ LẠI LỜI NHẮN CHO CỘNG ĐỒNG HOẶC NGƯỜI BẠN QUAN TÂM</h1> : null}

        {!isPackaged ? <form id="write-letter-form" className="write-letter-form" onSubmit={handlePackage}>
          <img className="write-letter-stamp" src={stampUrl} alt="" aria-hidden="true" />
          <time>{new Date().toLocaleDateString('vi-VN')}</time>
          <input
            className="write-letter-title-input"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Tiêu đề thư..."
            maxLength="90"
            required
            disabled={!user || isSubmitting}
            aria-label="Tiêu đề thư"
          />
          <label className="write-letter-recipient">
            <span>Gửi đến:</span>
            <input
              type="text"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              maxLength="90"
              disabled={!user || isSubmitting}
              aria-label="Người nhận"
            />
          </label>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Hãy viết vài điều bạn muốn gửi gắm đến người ấy..."
            maxLength="900"
            required
            disabled={!user || isSubmitting}
            aria-label="Nội dung lá thư"
          />
        </form> : (
          <div className="write-letter-package" aria-live="polite">
            <h2 id="write-letter-title">HÃY CHỌN MÀU MÀ BẠN THÍCH NHA</h2>
            <div className="write-letter-package-layout">
              <div
                className={`community-letter-send-card ${!isPackaging ? 'is-closed-letter' : ''}`}
                style={{
                  '--community-envelope-filter': envelopeOptions.find((option) => option.id === envelopeColor)?.filter || 'none',
                  '--community-seal-filter': sealOptions.find((option) => option.id === sealColor)?.filter || 'none',
                }}
              >
                <div className="community-letter-send-paper">
                  <small>Gửi {recipient || 'Cộng đồng'}</small>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
                <img className="community-letter-send-envelope community-letter-send-envelope-open" src={openEnvelopeUrl} alt="" />
                <img className="community-letter-send-envelope community-letter-send-envelope-front" src={openEnvelopeUrl} alt="" />
                <img className="community-letter-send-envelope community-letter-send-envelope-closed" src={closedEnvelopeUrl} alt="" />
                <img className="write-letter-seal" src={assetUrl('condau.svg')} alt="" aria-hidden="true" />
              </div>

              {!isPackaging ? <div className="write-letter-package-side">
                <div className="write-letter-package-options">
                  <fieldset>
                    <legend>Màu phong thư</legend>
                    <div>{envelopeOptions.map((option) => <button key={option.id} className={envelopeColor === option.id ? 'is-active' : ''} type="button" style={{ '--swatch-color': option.color }} aria-label={option.label} title={option.label} onClick={() => setEnvelopeColor(option.id)} />)}</div>
                  </fieldset>
                  <fieldset>
                    <legend>Màu con dấu</legend>
                    <div>{sealOptions.map((option) => <button key={option.id} className={sealColor === option.id ? 'is-active' : ''} type="button" style={{ '--swatch-color': option.color }} aria-label={option.label} title={option.label} onClick={() => setSealColor(option.id)} />)}</div>
                  </fieldset>
                </div>
                <div className="write-letter-package-actions">
                  <button type="button" onClick={() => setIsPackaged(false)}>Viết lại</button>
                  <button type="button" disabled={isSubmitting} onClick={handleSend}>{isSubmitting ? 'Đang gửi...' : 'Gửi thư'}</button>
                </div>
              </div> : <p className="write-letter-packaging-status">Đang đóng gói lá thư...</p>}
            </div>
          </div>
        )}

        {message ? <p className="write-letter-message" role="alert">{message}</p> : null}
        {isCheckingUser ? (
          <span className="write-letter-submit is-disabled">Đang kiểm tra tài khoản...</span>
        ) : user ? (
          !isPackaged ? <button className="write-letter-submit" type="submit" form="write-letter-form" disabled={isPackaging}>
            Đóng gói lá thư
          </button>
          : null
        ) : (
          <a className="write-letter-submit" href="/auth?returnTo=/write-letter">Đăng nhập/Đăng ký</a>
        )}
      </section>

      <SiteFooter />
    </main>
  )
}
