import { useEffect, useRef, useState } from 'react'
import { AnalyticsReport } from '../sections/AnalyticsReport'
import './AdminPage.css'

function todayKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {})
  return `${parts.year}-${parts.month}-${parts.day}`
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Chưa xử lý được yêu cầu.')
  return data
}

async function optimizeImage(file, slot) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    throw new Error('Chọn ảnh JPG, PNG hoặc WebP dưới 10 MB.')
  }
  const bitmap = await createImageBitmap(file)
  const width = slot === 1 ? 960 : 720
  const height = slot === 1 ? 560 : 960
  const sourceRatio = bitmap.width / bitmap.height
  const targetRatio = width / height
  const sourceWidth = sourceRatio > targetRatio ? bitmap.height * targetRatio : bitmap.width
  const sourceHeight = sourceRatio > targetRatio ? bitmap.height : bitmap.width / targetRatio
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, (bitmap.width - sourceWidth) / 2, (bitmap.height - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, width, height)
  bitmap.close()
  for (const quality of [0.72, 0.62, 0.52, 0.42]) {
    const image = canvas.toDataURL('image/jpeg', quality)
    if (image.length <= 300000) return image
  }
  throw new Error('Ảnh còn quá lớn, hãy chọn ảnh khác.')
}

function DailyImages() {
  const [date, setDate] = useState(todayKey)
  const [images, setImages] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(true)
  const inputRef = useRef(null)
  const slotRef = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/community-memories?date=${date}`, { credentials: 'include', signal: controller.signal })
      .then(readJson).then((data) => setImages(data.featuredImages || []))
      .catch((error) => { if (error.name !== 'AbortError') setMessage(error.message) })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [date])

  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      const slot = slotRef.current
      const image = await optimizeImage(file, slot)
      const data = await fetch(`/api/community-memories/featured/${slot}`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, image }),
      }).then(readJson)
      setImages(data.featuredImages || [])
      setMessage(`Đã lưu ảnh ${slot + 1} cho ngày ${date}.`)
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }

  return <section className="admin-daily-images" id="admin-images">
    <div className="admin-section-heading"><div><h2>Ảnh nổi bật theo ngày</h2><p>Chọn ngày và cập nhật hai ảnh hiển thị tại Góc kỷ niệm.</p></div><input type="date" value={date} onChange={(event) => { setBusy(true); setMessage(''); setDate(event.target.value) }} /></div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
    <div className="admin-image-grid">{[0, 1].map((slot) => <article className={slot === 0 ? 'is-portrait' : 'is-landscape'} key={slot}>
      <div className="admin-image-format"><strong>Ảnh {slot + 1}</strong><span>{slot === 0 ? 'Ảnh đứng · 720 × 960 · JPG' : 'Ảnh ngang · 960 × 560 · JPG'}</span></div>
      <div className="admin-image-preview">
        {images[slot] ? <img src={images[slot]} alt={`Ảnh nổi bật ${slot + 1} ngày ${date}`} /> : <span>Chưa có ảnh {slot + 1}</span>}
      </div>
      <button type="button" disabled={busy} onClick={() => { slotRef.current = slot; inputRef.current?.click() }}>{images[slot] ? 'Thay ảnh' : 'Thêm ảnh'}</button>
    </article>)}</div>
    <p className="admin-image-status" role="status">{busy ? 'Đang xử lý…' : message}</p>
  </section>
}

export function AdminPage() {
  const [user, setUser] = useState(undefined)
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' }).then(readJson).then((data) => setUser(data.user || null)).catch(() => setUser(null))
  }, [])
  if (user === undefined) return <main className="admin-page"><p>Đang kiểm tra tài khoản…</p></main>
  if (user?.role !== 'admin') return <main className="admin-page admin-access"><h1>Khu vực quản trị</h1><p>Bạn cần đăng nhập bằng tài khoản admin.</p><a href="/auth?returnTo=/admin">Đăng nhập admin</a></main>
  return <main className="admin-page">
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand"><img src="/logo.svg" alt="LOVE YOURSELF 138knitwear" /></div>
      <div className="admin-sidebar-user"><span>Quản trị viên</span><h1>{user.name}</h1><p>{user.email}</p></div>
      <nav aria-label="Điều hướng trang quản trị">
        <a href="#admin-overview"><span>01</span>Tổng quan</a>
        <a href="#admin-users"><span>02</span>Người dùng</a>
        <a href="#admin-activity"><span>03</span>Hoạt động</a>
        <a href="#admin-images"><span>04</span>Ảnh theo ngày</a>
      </nav>
      <a className="admin-sidebar-home" href="/">← Về trang chính</a>
    </aside>
    <div className="admin-content">
      <header className="admin-content-header"><div><span>ADMIN DASHBOARD</span><h2>Trang quản trị</h2></div><p>Dữ liệu hệ thống và nội dung kỷ niệm</p></header>
      <AnalyticsReport embeddedUser={user} />
      <DailyImages />
    </div>
  </main>
}
