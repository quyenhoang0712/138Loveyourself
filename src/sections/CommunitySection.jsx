import { useState } from 'react'

const communityLettersStorageKey = 'love-yourself-community-letters'

function getStoredLetters() {
  try {
    return JSON.parse(localStorage.getItem(communityLettersStorageKey) || '[]')
  } catch {
    return []
  }
}

function storeLetters(letters) {
  try {
    localStorage.setItem(communityLettersStorageKey, JSON.stringify(letters))
  } catch {
    // Keep the letter visible in this session when storage is unavailable.
  }
}

export function CommunitySection() {
  const [letters, setLetters] = useState(getStoredLetters)
  const [recipient, setRecipient] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const normalizedRecipient = recipient.trim()
    const normalizedTitle = title.trim()
    const normalizedBody = body.trim()

    if (normalizedRecipient.length < 2 || normalizedTitle.length < 2 || normalizedBody.length < 8) {
      setMessage('Bạn viết người nhận, tiêu đề và nội dung dài hơn một chút nha.')
      return
    }

    const nextLetter = {
      id: `letter-${Date.now()}`,
      recipient: normalizedRecipient,
      title: normalizedTitle,
      body: normalizedBody,
      createdAt: new Date().toISOString(),
    }
    const nextLetters = [nextLetter, ...letters].slice(0, 6)

    setLetters(nextLetters)
    storeLetters(nextLetters)
    setRecipient('')
    setTitle('')
    setBody('')
    setMessage('Lá thư của bạn đã được đặt vào phòng cộng đồng.')
  }

  return (
    <section className="community-section" id="community" aria-labelledby="community-title">
      <div className="community-letter-heading">
        <p>Phòng cộng đồng</p>
        <h1 id="community-title">Viết một lá thư nhỏ để ở lại cùng mọi người.</h1>
        <span>
          Lá thư có tiêu đề và nội dung riêng. Trước mắt mình lưu thử trên trình duyệt của bạn để xem cảm giác phòng này nha.
        </span>
      </div>

      <div className="community-letter-room">
        <div className="community-letter-compose">
          <form className="community-letter-form" onSubmit={handleSubmit}>
            <label>
              <span>Gửi cho ai</span>
              <input
                type="text"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="Ví dụ: Gửi bạn đang cần một cái ôm"
                maxLength="90"
                required
              />
            </label>

            <label>
              <span>Tiêu đề lá thư</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Gửi một ngày hơi mệt"
                maxLength="90"
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
                required
              />
            </label>

            {message ? <p className="community-letter-message">{message}</p> : null}

            <button type="submit">Gửi lá thư</button>
          </form>
        </div>
      </div>
    </section>
  )
}
