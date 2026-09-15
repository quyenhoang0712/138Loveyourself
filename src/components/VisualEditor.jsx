import { useEffect, useRef, useState } from 'react'

const elements = [
  { id: 'heading', label: 'Tiêu đề', fields: ['x', 'y'] },
  { id: 'subtitle', label: 'Mô tả', fields: ['x', 'y'] },
  { id: 'letters', label: 'Cụm 4 lá thư', fields: ['x', 'y', 'scale'] },
  { id: 'decoration', label: 'Cụm line + mascot', fields: ['x', 'y'] },
  { id: 'mascot', label: 'Mascot riêng', fields: ['x', 'y', 'width'] },
]
const viewports = {
  desktop: { label: 'Desktop', width: 1280, height: 820 },
  tablet: { label: 'Tablet', width: 820, height: 900 },
  mobile: { label: 'Mobile', width: 390, height: 780 },
}

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`)
  return data
}

export function VisualEditor() {
  const [config, setConfig] = useState(null)
  const [breakpoint, setBreakpoint] = useState('desktop')
  const [selected, setSelected] = useState('mascot')
  const [status, setStatus] = useState('Đang tải cấu hình…')
  const [busy, setBusy] = useState(false)
  const iframeRef = useRef(null)
  const selectedElement = elements.find((element) => element.id === selected)

  useEffect(() => {
    fetch('/api/developer/visual/card-room', { credentials: 'include' }).then(readJson).then((data) => {
      setConfig(data.draft)
      setStatus('Draft đã sẵn sàng.')
    }).catch((error) => setStatus(error.message))
  }, [])

  useEffect(() => {
    if (!config || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'visual-editor-config', config }, window.location.origin)
  }, [config, breakpoint])

  function attachPreviewSelection() {
    const frame = iframeRef.current
    if (!frame) return
    const attach = () => {
      const document = frame.contentDocument
      if (!document) return
      document.querySelectorAll('[data-visual-id]').forEach((node) => {
        node.style.pointerEvents = 'auto'
        node.onclick = (event) => {
          event.preventDefault()
          event.stopPropagation()
          document.querySelectorAll('[data-visual-id]').forEach((item) => item.classList.remove('is-visual-editor-selected'))
          node.classList.add('is-visual-editor-selected')
          setSelected(node.dataset.visualId)
        }
      })
      frame.contentWindow.postMessage({ type: 'visual-editor-config', config }, window.location.origin)
    }
    window.setTimeout(attach, 700)
  }

  function updateElement(field, value) {
    const number = field === 'scale' ? Number(value) : Math.round(Number(value))
    if (!Number.isFinite(number)) return
    setConfig((current) => ({ ...current, [breakpoint]: { ...current[breakpoint], [selected]: { ...current[breakpoint][selected], [field]: number } } }))
    setStatus('Có thay đổi chưa lưu.')
  }

  function nudge(axis, amount) {
    updateElement(axis, (config?.[breakpoint]?.[selected]?.[axis] || 0) + amount)
  }

  async function saveDraft() {
    setBusy(true)
    try {
      const data = await fetch('/api/developer/visual/card-room/draft', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }) }).then(readJson)
      setConfig(data.draft)
      setStatus('Đã lưu draft vào MongoDB.')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  async function publish() {
    setBusy(true)
    try {
      await fetch('/api/developer/visual/card-room/draft', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }) }).then(readJson)
      const data = await fetch('/api/developer/visual/card-room/publish', { method: 'POST', credentials: 'include' }).then(readJson)
      setConfig(data.published)
      setStatus('Đã publish lên website.')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  async function resetDraft() {
    setBusy(true)
    try {
      const data = await fetch('/api/developer/visual/card-room/reset', { method: 'POST', credentials: 'include' }).then(readJson)
      setConfig(data.draft)
      setStatus('Đã khôi phục draft về bản đang publish.')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  if (!config) return <section className="developer-section visual-editor" id="dev-visual"><header><span>06</span><div><h2>Visual Editor</h2><p>{status}</p></div></header></section>
  const values = config[breakpoint][selected]
  const viewport = viewports[breakpoint]

  return <section className="developer-section visual-editor" id="dev-visual">
    <header><span>06</span><div><h2>Visual Editor · Phòng thông điệp</h2><p>Click trực tiếp một phần tử trong preview, sau đó chỉnh vị trí theo breakpoint.</p></div></header>
    <div className="visual-editor-toolbar">
      <div>{Object.entries(viewports).map(([key, item]) => <button className={breakpoint === key ? 'is-active' : ''} type="button" key={key} onClick={() => setBreakpoint(key)}>{item.label}</button>)}</div>
      <span>{viewport.width} × {viewport.height}</span>
      <button type="button" disabled={busy} onClick={resetDraft}>Reset draft</button>
      <button type="button" disabled={busy} onClick={saveDraft}>Save draft</button>
      <button className="is-publish" type="button" disabled={busy} onClick={publish}>Publish</button>
    </div>
    <div className="visual-editor-workspace">
      <div className="visual-editor-canvas"><iframe ref={iframeRef} title="Card room visual preview" src="/?editorPreview=1#card-room" style={{ width: viewport.width, height: viewport.height }} onLoad={attachPreviewSelection} /></div>
      <aside className="visual-editor-inspector">
        <label>Phần tử<select value={selected} onChange={(event) => setSelected(event.target.value)}>{elements.map((element) => <option value={element.id} key={element.id}>{element.label}</option>)}</select></label>
        {(selected === 'heading' || selected === 'subtitle') ? <label>Nội dung<textarea value={selected === 'heading' ? config.content.title : config.content.subtitle} onChange={(event) => setConfig((current) => ({ ...current, content: { ...current.content, [selected === 'heading' ? 'title' : 'subtitle']: event.target.value } }))} /></label> : null}
        <div className="visual-nudge"><span>Di chuyển</span><button type="button" onClick={() => nudge('y', -1)}>↑ 1</button><button type="button" onClick={() => nudge('y', 1)}>↓ 1</button><button type="button" onClick={() => nudge('x', -1)}>← 1</button><button type="button" onClick={() => nudge('x', 1)}>→ 1</button><button type="button" onClick={() => nudge('y', -10)}>↑ 10</button><button type="button" onClick={() => nudge('y', 10)}>↓ 10</button><button type="button" onClick={() => nudge('x', -10)}>← 10</button><button type="button" onClick={() => nudge('x', 10)}>→ 10</button></div>
        {selectedElement.fields.map((field) => <label key={field}>{field.toUpperCase()}<input type="number" step={field === 'scale' ? .05 : 1} value={values[field]} onChange={(event) => updateElement(field, event.target.value)} /></label>)}
        <p className="visual-editor-status">{status}</p>
      </aside>
    </div>
  </section>
}
