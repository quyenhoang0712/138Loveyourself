import { useEffect, useRef, useState } from 'react'
import { assetUrl } from '../utils/assets'
import './CommunityMemories.css'

async function readResponse(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Chưa kết nối được góc kỷ niệm. Bạn thử lại sau nha.')
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Chưa tải được kỷ niệm. Bạn thử lại nha.')
  return data
}

async function prepareImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Bạn chọn ảnh JPG, PNG hoặc WebP dưới 10 MB nha.')
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
  const context = canvas.getContext('2d')
  context.fillStyle = '#eee7d4'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const image = canvas.toDataURL('image/jpeg', 0.8)
  if (image.length > 1500000) throw new Error('Ảnh còn hơi lớn, bạn chọn ảnh nhỏ hơn nha.')
  return image
}

export function CommunityMemories({ user }) {
  const memoriesPerPage = 4
  const [memories, setMemories] = useState([])
  const [active, setActive] = useState(0)
  const [draft, setDraft] = useState('')
  const [caption, setCaption] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef(null)
  const selected = memories[active]
  const pageCount = Math.ceil(memories.length / memoriesPerPage)
  const activePage = Math.floor(active / memoriesPerPage)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/community-memories', { signal: controller.signal }).then(readResponse).then((data) => {
      setMemories(data.memories || [])
    }).catch((error) => {
      if (error.name !== 'AbortError') setMessage(error.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  async function selectImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage('')
    try { setDraft(await prepareImage(file)) } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  async function publish(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const data = await fetch('/api/community-memories', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: draft, caption }),
      }).then(readResponse)
      setMemories((items) => [data.memory, ...items].slice(0, 24))
      setActive(0)
      setDraft('')
      setCaption('')
      setMessage('Kỷ niệm của bạn đã được chia sẻ.')
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  function move(direction) {
    setActive((index) => (index + direction + memories.length) % memories.length)
  }

  function goToPage(page) {
    setActive(page * memoriesPerPage)
  }

  const thumbnailItems = memories.length
    ? Array.from({ length: Math.max(8, memories.length) }, (_, position) => ({
        memory: memories[position % memories.length],
        index: position % memories.length,
      }))
    : Array.from({ length: 8 }, (_, index) => ({ memory: null, index }))

  const renderThumbnailGroup = (isDuplicate = false) => (
    <div className="memory-thumbnail-group" aria-hidden={isDuplicate || undefined}>
      {thumbnailItems.map(({ memory, index }, position) => memory ? (
        <button
          key={`${isDuplicate ? 'duplicate' : 'primary'}-${position}-${memory.id}`}
          type="button"
          className={`memory-thumbnail ${active === index ? 'is-active' : ''}`}
          aria-label={`Xem kỷ niệm của ${memory.authorName || 'một người bạn'}, ${index + 1}`}
          aria-pressed={active === index}
          disabled={Boolean(draft)}
          tabIndex={isDuplicate ? -1 : undefined}
          onClick={() => setActive(index)}
        >
          <img src={memory.image} alt="" loading="lazy" />
        </button>
      ) : <div className="memory-thumbnail" key={`${isDuplicate ? 'duplicate' : 'primary'}-${position}`} aria-hidden="true" />)}
    </div>
  )

  return (
    <section className="community-memories" aria-labelledby="community-memories-title">
      <div className="memory-inner">
        <svg className="memory-frame" aria-hidden="true">
          <rect width="100%" height="100%" rx="28" ry="28" />
        </svg>
        <button className="memory-upload" type="button" disabled={busy} onClick={() => {
          if (!user) { setMessage('Bạn đăng nhập để chia sẻ kỷ niệm nha.'); return }
          fileRef.current?.click()
        }}><span aria-hidden="true">＋</span> Up hình</button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={selectImage} />
        <h2 id="community-memories-title">Góc kỷ niệm</h2>
        <div className="memory-board">
          <div className="memory-feature">
            <figure className={`memory-photo ${!draft && !selected ? 'is-empty' : ''}`}>
              {draft || selected ? <img src={draft || selected.image} alt={draft ? 'Ảnh kỷ niệm đang chuẩn bị chia sẻ' : selected.caption || 'Ảnh kỷ niệm của cộng đồng'} /> : <div className="memory-photo-empty"><img src={assetUrl('PNG/may-anh.png')} alt="" /><span>Một tấm hình,<br />một kỷ niệm thương.</span></div>}
              {selected && !draft ? <figcaption>{selected.authorName || 'Một người bạn'}</figcaption> : null}
            </figure>
            <div className="memory-story">
              <p className="memory-date">{draft ? 'Một kỷ niệm mới của bạn' : selected ? `Kỷ niệm ngày ${new Date(selected.createdAt).toLocaleDateString('vi-VN')}` : 'Kỷ niệm của tụi mình'}<br />{draft ? 'Viết vài dòng để nhớ về hôm ấy nha.' : 'của tụi mình nè mấy bạn.'}</p>
              {draft ? <form className="memory-note memory-form" onSubmit={publish}>
                <label htmlFor="memory-caption">Lời nhắn cho kỷ niệm này</label>
                <textarea id="memory-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={900} placeholder="Hôm ấy có điều gì làm bạn nhớ mãi?" disabled={busy} />
                <div><button type="button" disabled={busy} onClick={() => { setDraft(''); setCaption('') }}>Hủy</button><button type="submit" disabled={busy}>{busy ? 'Đang đăng…' : 'Chia sẻ kỷ niệm'}</button></div>
              </form> : <div className="memory-note">{selected ? <p>{selected.caption}</p> : <p className="memory-empty-note">{loading ? 'Đang mở album kỷ niệm…' : 'Góc nhỏ chờ những khoảnh khắc của bạn.\nChia sẻ tấm hình đầu tiên nha!'}</p>}</div>}
            </div>
          </div>
          <div className="memory-carousel" aria-label="Album kỷ niệm">
            <button className="memory-arrow" type="button" aria-label="Kỷ niệm trước" disabled={memories.length < 2 || Boolean(draft)} onClick={() => move(-1)}>←</button>
            <div className="memory-thumbnails">
              <div className="memory-thumbnail-track">
                {renderThumbnailGroup()}
                {renderThumbnailGroup(true)}
              </div>
            </div>
            <button className="memory-arrow" type="button" aria-label="Kỷ niệm sau" disabled={memories.length < 2 || Boolean(draft)} onClick={() => move(1)}>→</button>
          </div>
          {pageCount > 1 ? <nav className="memory-pagination" aria-label="Chuyển trang album kỷ niệm">
            {Array.from({ length: pageCount }, (_, page) => <button
              key={page}
              type="button"
              className={activePage === page ? 'is-active' : ''}
              aria-label={`Trang ${page + 1}`}
              aria-current={activePage === page ? 'page' : undefined}
              disabled={Boolean(draft)}
              onClick={() => goToPage(page)}
            >{page + 1}</button>)}
          </nav> : null}
        </div>
        <p className="memory-status" role="status">{message}</p>
      </div>
    </section>
  )
}
