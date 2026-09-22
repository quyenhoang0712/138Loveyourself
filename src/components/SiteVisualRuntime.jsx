import { useEffect, useRef } from 'react'

const styleElementId = 'site-visual-overrides'

function getBreakpoint() {
  if (window.innerWidth <= 760) return 'mobile'
  if (window.innerWidth <= 1100) return 'tablet'
  return 'desktop'
}

function getActivePage() {
  const pageRoot = document.querySelector('[data-visual-page]')
  if (pageRoot?.dataset.visualPage) return pageRoot.dataset.visualPage
  if (window.location.pathname === '/') return window.location.hash.replace('#', '') || 'home'
  return window.location.pathname.replace(/^\//, '') || 'home'
}

function getDirectTextNode(element, index) {
  const nodes = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)
  return nodes[index] || null
}

function cssForElement(item) {
  const styles = item.styles || {}
  const declarations = [
    `translate:${Number(styles.x) || 0}px ${Number(styles.y) || 0}px!important`,
    `scale:${Number(styles.scale) || 1}!important`,
    `rotate:${Number(styles.rotate) || 0}deg!important`,
    `opacity:${Number.isFinite(Number(styles.opacity)) ? Number(styles.opacity) : 1}!important`,
  ]
  if (Number(styles.width) > 0) declarations.push(`width:${Number(styles.width)}px!important`)
  if (Number(styles.height) > 0) declarations.push(`height:${Number(styles.height)}px!important`)
  if (Number(styles.fontSize) > 0) declarations.push(`font-size:${Number(styles.fontSize)}px!important`)
  if (Number(styles.padding) > 0) declarations.push(`padding:${Number(styles.padding)}px!important`)
  if (Number(styles.borderRadius) > 0) declarations.push(`border-radius:${Number(styles.borderRadius)}px!important`)
  if (styles.color) declarations.push(`color:${styles.color}!important`)
  if (styles.backgroundColor) declarations.push(`background-color:${styles.backgroundColor}!important`)
  return `${item.selector}{${declarations.join(';')}}`
}

export function SiteVisualRuntime() {
  const configRef = useRef(null)
  const observerRef = useRef(null)
  const animationFrameRef = useRef(0)
  const textOriginalsRef = useRef(new Map())

  useEffect(() => {
    let disposed = false

    function restoreTextOverrides() {
      for (const [target, original] of textOriginalsRef.current) {
        if (!target.isConnected) continue
        if (original.mode === 'element') target.textContent = original.text
        else {
          const node = getDirectTextNode(target, original.index)
          if (node) node.textContent = original.text
        }
      }
      textOriginalsRef.current.clear()
    }

    function applyConfig() {
      window.cancelAnimationFrame(animationFrameRef.current)
      observerRef.current?.disconnect()
      restoreTextOverrides()

      const styleElement = document.getElementById(styleElementId) || document.head.appendChild(Object.assign(document.createElement('style'), { id: styleElementId }))
      const page = getActivePage()
      const breakpoint = getBreakpoint()
      const elements = configRef.current?.pages?.[page]?.[breakpoint] || []
      styleElement.textContent = elements.map(cssForElement).join('\n')

      for (const item of elements) {
        if (typeof item.text !== 'string' || !item.textMode) continue
        let targets
        try { targets = [...document.querySelectorAll(item.selector)] } catch { continue }
        for (const target of targets) {
          if (item.textMode === 'element') {
            textOriginalsRef.current.set(target, { mode: 'element', text: target.textContent })
            target.textContent = item.text
          } else {
            const node = getDirectTextNode(target, item.textNodeIndex || 0)
            if (!node) continue
            textOriginalsRef.current.set(target, { mode: 'direct', index: item.textNodeIndex || 0, text: node.textContent })
            node.textContent = item.text
          }
        }
      }

      observerRef.current?.observe(document.body, { childList: true, characterData: true, subtree: true })
    }

    function scheduleApply() {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = window.requestAnimationFrame(applyConfig)
    }

    observerRef.current = new MutationObserver(scheduleApply)
    observerRef.current.observe(document.body, { childList: true, characterData: true, subtree: true })

    const controller = new AbortController()
    fetch('/api/developer/visual/site/published', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (disposed || !data?.config) return
        configRef.current = data.config
        scheduleApply()
      })
      .catch(() => {})

    const handleEditorConfig = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'visual-editor-site-config') return
      configRef.current = event.data.config
      scheduleApply()
    }
    const handleResize = () => scheduleApply()
    window.addEventListener('message', handleEditorConfig)
    window.addEventListener('resize', handleResize)
    window.addEventListener('hashchange', handleResize)

    return () => {
      disposed = true
      controller.abort()
      observerRef.current?.disconnect()
      window.cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener('message', handleEditorConfig)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('hashchange', handleResize)
      restoreTextOverrides()
      document.getElementById(styleElementId)?.remove()
    }
  }, [])

  return null
}
