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

const sharePreviewStickerImages = [
  { rotation: -8, src: '/PNG/mascot-cam-loa.png', width: 365, x: 625, y: 1545 },
  { rotation: 7, src: '/PNG/messenger.png', width: 220, x: 790, y: 175 },
  { rotation: -9, src: '/PNG/note.png', width: 280, x: 105, y: 1540 },
  { rotation: -7, src: '/PNG/may-anh.png', width: 255, x: 105, y: 210 },
  { rotation: 9, src: '/PNG/tay-trai-tim.png', width: 250, x: 735, y: 550 },
  { rotation: -12, src: '/PNG/hoa-ly.png', width: 245, x: 55, y: 615 },
  { rotation: 13, src: '/PNG/ngoi-sao.png', width: 175, x: 845, y: 870 },
  { rotation: 7, src: '/PNG/radio.png', width: 225, x: 70, y: 980 },
  { rotation: -11, src: '/PNG/headphone.png', width: 250, x: 795, y: 1160 },
  { rotation: -13, src: '/PNG/thu-tay.png', width: 195, x: 100, y: 115 },
  { rotation: 4, src: '/PNG/have-a-nice-day.png', width: 300, x: 330, y: 1745 },
  { rotation: -5, src: '/PNG/ipod.png', width: 190, x: 500, y: 130 },
]

function drawCoverImage(context, image, width, height) {
  const imageRatio = image.width / image.height
  const canvasRatio = width / height
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width
  const drawX = (width - drawWidth) / 2
  const drawY = (height - drawHeight) / 2

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function drawRotatedImage(context, image, x, y, width, rotationDegrees) {
  const height = width * (image.height / image.width)

  context.save()
  context.translate(x + width / 2, y + height / 2)
  context.rotate((rotationDegrees * Math.PI) / 180)
  context.drawImage(image, -width / 2, -height / 2, width, height)
  context.restore()
}

function drawStickerConnectorLines(context, color) {
  context.save()
  context.strokeStyle = color
  context.globalAlpha = 0.34
  context.lineWidth = 4
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.setLineDash([18, 24])

  context.beginPath()
  context.moveTo(210, 260)
  context.bezierCurveTo(340, 145, 520, 170, 620, 300)
  context.bezierCurveTo(720, 420, 850, 390, 900, 260)

  context.moveTo(190, 560)
  context.bezierCurveTo(80, 740, 100, 910, 250, 1030)
  context.bezierCurveTo(370, 1125, 330, 1380, 185, 1560)

  context.moveTo(820, 560)
  context.bezierCurveTo(980, 720, 970, 920, 825, 1070)
  context.bezierCurveTo(720, 1185, 770, 1420, 945, 1585)

  context.moveTo(260, 1580)
  context.bezierCurveTo(410, 1760, 620, 1720, 720, 1585)
  context.bezierCurveTo(805, 1480, 930, 1540, 960, 1690)
  context.stroke()
  context.restore()
}

async function drawSharePreviewStickers(context, lineColor) {
  const stickerImages = await Promise.all(
    sharePreviewStickerImages.map(async (sticker) => ({
      ...sticker,
      image: await loadCanvasImage(sticker.src),
    })),
  )

  drawStickerConnectorLines(context, lineColor)

  context.save()
  context.shadowColor = 'rgba(71, 137, 200, 0.16)'
  context.shadowBlur = 24
  context.shadowOffsetY = 16
  stickerImages.forEach((sticker) => {
    drawRotatedImage(context, sticker.image, sticker.x, sticker.y, sticker.width, sticker.rotation)
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

    await drawSharePreviewStickers(context, shareTextColor)
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
