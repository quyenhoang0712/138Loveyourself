import { useEffect, useRef, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { ProfileRoomScene } from '../components/ProfileRoomScene'
import { ProfileCalendar } from '../components/ProfileCalendar'
import { ProfileFocusPopup } from '../components/ProfileFocusPopup'
import { ProfileDiarySection } from '../components/ProfileDiarySection'
import { ProfileTasksPopup } from '../components/ProfileTasksPopup'

export function UserProfileReport({ onHomeNavigate }) {
  const [user, setUser] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [activeRoomPopup, setActiveRoomPopup] = useState(null)
  const roomPopupRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const editorRef = useRef(null)
  const [today, setToday] = useState(() => new Date())
  const [todayTasks, setTodayTasks] = useState(null)
  const [taskRevision, setTaskRevision] = useState(0)
  const [popupData, setPopupData] = useState(null)
  const [popupError, setPopupError] = useState('')
  const [popupLoading, setPopupLoading] = useState(false)
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const lampLit = Boolean(user && todayTasks?.userId === user.id && todayTasks?.date === dateKey && todayTasks.quoteOpened && todayTasks.meltedCubes >= 4 && todayTasks.diaryWritten)

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user) return undefined
    const controller = new AbortController()
    fetch(`/api/analytics/daily-tasks?date=${dateKey}&timezoneOffset=${new Date().getTimezoneOffset()}`, { credentials: 'include', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Không tải được nhiệm vụ')
        const data = await response.json()
        if (!controller.signal.aborted) setTodayTasks({ ...data, userId: user.id, date: dateKey })
      })
      .catch(() => { if (!controller.signal.aborted) setTodayTasks(null) })
    return () => controller.abort()
  }, [user, dateKey, taskRevision, activeRoomPopup])

  useEffect(() => {
    if (!activeRoomPopup || !user) return undefined
    const controller = new AbortController()
    const url = activeRoomPopup === 'focus' ? `/api/analytics/focus-total?date=${dateKey}&timezoneOffset=${new Date().getTimezoneOffset()}`
      : activeRoomPopup === 'calendar' ? '/api/auth/me' : `/api/analytics/daily-tasks?date=${dateKey}&timezoneOffset=${new Date().getTimezoneOffset()}`
    fetch(url, { credentials: 'include', signal: controller.signal })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error('Chưa tải được dữ liệu. Bạn đóng rồi mở lại nhé.')
        if (!controller.signal.aborted) setPopupData(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setPopupError(error.message === 'Failed to fetch' ? 'Không kết nối được máy chủ.' : error.message)
      })
      .finally(() => { if (!controller.signal.aborted) setPopupLoading(false) })
    return () => controller.abort()
  }, [activeRoomPopup, user, dateKey, taskRevision])

  const openRoomPopup = (name) => {
    setPopupData(null)
    setPopupError('')
    setPopupLoading(Boolean(user))
    setActiveRoomPopup(name)
    roomPopupRef.current.showModal()
  }

  const closeOnBackdrop = (event) => {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      event.currentTarget.close()
    }
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setIsSaving(true)
    setSaveError('')
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.get('name'), age: Number(form.get('age')), gender: form.get('gender') }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Chưa lưu được thông tin.')
      setUser(data.user)
      window.dispatchEvent(new CustomEvent('love-yourself-auth-changed', { detail: { user: data.user } }))
      editorRef.current.close()
    } catch (error) {
      setSaveError(error.message === 'Failed to fetch' ? 'Không kết nối được máy chủ. Bạn thử lại nhé.' : error.message)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()

    const handleAuthChanged = (event) => {
      ignore = true
      controller.abort()
      setUser(event.detail?.user || null)
      setIsLoadingUser(false)
    }

    window.addEventListener('love-yourself-auth-changed', handleAuthChanged)

    fetch('/api/auth/me', { credentials: 'include', signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setUser(data.user || null)
      })
      .catch((error) => {
        if (!ignore && error.name !== 'AbortError') setUser(null)
      })
      .finally(() => {
        if (!ignore) setIsLoadingUser(false)
      })

    return () => {
      ignore = true
      controller.abort()
      window.removeEventListener('love-yourself-auth-changed', handleAuthChanged)
    }
  }, [])

  return (
    <section className="profile-report" aria-label="Phòng cá nhân" aria-busy={isLoadingUser}>
      <div className="profile-hero-bar">
        <SiteHeader variant="static" onHomeNavigate={onHomeNavigate} />
      </div>

      <div className="profile-room-content profile-illustrated-content">
        <ProfileRoomScene
          user={user}
          isLoadingUser={isLoadingUser}
          today={today}
          lampLit={lampLit}
          onEditProfile={() => { setSaveError(''); editorRef.current.showModal() }}
          onOpenPopup={openRoomPopup}
        />
      </div>

      <ProfileDiarySection user={user} onSaved={() => setTaskRevision((value) => value + 1)} />

      <dialog className={`profile-room-editor profile-room-detail-popup ${activeRoomPopup === 'calendar' ? 'is-calendar' : activeRoomPopup === 'focus' ? 'is-focus' : activeRoomPopup === 'lamp' ? 'is-tasks' : ''}`} ref={roomPopupRef} onClose={(event) => { if (!event.currentTarget.open) setActiveRoomPopup(null) }} onClick={closeOnBackdrop} aria-labelledby="profile-room-popup-title">
        {activeRoomPopup === 'calendar' ? (
          <ProfileCalendar user={popupData?.user || user} loading={popupLoading} error={popupError} onClose={() => roomPopupRef.current.close()} />
        ) : activeRoomPopup === 'focus' ? (
          <ProfileFocusPopup user={user} loading={popupLoading} error={popupError} seconds={popupData?.totalFocusSeconds} onClose={() => roomPopupRef.current.close()} />
        ) : activeRoomPopup === 'lamp' ? (
          <ProfileTasksPopup user={user} loading={popupLoading} error={popupError} tasks={popupData} onClose={() => roomPopupRef.current.close()} />
        ) : null}
      </dialog>

      <dialog className="profile-room-editor" onClick={closeOnBackdrop} ref={editorRef} aria-labelledby="profile-editor-title">
        {user ? <form onSubmit={handleProfileSave} key={user.updatedAt || user.name}>
          <h2 id="profile-editor-title">Thông tin cá nhân</h2>
          <label>Tên hiển thị<input name="name" defaultValue={user.name} required minLength={2} /></label>
          <label>Tuổi<input name="age" type="number" defaultValue={user.age || ''} required min={1} max={120} /></label>
          <label>Giới tính<select name="gender" defaultValue={user.gender || ''} required>
            <option value="" disabled>Chọn giới tính</option>
            <option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option>
          </select></label>
          {saveError ? <p role="alert">{saveError}</p> : null}
          <div><button type="button" onClick={() => editorRef.current.close()}>Đóng</button><button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div>
        </form> : null}
      </dialog>
    </section>
  )
}
