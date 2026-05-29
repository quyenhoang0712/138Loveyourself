function drawRoundRect(context, x, y, width, height, radius) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function wrapCanvasText(context, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (context.measureText(nextLine).width <= maxWidth || !currentLine) {
      currentLine = nextLine
      return
    }

    lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) lines.push(currentLine)
  return lines
}

function fitCanvasQuote(context, text, maxWidth, maxHeight, initialFontSize) {
  let fontSize = initialFontSize
  let lines = []
  let lineHeight = 0

  while (fontSize >= 26) {
    context.font = `800 ${fontSize}px Sora, Inter, Arial, sans-serif`
    lines = wrapCanvasText(context, text, maxWidth)
    lineHeight = fontSize * 1.18

    if (lines.length * lineHeight <= maxHeight) break
    fontSize -= 4
  }

  return { lines, lineHeight, fontSize }
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function drawCoverImage(context, image, width, height) {
  const imageRatio = image.width / image.height
  const canvasRatio = width / height
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width
  const drawX = (width - drawWidth) / 2
  const drawY = (height - drawHeight) / 2

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

export function getShareQuoteFontSize(text) {
  if (text.length > 190) return 'clamp(0.7rem, 1.7vw, 0.92rem)'
  if (text.length > 140) return 'clamp(0.78rem, 1.9vw, 1.08rem)'
  if (text.length > 95) return 'clamp(0.88rem, 2.25vw, 1.28rem)'
  if (text.length > 58) return 'clamp(0.98rem, 2.65vw, 1.5rem)'

  return 'clamp(1.08rem, 3.1vw, 1.75rem)'
}

export async function createShareImageBlob({ activeShareFrame, quote, shareTextColor }) {
  if (document.fonts?.load) {
    await document.fonts.load('800 50px Sora')
  }

  const canvas = document.createElement('canvas')
  const scale = 1
  const width = 1080
  const height = 1920
  canvas.width = width * scale
  canvas.height = height * scale

  const context = canvas.getContext('2d')
  context.scale(scale, scale)

  context.fillStyle = activeShareFrame.background
  drawRoundRect(context, 0, 0, width, height, 54)
  context.fill()

  if (activeShareFrame.imageUrl) {
    const frameImage = await loadCanvasImage(activeShareFrame.imageUrl)
    context.fillStyle = activeShareFrame.background
    context.fillRect(0, 0, width, height)
    drawCoverImage(context, frameImage, width, height)
  }

  context.fillStyle = shareTextColor
  context.textAlign = 'center'
  const quoteMaxWidth = activeShareFrame.imageUrl ? 780 : 720
  const quoteMaxHeight = activeShareFrame.imageUrl ? 620 : 720
  const { lines: quoteLines, lineHeight } = fitCanvasQuote(context, quote, quoteMaxWidth, quoteMaxHeight, 50)
  const quoteStartY = 960 - ((quoteLines.length - 1) * lineHeight) / 2
  quoteLines.forEach((line, index) => {
    context.fillText(line, width / 2, quoteStartY + index * lineHeight)
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('Canvas export failed'))
    }, 'image/png')
  })
}
