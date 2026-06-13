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

function createTintedCanvas(image, color) {
  const tintedCanvas = document.createElement('canvas')
  tintedCanvas.width = image.width
  tintedCanvas.height = image.height

  const tintedContext = tintedCanvas.getContext('2d')
  tintedContext.drawImage(image, 0, 0)
  tintedContext.globalCompositeOperation = 'source-in'
  tintedContext.fillStyle = color
  tintedContext.fillRect(0, 0, tintedCanvas.width, tintedCanvas.height)

  return tintedCanvas
}

function drawRotatedImage(context, image, x, y, width, rotationDegrees, flipped = false, color = null) {
  const drawableImage = color ? createTintedCanvas(image, color) : image
  const height = width * (image.height / image.width)

  context.save()
  context.translate(x + width / 2, y + height / 2)
  context.rotate((rotationDegrees * Math.PI) / 180)
  context.scale(flipped ? -1 : 1, 1)
  context.drawImage(drawableImage, -width / 2, -height / 2, width, height)
  context.restore()
}

async function drawSharePreviewStickers(context, stickers, canvasWidth, canvasHeight) {
  if (!stickers.length) return

  const stickerImages = await Promise.all(
    stickers.map(async (sticker) => ({
      ...sticker,
      image: await loadCanvasImage(sticker.src),
    })),
  )

  context.save()
  context.shadowColor = 'rgba(71, 137, 200, 0.16)'
  context.shadowBlur = 24
  context.shadowOffsetY = 16
  stickerImages.forEach((sticker) => {
    const stickerWidth = (sticker.size / 100) * canvasWidth
    const stickerHeight = stickerWidth * (sticker.image.height / sticker.image.width)
    const x = (sticker.x / 100) * canvasWidth - stickerWidth / 2
    const y = (sticker.y / 100) * canvasHeight - stickerHeight / 2

    drawRotatedImage(context, sticker.image, x, y, stickerWidth, sticker.rotation, sticker.flipped, sticker.color)
  })
  context.restore()
}

export function getShareQuoteFontSize(text) {
  if (text.length > 190) return 'clamp(0.7rem, 1.7vw, 0.92rem)'
  if (text.length > 140) return 'clamp(0.78rem, 1.9vw, 1.08rem)'
  if (text.length > 95) return 'clamp(0.88rem, 2.25vw, 1.28rem)'
  if (text.length > 58) return 'clamp(0.98rem, 2.65vw, 1.5rem)'

  return 'clamp(1.08rem, 3.1vw, 1.75rem)'
}

export async function createShareImageBlob({ activeShareFrame, placedShareStickers = [], quote, shareTextColor }) {
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
  } else {
    const glowGradient = context.createRadialGradient(width / 2, 850, 40, width / 2, 850, 520)
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.52)')
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    context.fillStyle = glowGradient
    drawRoundRect(context, 0, 0, width, height, 54)
    context.fill()

    context.save()
    context.strokeStyle = 'rgba(71, 137, 200, 0.2)'
    context.lineWidth = 4
    context.setLineDash([18, 14])
    drawRoundRect(context, 48, 48, width - 96, height - 96, 42)
    context.stroke()
    context.restore()
  }

  await drawSharePreviewStickers(context, placedShareStickers, width, height)

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
