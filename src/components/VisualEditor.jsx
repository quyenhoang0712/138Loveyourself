import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const pages = {
  home: { label: 'Trang chủ', url: '/?editorPreview=1' },
  community: { label: 'Phòng cộng đồng', url: '/?editorPreview=1#community' },
  'card-room': { label: 'Phòng thông điệp', url: '/?editorPreview=1#card-room' },
  'focus-room': { label: 'Phòng tập trung', url: '/?editorPreview=1#focus-room' },
  'healing-room': { label: 'Phòng thư giãn', url: '/?editorPreview=1#healing-room' },
  'sound-room': { label: 'Phòng âm nhạc', url: '/?editorPreview=1#sound-room' },
  'play-room': { label: 'Phòng trò chơi', url: '/?editorPreview=1#play-room' },
  profile: { label: 'Phòng cá nhân', url: '/?editorPreview=1#profile' },
  analytics: { label: 'Báo cáo', url: '/?editorPreview=1#analytics' },
}

const viewports = {
  desktop: { label: 'Desktop', width: 1280, height: 820 },
  tablet: { label: 'Tablet', width: 820, height: 900 },
  mobile: { label: 'Mobile', width: 390, height: 780 },
}

const defaultStyles = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  scale: 1,
  rotate: 0,
  opacity: 1,
  fontSize: 0,
  padding: 0,
  borderRadius: 0,
  color: '',
  backgroundColor: '',
}

const numberFields = [
  { key: 'x', label: 'Vị trí X', step: 1, hint: 'px' },
  { key: 'y', label: 'Vị trí Y', step: 1, hint: 'px' },
  { key: 'width', label: 'Chiều rộng', step: 1, hint: 'px · 0 = gốc' },
  { key: 'height', label: 'Chiều cao', step: 1, hint: 'px · 0 = gốc' },
  { key: 'scale', label: 'Tỉ lệ', step: .05, hint: '0.1 – 3' },
  { key: 'rotate', label: 'Xoay', step: 1, hint: 'độ' },
  { key: 'opacity', label: 'Độ trong suốt', step: .05, hint: '0 – 1' },
  { key: 'fontSize', label: 'Cỡ chữ', step: 1, hint: 'px · 0 = gốc' },
  { key: 'padding', label: 'Khoảng đệm', step: 1, hint: 'px · 0 = gốc' },
  { key: 'borderRadius', label: 'Bo góc', step: 1, hint: 'px · 0 = gốc' },
]

async function readJson(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`)
  return data
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value)
  return String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`)
}

function elementSegment(element) {
  const tag = element.tagName.toLowerCase()
  const stableClasses = [...element.classList]
    .filter((name) => !/^(?:is-|has-|scroll-pop|active|open|selected)/.test(name))
    .slice(0, 3)
    .map((name) => `.${cssEscape(name)}`)
    .join('')
  const siblings = element.parentElement
    ? [...element.parentElement.children].filter((item) => item.tagName === element.tagName)
    : []
  const position = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(element) + 1})` : ''
  return `${tag}${stableClasses}${position}`
}

function buildSelector(element, pageKey, document) {
  if (element.id && document.querySelectorAll(`#${cssEscape(element.id)}`).length === 1) return `#${cssEscape(element.id)}`
  const root = document.querySelector(`[data-visual-page="${pageKey}"]`)
  if (!root || !root.contains(element) || element === root) return ''
  const segments = []
  let current = element
  while (current && current !== root) {
    segments.unshift(elementSegment(current))
    current = current.parentElement
  }
  return `[data-visual-page="${pageKey}"] > ${segments.join(' > ')}`
}

function getDirectTextNodes(element) {
  return [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)
}

function getTextInfo(element) {
  if (!element || ['INPUT', 'TEXTAREA', 'SELECT', 'IMG', 'VIDEO', 'CANVAS', 'SVG'].includes(element.tagName)) return null
  if (element.childElementCount === 0) {
    const value = element.textContent.trim()
    return value ? { mode: 'element', index: 0, value } : null
  }
  const directNodes = getDirectTextNodes(element)
  const index = directNodes.findIndex((node) => node.textContent.trim())
  if (index >= 0) return { mode: 'direct', index, value: directNodes[index].textContent.trim() }
  return null
}

function elementLabel(element) {
  const accessibleName = element.getAttribute('aria-label') || element.getAttribute('title') || ''
  const text = accessibleName || element.textContent?.replace(/\s+/g, ' ').trim() || ''
  const name = text.slice(0, 64) || element.classList[0] || element.tagName.toLowerCase()
  return `${element.tagName.toLowerCase()} · ${name}`
}

function getElements(config, page, breakpoint) {
  return config?.pages?.[page]?.[breakpoint] || []
}

function replaceElements(config, page, breakpoint, elements) {
  return {
    ...config,
    pages: {
      ...config.pages,
      [page]: {
        desktop: config.pages?.[page]?.desktop || [],
        tablet: config.pages?.[page]?.tablet || [],
        mobile: config.pages?.[page]?.mobile || [],
        [breakpoint]: elements,
      },
    },
  }
}

export function VisualEditor() {
  const [config, setConfig] = useState(null)
  const [pageKey, setPageKey] = useState('home')
  const [breakpoint, setBreakpoint] = useState('desktop')
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('Đang tải cấu hình…')
  const [busy, setBusy] = useState(false)
  const [editingEnabled, setEditingEnabled] = useState(true)
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const iframeRef = useRef(null)
  const previewCleanupRef = useRef(null)
  const selectedElementRef = useRef(null)
  const configRef = useRef(null)
  const editingEnabledRef = useRef(true)

  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { editingEnabledRef.current = editingEnabled }, [editingEnabled])

  useEffect(() => {
    fetch('/api/developer/visual/site', { credentials: 'include' }).then(readJson).then((data) => {
      setConfig(data.draft)
      configRef.current = data.draft
      setStatus('Draft toàn website đã sẵn sàng.')
    }).catch((error) => setStatus(error.message))
  }, [])

  useEffect(() => {
    if (!config || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage({ type: 'visual-editor-site-config', config }, window.location.origin)
  }, [config, breakpoint, pageKey])

  const commitConfig = useCallback((updater, message = 'Có thay đổi chưa lưu.') => {
    const previous = configRef.current
    if (!previous) return
    const next = updater(previous)
    if (!next || next === previous) return
    configRef.current = next
    setConfig(next)
    setUndoStack((items) => [...items, previous].slice(-60))
    setRedoStack([])
    setStatus(message)
  }, [])

  const selectElement = useCallback((element) => {
    const frameDocument = iframeRef.current?.contentDocument
    if (!frameDocument || !element) return
    const selector = buildSelector(element, pageKey, frameDocument)
    if (!selector) return
    frameDocument.querySelectorAll('[data-visual-editor-selected]').forEach((item) => item.removeAttribute('data-visual-editor-selected'))
    element.setAttribute('data-visual-editor-selected', '')
    selectedElementRef.current = element
    setSelected({ selector, label: elementLabel(element), tag: element.tagName.toLowerCase(), textInfo: getTextInfo(element) })
    setStatus('Đã chọn phần tử. Kéo trực tiếp hoặc chỉnh trong bảng bên phải.')
  }, [pageKey])

  const attachPreviewEditor = useCallback(() => {
    previewCleanupRef.current?.()
    const frame = iframeRef.current
    const document = frame?.contentDocument
    const frameWindow = frame?.contentWindow
    if (!document || !frameWindow) return

    const helperStyle = document.createElement('style')
    helperStyle.dataset.visualEditorHelper = 'true'
    helperStyle.textContent = `
      [data-visual-editor-hover]{outline:2px dashed #68b8e8!important;outline-offset:3px!important;cursor:grab!important}
      [data-visual-editor-selected]{outline:3px solid #61d095!important;outline-offset:4px!important;cursor:grab!important}
      [data-visual-editor-dragging]{cursor:grabbing!important}
    `
    document.head.appendChild(helperStyle)

    let hovered = null
    let drag = null
    let dragged = false

    const resolveTarget = (event) => {
      let target = event.target
      if (!(target instanceof frameWindow.Element)) return null
      if (target.closest('svg') && target.tagName.toLowerCase() !== 'svg') target = target.closest('svg')
      const root = document.querySelector(`[data-visual-page="${pageKey}"]`)
      if (!root?.contains(target) || target === root || ['HTML', 'BODY'].includes(target.tagName)) return null
      return target
    }

    const handlePointerOver = (event) => {
      if (!editingEnabledRef.current) return
      const target = resolveTarget(event)
      if (!target || target === selectedElementRef.current) return
      hovered?.removeAttribute('data-visual-editor-hover')
      hovered = target
      hovered.setAttribute('data-visual-editor-hover', '')
    }
    const handlePointerOut = () => {
      hovered?.removeAttribute('data-visual-editor-hover')
      hovered = null
    }
    const handleClick = (event) => {
      if (!editingEnabledRef.current) return
      event.preventDefault()
      event.stopPropagation()
      if (dragged) { dragged = false; return }
      const target = resolveTarget(event)
      if (target) selectElement(target)
    }
    const handleSubmit = (event) => {
      if (!editingEnabledRef.current) return
      event.preventDefault()
      event.stopPropagation()
    }
    const handlePointerDown = (event) => {
      if (!editingEnabledRef.current || event.button !== 0) return
      const target = resolveTarget(event)
      if (!target) return
      dragged = false
      selectElement(target)
      const selector = buildSelector(target, pageKey, document)
      const existing = getElements(configRef.current, pageKey, breakpoint).find((item) => item.selector === selector)
      drag = {
        target,
        selector,
        label: elementLabel(target),
        startX: event.clientX,
        startY: event.clientY,
        x: existing?.styles?.x || 0,
        y: existing?.styles?.y || 0,
      }
    }
    const handlePointerMove = (event) => {
      if (!drag) return
      const deltaX = Math.round(event.clientX - drag.startX)
      const deltaY = Math.round(event.clientY - drag.startY)
      if (!dragged && Math.hypot(deltaX, deltaY) < 3) return
      dragged = true
      event.preventDefault()
      drag.target.setAttribute('data-visual-editor-dragging', '')
      drag.target.style.setProperty('translate', `${drag.x + deltaX}px ${drag.y + deltaY}px`, 'important')
    }
    const handlePointerUp = (event) => {
      if (!drag) return
      const currentDrag = drag
      drag = null
      currentDrag.target.removeAttribute('data-visual-editor-dragging')
      if (!dragged) return
      const x = currentDrag.x + Math.round(event.clientX - currentDrag.startX)
      const y = currentDrag.y + Math.round(event.clientY - currentDrag.startY)
      commitConfig((current) => {
        const elements = getElements(current, pageKey, breakpoint)
        const index = elements.findIndex((item) => item.selector === currentDrag.selector)
        const item = index >= 0 ? elements[index] : { selector: currentDrag.selector, label: currentDrag.label, styles: { ...defaultStyles } }
        const nextItem = { ...item, styles: { ...defaultStyles, ...item.styles, x, y } }
        return replaceElements(current, pageKey, breakpoint, index >= 0 ? elements.map((entry, itemIndex) => itemIndex === index ? nextItem : entry) : [...elements, nextItem])
      }, `Đã kéo tới X ${x}, Y ${y}. Chưa lưu.`)
      window.setTimeout(() => currentDrag.target.style.removeProperty('translate'))
    }

    document.addEventListener('pointerover', handlePointerOver, true)
    document.addEventListener('pointerout', handlePointerOut, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('submit', handleSubmit, true)
    document.addEventListener('pointerdown', handlePointerDown, true)
    frameWindow.addEventListener('pointermove', handlePointerMove, true)
    frameWindow.addEventListener('pointerup', handlePointerUp, true)

    previewCleanupRef.current = () => {
      helperStyle.remove()
      document.removeEventListener('pointerover', handlePointerOver, true)
      document.removeEventListener('pointerout', handlePointerOut, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('submit', handleSubmit, true)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      frameWindow.removeEventListener('pointermove', handlePointerMove, true)
      frameWindow.removeEventListener('pointerup', handlePointerUp, true)
    }
    frameWindow.postMessage({ type: 'visual-editor-site-config', config: configRef.current }, window.location.origin)
  }, [breakpoint, commitConfig, pageKey, selectElement])

  useEffect(() => () => previewCleanupRef.current?.(), [])

  const currentElements = useMemo(() => getElements(config, pageKey, breakpoint), [breakpoint, config, pageKey])
  const currentItem = selected ? currentElements.find((item) => item.selector === selected.selector) : null
  const values = { ...defaultStyles, ...(currentItem?.styles || {}) }

  function updateSelected(mutator, message) {
    if (!selected) return
    commitConfig((current) => {
      const elements = getElements(current, pageKey, breakpoint)
      const index = elements.findIndex((item) => item.selector === selected.selector)
      const item = index >= 0 ? elements[index] : { selector: selected.selector, label: selected.label, styles: { ...defaultStyles } }
      const nextItem = mutator({ ...item, styles: { ...defaultStyles, ...item.styles } })
      return replaceElements(current, pageKey, breakpoint, index >= 0 ? elements.map((entry, itemIndex) => itemIndex === index ? nextItem : entry) : [...elements, nextItem])
    }, message)
  }

  function updateStyle(field, value) {
    const number = Number(value)
    if (!Number.isFinite(number)) return
    updateSelected((item) => ({ ...item, styles: { ...item.styles, [field]: number } }), `Đã sửa ${field}. Chưa lưu.`)
  }

  function updateColor(field, value) {
    updateSelected((item) => ({ ...item, styles: { ...item.styles, [field]: value } }), `Đã sửa ${field}. Chưa lưu.`)
  }

  function updateText(value) {
    if (!selected?.textInfo) return
    updateSelected((item) => ({ ...item, text: value, textMode: selected.textInfo.mode, textNodeIndex: selected.textInfo.index }), 'Đã sửa nội dung chữ. Chưa lưu.')
  }

  function nudge(axis, amount) {
    updateStyle(axis, values[axis] + amount)
  }

  function resetSelected() {
    if (!selected || !currentItem) return
    commitConfig((current) => replaceElements(current, pageKey, breakpoint, getElements(current, pageKey, breakpoint).filter((item) => item.selector !== selected.selector)), 'Đã trả phần tử về CSS gốc. Chưa lưu.')
  }

  function resetPage() {
    commitConfig((current) => replaceElements(current, pageKey, breakpoint, []), `Đã đặt lại ${pages[pageKey].label} trên ${viewports[breakpoint].label}. Chưa lưu.`)
    setSelected(null)
    selectedElementRef.current = null
  }

  function undo() {
    const previous = undoStack.at(-1)
    if (!previous) return
    setUndoStack((items) => items.slice(0, -1))
    setRedoStack((items) => [...items, configRef.current].slice(-60))
    configRef.current = previous
    setConfig(previous)
    setStatus('Đã hoàn tác thay đổi gần nhất.')
  }

  function redo() {
    const next = redoStack.at(-1)
    if (!next) return
    setRedoStack((items) => items.slice(0, -1))
    setUndoStack((items) => [...items, configRef.current].slice(-60))
    configRef.current = next
    setConfig(next)
    setStatus('Đã làm lại thay đổi.')
  }

  function selectRelative(direction) {
    const element = selectedElementRef.current
    const root = iframeRef.current?.contentDocument?.querySelector(`[data-visual-page="${pageKey}"]`)
    if (!element || !root) return
    const target = direction === 'parent'
      ? (element.parentElement !== root ? element.parentElement : null)
      : [...element.children].find((child) => child.getBoundingClientRect().width && child.getBoundingClientRect().height)
    if (target) selectElement(target)
  }

  function selectSavedElement(selector) {
    const document = iframeRef.current?.contentDocument
    if (!document) return
    try {
      const element = document.querySelector(selector)
      if (element) selectElement(element)
      else setStatus('Phần tử này chưa xuất hiện trong preview hiện tại.')
    } catch { setStatus('Selector của phần tử không còn hợp lệ.') }
  }

  function changePage(nextPage) {
    selectedElementRef.current = null
    setSelected(null)
    setPageKey(nextPage)
  }

  function changeBreakpoint(nextBreakpoint) {
    selectedElementRef.current = null
    setSelected(null)
    setBreakpoint(nextBreakpoint)
  }

  async function saveDraft() {
    setBusy(true)
    try {
      const data = await fetch('/api/developer/visual/site/draft', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }) }).then(readJson)
      setConfig(data.draft)
      configRef.current = data.draft
      setUndoStack([])
      setRedoStack([])
      setStatus('Đã lưu draft toàn website vào MongoDB.')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  async function publish() {
    setBusy(true)
    try {
      await fetch('/api/developer/visual/site/draft', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }) }).then(readJson)
      const data = await fetch('/api/developer/visual/site/publish', { method: 'POST', credentials: 'include' }).then(readJson)
      setConfig(data.published)
      configRef.current = data.published
      setUndoStack([])
      setRedoStack([])
      setStatus('Đã publish giao diện lên website.')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  async function resetDraft() {
    setBusy(true)
    try {
      const data = await fetch('/api/developer/visual/site/reset', { method: 'POST', credentials: 'include' }).then(readJson)
      setConfig(data.draft)
      configRef.current = data.draft
      setUndoStack([])
      setRedoStack([])
      setSelected(null)
      setStatus('Đã khôi phục toàn bộ draft về bản đang publish.')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  if (!config) return <section className="developer-section visual-editor" id="dev-visual"><header><span>06</span><div><h2>Visual Editor</h2><p>{status}</p></div></header></section>
  const viewport = viewports[breakpoint]
  const textValue = typeof currentItem?.text === 'string' ? currentItem.text : selected?.textInfo?.value || ''

  return <section className="developer-section visual-editor" id="dev-visual">
    <header><span>06</span><div><h2>Visual Editor · Toàn website</h2><p>Chọn màn hình, bấm một phần tử trong preview rồi kéo hoặc chỉnh chính xác ở bảng thuộc tính.</p></div></header>

    <div className="visual-editor-primary-toolbar">
      <label>Màn hình<select value={pageKey} onChange={(event) => changePage(event.target.value)}>{Object.entries(pages).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select></label>
      <div className="visual-editor-breakpoints">{Object.entries(viewports).map(([key, item]) => <button className={breakpoint === key ? 'is-active' : ''} type="button" key={key} onClick={() => changeBreakpoint(key)}>{item.label}</button>)}</div>
      <span>{viewport.width} × {viewport.height}</span>
      <button className={editingEnabled ? 'is-active' : ''} type="button" onClick={() => setEditingEnabled((value) => !value)}>{editingEnabled ? 'Đang chỉnh sửa' : 'Đang thử tương tác'}</button>
    </div>

    <div className="visual-editor-toolbar">
      <div><button type="button" disabled={!undoStack.length || busy} onClick={undo}>↶ Hoàn tác</button><button type="button" disabled={!redoStack.length || busy} onClick={redo}>↷ Làm lại</button></div>
      <span>{currentElements.length} phần tử đã chỉnh · {pages[pageKey].label} / {viewport.label}</span>
      <button type="button" disabled={busy} onClick={resetDraft}>Khôi phục draft</button>
      <button type="button" disabled={busy} onClick={saveDraft}>Lưu draft</button>
      <button className="is-publish" type="button" disabled={busy} onClick={publish}>Publish</button>
    </div>

    <div className="visual-editor-workspace">
      <div className="visual-editor-canvas">
        <div className="visual-editor-frame-label"><strong>{pages[pageKey].label}</strong><span>Cuộn trong khung để tới phần cần sửa</span></div>
        <iframe key={`${pageKey}-${breakpoint}`} ref={iframeRef} title={`${pages[pageKey].label} visual preview`} src={pages[pageKey].url} style={{ width: viewport.width, height: viewport.height }} onLoad={() => window.setTimeout(attachPreviewEditor, 900)} />
      </div>

      <aside className="visual-editor-inspector">
        <div className="visual-editor-inspector-heading"><strong>Thuộc tính phần tử</strong><small>{selected ? selected.label : 'Chưa chọn phần tử'}</small></div>

        {currentElements.length ? <label>Phần đã chỉnh<select value={currentItem?.selector || ''} onChange={(event) => selectSavedElement(event.target.value)}><option value="">Chọn nhanh…</option>{currentElements.map((item) => <option value={item.selector} key={item.selector}>{item.label}</option>)}</select></label> : null}

        {!selected ? <div className="visual-editor-empty"><strong>Bấm trực tiếp vào giao diện</strong><p>Viền xanh lá là phần đang chọn. Giữ và kéo để đổi vị trí. Chuyển sang “thử tương tác” nếu cần mở popup hoặc chuyển trạng thái.</p></div> : <>
          <div className="visual-editor-selection-actions"><button type="button" onClick={() => selectRelative('parent')}>Chọn phần cha</button><button type="button" onClick={() => selectRelative('child')}>Chọn phần con</button></div>
          <code className="visual-editor-selector">{selected.selector}</code>

          {selected.textInfo ? <label>Nội dung chữ<textarea value={textValue} maxLength="1200" onChange={(event) => updateText(event.target.value)} /><small>Sửa chữ an toàn, không chèn HTML hoặc mã chạy.</small></label> : <p className="visual-editor-hint">Phần này không có một vùng chữ đơn. Hãy bấm chính xác vào dòng chữ hoặc chọn phần con.</p>}

          <fieldset className="visual-editor-fieldset"><legend>Vị trí nhanh</legend><div className="visual-nudge"><button type="button" onClick={() => nudge('x', -10)}>← 10</button><button type="button" onClick={() => nudge('y', -10)}>↑ 10</button><button type="button" onClick={() => nudge('y', 10)}>↓ 10</button><button type="button" onClick={() => nudge('x', 10)}>→ 10</button><button type="button" onClick={() => nudge('x', -1)}>← 1</button><button type="button" onClick={() => nudge('y', -1)}>↑ 1</button><button type="button" onClick={() => nudge('y', 1)}>↓ 1</button><button type="button" onClick={() => nudge('x', 1)}>→ 1</button></div></fieldset>

          <fieldset className="visual-editor-fieldset"><legend>Kích thước & trình bày</legend><div className="visual-editor-number-grid">{numberFields.map((field) => <label key={field.key}>{field.label}<span><input type="number" step={field.step} value={values[field.key]} onChange={(event) => updateStyle(field.key, event.target.value)} /><small>{field.hint}</small></span></label>)}</div></fieldset>

          <fieldset className="visual-editor-fieldset"><legend>Màu sắc</legend><label>Màu chữ<input type="text" value={values.color} placeholder="#478dc9 hoặc để trống" onChange={(event) => updateColor('color', event.target.value)} /></label><label>Màu nền<input type="text" value={values.backgroundColor} placeholder="#eee7d4 hoặc để trống" onChange={(event) => updateColor('backgroundColor', event.target.value)} /></label></fieldset>

          <button className="visual-editor-reset-element" type="button" disabled={!currentItem} onClick={resetSelected}>Đặt lại riêng phần tử này</button>
        </>}

        <button className="visual-editor-reset-page" type="button" disabled={!currentElements.length} onClick={resetPage}>Đặt lại màn hình/breakpoint này</button>
        <p className="visual-editor-status">{status}</p>
      </aside>
    </div>
  </section>
}
