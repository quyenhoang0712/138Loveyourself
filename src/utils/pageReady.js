const defaultReadyTimeout = 8000

function wait(delay) {
  return new Promise((resolve) => window.setTimeout(resolve, delay))
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))
  })
}

function hasPendingContent(root) {
  return Array.from(root.querySelectorAll('[aria-busy="true"], [data-page-loading="true"]')).some(
    (element) => !element.closest('.page-transition-skeleton'),
  )
}

async function waitForPendingContent(root, deadline) {
  while (hasPendingContent(root) && performance.now() < deadline) {
    await wait(50)
  }
}

function waitForImage(image, deadline) {
  const waitForLoad = image.complete
    ? Promise.resolve()
    : new Promise((resolve) => {
      const finish = () => {
        window.clearTimeout(timeoutId)
        image.removeEventListener('load', finish)
        image.removeEventListener('error', finish)
        resolve()
      }
      const timeoutId = window.setTimeout(finish, Math.max(0, deadline - performance.now()))

      image.addEventListener('load', finish, { once: true })
      image.addEventListener('error', finish, { once: true })
    })

  return waitForLoad.then(() => {
    if (!image.naturalWidth || typeof image.decode !== 'function') return undefined
    return Promise.race([
      image.decode().catch(() => undefined),
      wait(Math.max(0, deadline - performance.now())),
    ])
  })
}

export async function waitForPageContentReady(root, timeout = defaultReadyTimeout) {
  if (!root) return

  const deadline = performance.now() + timeout
  const fontsReady = document.fonts?.ready || Promise.resolve()

  await Promise.race([
    Promise.allSettled([fontsReady, waitForPendingContent(root, deadline)]),
    wait(timeout),
  ])

  const images = Array.from(root.querySelectorAll('img')).filter(
    (image) => !image.closest('.page-transition-skeleton'),
  )
  await Promise.allSettled(images.map((image) => waitForImage(image, deadline)))
  await waitForNextPaint()
}
