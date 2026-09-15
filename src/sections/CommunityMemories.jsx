import { useEffect, useRef, useState } from 'react'
import { assetUrl } from '../utils/assets'
import './CommunityMemories.css'

const vietnamOffset = 7 * 60 * 60 * 1000
const memoryPhotoWidth = 720
const memoryPhotoHeight = 960
const memoryNoteWidth = 960
const memoryNoteHeight = 560
const maximumEncodedImageLength = 300000

function getVietnamDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
}

function millisecondsUntilVietnamTomorrow(date = new Date()) {
  const localDate = new Date(date.getTime() + vietnamOffset)
  const tomorrow = Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate() + 1) - vietnamOffset
  return Math.max(1000, tomorrow - date.getTime() + 100)
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getCropBackgroundScale(source, zoom, targetWidth, targetHeight) {
  const imageRatio = source.width / source.height
  const targetRatio = targetWidth / targetHeight
  return imageRatio > targetRatio
    ? { width: zoom * imageRatio / targetRatio, height: zoom }
    : { width: zoom, height: zoom * targetRatio / imageRatio }
}

async function readResponse(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Chưa kết nối được góc kỷ niệm. Bạn thử lại sau nha.')
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Chưa tải được kỷ niệm. Bạn thử lại nha.')
  return data
}

function validateImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('Bạn chọn ảnh JPG, PNG hoặc WebP dưới 10 MB nha.')
}

async function cropImage(file, crop, targetWidth = memoryPhotoWidth, targetHeight = memoryPhotoHeight) {
  const bitmap = await createImageBitmap(file)
  const imageRatio = bitmap.width / bitmap.height
  const targetRatio = targetWidth / targetHeight
  const baseWidth = imageRatio > targetRatio ? bitmap.height * targetRatio : bitmap.width
  const baseHeight = imageRatio > targetRatio ? bitmap.height : bitmap.width / targetRatio
  const sourceWidth = baseWidth / crop.zoom
  const sourceHeight = baseHeight / crop.zoom
  const sourceX = (bitmap.width - sourceWidth) * crop.x / 100
  const sourceY = (bitmap.height - sourceHeight) * crop.y / 100
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')
  context.fillStyle = '#eee7d4'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)
  bitmap.close()
  return encodeCanvas(canvas)
}

function encodeCanvas(canvas) {
  for (const quality of [0.76, 0.68, 0.6, 0.52, 0.44]) {
    const image = canvas.toDataURL('image/jpeg', quality)
    if (image.length <= maximumEncodedImageLength) return image
  }
  throw new Error('Ảnh còn hơi lớn, bạn chọn ảnh nhỏ hơn nha.')
}

export function CommunityMemories({ user }) {
  const memoriesPerPage = 4
  const [memories, setMemories] = useState([])
  const [featuredImages, setFeaturedImages] = useState([])
  const [active, setActive] = useState(0)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [caption, setCaption] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dateLabel, setDateLabel] = useState(() => getVietnamDateLabel())
  const [cropSource, setCropSource] = useState(null)
  const [uploadTarget, setUploadTarget] = useState({ type: 'memory', slot: null })
  const [crop, setCrop] = useState({ zoom: 1, x: 50, y: 50 })
  const fileRef = useRef(null)
  const cropDragRef = useRef(null)
  const pageCount = Math.ceil(memories.length / memoriesPerPage)
  const activePage = Math.floor(active / memoriesPerPage)
  const selectedMemory = memories[active]

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDateLabel(getVietnamDateLabel())
      setLoading(true)
    }, millisecondsUntilVietnamTomorrow())
    return () => window.clearTimeout(timeout)
  }, [dateLabel])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/community-memories', { cache: 'no-store', signal: controller.signal }).then(readResponse).then((data) => {
      setMemories(data.memories || [])
      setFeaturedImages(data.featuredImages || [])
      setActive(0)
      if (data.dateLabel) setDateLabel(data.dateLabel)
    }).catch((error) => {
      if (error.name !== 'AbortError') setMessage(error.message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [dateLabel])

  useEffect(() => () => {
    if (cropSource?.url) URL.revokeObjectURL(cropSource.url)
  }, [cropSource])

  useEffect(() => {
    if (!cropSource) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busy) setCropSource(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [busy, cropSource])

  useEffect(() => {
    if (!isViewerOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsViewerOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isViewerOpen])

  async function selectImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      validateImage(file)
      const bitmap = await createImageBitmap(file)
      const source = { file, url: URL.createObjectURL(file), width: bitmap.width, height: bitmap.height }
      bitmap.close()
      setCrop({ zoom: 1, x: 50, y: 50 })
      setCropSource(source)
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  function closeCropper() {
    setCropSource(null)
  }

  async function confirmCrop() {
    if (!cropSource || busy) return
    setBusy(true)
    setMessage('')
    try {
      const isNoteSlot = uploadTarget.type === 'featured' && uploadTarget.slot === 1
      const croppedImage = await cropImage(
        cropSource.file,
        crop,
        isNoteSlot ? memoryNoteWidth : memoryPhotoWidth,
        isNoteSlot ? memoryNoteHeight : memoryPhotoHeight,
      )
      if (uploadTarget.type === 'featured') {
        const data = await fetch(`/api/community-memories/featured/${uploadTarget.slot}`, {
          method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: croppedImage }),
        }).then(readResponse)
        setFeaturedImages(data.featuredImages || [])
        setMessage(`Đã cập nhật ảnh nổi bật ${uploadTarget.slot + 1} của hôm nay.`)
      } else {
        setDraft(croppedImage)
      }
      closeCropper()
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  function startCropDrag(event) {
    event.currentTarget.setPointerCapture(event.pointerId)
    cropDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCropX: crop.x,
      startCropY: crop.y,
    }
  }

  function moveCropImage(event) {
    const drag = cropDragRef.current
    if (!drag || drag.pointerId !== event.pointerId || !cropSource) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const isNoteSlot = uploadTarget.type === 'featured' && uploadTarget.slot === 1
    const scale = getCropBackgroundScale(
      cropSource,
      crop.zoom,
      isNoteSlot ? memoryNoteWidth : memoryPhotoWidth,
      isNoteSlot ? memoryNoteHeight : memoryPhotoHeight,
    )
    const overflowX = bounds.width * (scale.width - 1)
    const overflowY = bounds.height * (scale.height - 1)
    setCrop((value) => ({
      ...value,
      x: overflowX > 0 ? clamp(drag.startCropX - (event.clientX - drag.startClientX) / overflowX * 100, 0, 100) : 50,
      y: overflowY > 0 ? clamp(drag.startCropY - (event.clientY - drag.startClientY) / overflowY * 100, 0, 100) : 50,
    }))
  }

  function stopCropDrag(event) {
    if (cropDragRef.current?.pointerId !== event.pointerId) return
    cropDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
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

  const cropWidth = uploadTarget.type === 'featured' && uploadTarget.slot === 1 ? memoryNoteWidth : memoryPhotoWidth
  const cropHeight = uploadTarget.type === 'featured' && uploadTarget.slot === 1 ? memoryNoteHeight : memoryPhotoHeight
  const cropBackgroundScale = cropSource ? getCropBackgroundScale(cropSource, crop.zoom, cropWidth, cropHeight) : { width: 1, height: 1 }
  const cropBackgroundSize = `${cropBackgroundScale.width * 100}% ${cropBackgroundScale.height * 100}%`

  const thumbnailItems = memories.length
    ? Array.from({ length: Math.max(8, memories.length) }, (_, position) => ({
        memory: memories[position % memories.length],
        index: position % memories.length,
      }))
    : Array.from({ length: 6 }, (_, index) => ({ memory: null, index }))

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
          onClick={() => {
            setActive(index)
            setIsViewerOpen(true)
          }}
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
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={selectImage} />
        <h2 id="community-memories-title">Góc kỷ niệm</h2>
        <div className="memory-board">
          <div className="memory-feature">
            <p className="memory-date">Kỷ niệm ngày {dateLabel}<br />của tụi mình nè mấy bạn.</p>
            <figure className={`memory-photo ${!featuredImages[0] ? 'is-empty' : ''}`}>
              {user?.role === 'admin' ? <button className="memory-upload" type="button" disabled={busy} onClick={() => {
                setUploadTarget({ type: 'featured', slot: 0 })
                fileRef.current?.click()
              }}><span aria-hidden="true">＋</span> {featuredImages[0] ? 'Thay ảnh' : 'Up hình'}</button> : null}
              {featuredImages[0] ? <img src={featuredImages[0]} alt="Ảnh nổi bật đầu tiên của hôm nay" /> : <div className="memory-photo-empty"><img src={assetUrl('PNG/may-anh.png')} alt="" /><span>Một tấm hình,<br />một kỷ niệm thương.</span></div>}
            </figure>
            <div className={`memory-note memory-feature-note ${!featuredImages[1] ? 'is-empty' : ''}`}>
              {user?.role === 'admin' ? <button className="memory-upload" type="button" disabled={busy} onClick={() => {
                setUploadTarget({ type: 'featured', slot: 1 })
                fileRef.current?.click()
              }}><span aria-hidden="true">＋</span> {featuredImages[1] ? 'Thay ảnh' : 'Up hình'}</button> : null}
              {featuredImages[1] ? <img src={featuredImages[1]} alt="Ảnh nổi bật thứ hai của hôm nay" /> : <p className="memory-empty-note">{loading ? 'Đang mở góc kỷ niệm…' : 'Ảnh nổi bật thứ hai đang chờ admin đăng.'}</p>}
            </div>
          </div>
          <div className="memory-album-heading">
            <span>Album kỷ niệm hôm nay</span>
            <button type="button" disabled={busy} onClick={() => {
              if (!user) {
                window.location.assign('/auth?returnTo=%2F%23community')
                return
              }
              setUploadTarget({ type: 'memory', slot: null })
              fileRef.current?.click()
            }}><span aria-hidden="true">＋</span> Chia sẻ ảnh</button>
          </div>
          {draft ? <form className="memory-note memory-form memory-album-form" onSubmit={publish}>
            <img src={draft} alt="Ảnh đang chuẩn bị chia sẻ" />
            <label htmlFor="memory-caption">Lời nhắn cho kỷ niệm này</label>
            <textarea id="memory-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={900} placeholder="Hôm ấy có điều gì làm bạn nhớ mãi?" disabled={busy} />
            <div><button type="button" disabled={busy} onClick={() => { setDraft(''); setCaption('') }}>Hủy</button><button type="submit" disabled={busy}>{busy ? 'Đang đăng…' : 'Chia sẻ kỷ niệm'}</button></div>
          </form> : null}
          <div className={`memory-carousel ${memories.length ? 'has-memories' : 'is-empty'}`} aria-label="Album kỷ niệm">
            {memories.length > 1 ? <button className="memory-arrow" type="button" aria-label="Kỷ niệm trước" disabled={Boolean(draft)} onClick={() => move(-1)}>←</button> : null}
            <div className="memory-thumbnails">
              <div className="memory-thumbnail-track">
                {renderThumbnailGroup()}
                {memories.length ? renderThumbnailGroup(true) : null}
              </div>
            </div>
            {memories.length > 1 ? <button className="memory-arrow" type="button" aria-label="Kỷ niệm sau" disabled={Boolean(draft)} onClick={() => move(1)}>→</button> : null}
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
      {cropSource ? <div className="memory-crop-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeCropper()
      }}>
        <div className="memory-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="memory-crop-title">
          <div className="memory-crop-heading">
            <div><h3 id="memory-crop-title">{uploadTarget.type === 'featured' ? `Cắt ảnh nổi bật ${uploadTarget.slot + 1}` : 'Cắt ảnh kỷ niệm'}</h3><p>Ảnh gốc: {cropSource.width} × {cropSource.height} px</p></div>
            <button type="button" aria-label="Đóng" disabled={busy} onClick={closeCropper}>×</button>
          </div>
          <div
            className="memory-crop-preview"
            role="img"
            aria-label="Bản xem trước phần ảnh sẽ được giữ lại"
            onPointerDown={startCropDrag}
            onPointerMove={moveCropImage}
            onPointerUp={stopCropDrag}
            onPointerCancel={stopCropDrag}
            style={{
              aspectRatio: `${cropWidth} / ${cropHeight}`,
              backgroundImage: `url(${cropSource.url})`,
              backgroundPosition: `${crop.x}% ${crop.y}%`,
              backgroundSize: cropBackgroundSize,
            }}
          >
            <div className="memory-crop-guide" aria-hidden="true">
              <span>Khung ảnh đăng · {cropWidth}:{cropHeight}</span>
            </div>
          </div>
          <p className="memory-crop-hint">Giữ và kéo ảnh để căn phần muốn đăng vào trong khung.</p>
          <p>Phần nằm trong ô crop sẽ được tối ưu thành ảnh {cropWidth} × {cropHeight} px.</p>
          <div className="memory-crop-actions"><button type="button" disabled={busy} onClick={() => { closeCropper(); fileRef.current?.click() }}>Chọn ảnh khác</button><button type="button" disabled={busy} onClick={confirmCrop}>{busy ? 'Đang xử lý…' : 'Dùng ảnh này'}</button></div>
        </div>
      </div> : null}
      {isViewerOpen && selectedMemory ? <div className="memory-viewer-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsViewerOpen(false)
      }}>
        <article className="memory-viewer" role="dialog" aria-modal="true" aria-labelledby="memory-viewer-title">
          <header>
            <div>
              <span>Kỷ niệm của</span>
              <h3 id="memory-viewer-title">{selectedMemory.authorName || 'Một người bạn'}</h3>
            </div>
            <button type="button" aria-label="Đóng ảnh chi tiết" onClick={() => setIsViewerOpen(false)}>×</button>
          </header>
          <img src={selectedMemory.image} alt={selectedMemory.caption || `Kỷ niệm của ${selectedMemory.authorName || 'một người bạn'}`} />
          {selectedMemory.caption ? <p>{selectedMemory.caption}</p> : <p className="memory-viewer-empty">Một khoảnh khắc được chia sẻ trong hôm nay.</p>}
          {memories.length > 1 ? <nav aria-label="Chuyển ảnh chi tiết">
            <button type="button" onClick={() => move(-1)}>← Ảnh trước</button>
            <span>{active + 1}/{memories.length}</span>
            <button type="button" onClick={() => move(1)}>Ảnh sau →</button>
          </nav> : null}
        </article>
      </div> : null}
    </section>
  )
}
