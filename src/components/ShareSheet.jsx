import { useEffect, useRef, useState } from 'react'
import { CloseIcon, CopyIcon, DownloadIcon, FlipIcon, ResetIcon, RotateIcon, ShareIcon, UndoIcon } from './icons'
import { assetUrl } from '../utils/assets'

const shareStickerOptions = [
  { alt: 'Hộp', src: assetUrl('PNG/hop.png') },
  { alt: 'Cửa sổ', src: assetUrl('PNG/cua-so.png') },
  { alt: 'Xe đạp 3', src: assetUrl('PNG/xe-dap-3.png') },
  { alt: 'Xe đạp 2', src: assetUrl('PNG/xe-dap-2.png') },
  { alt: 'Xe đạp 1', src: assetUrl('PNG/xe-dap-1.png') },
  { alt: 'Áo khăn len', src: assetUrl('PNG/ao-khan-len.png') },
  { alt: 'Bánh có tờ giấy', src: assetUrl('PNG/banh-co-to-giay.png') },
  { alt: 'Xe đạp 4', src: assetUrl('PNG/xe-dap-4.png') },
  { alt: 'Vòng xoay', src: assetUrl('PNG/vong-xoay.png') },
  { alt: 'Giày 2', src: assetUrl('PNG/giay-2.png') },
  { alt: 'Sofa 3', src: assetUrl('PNG/sofa-3.png') },
  { alt: 'Sofa 2', src: assetUrl('PNG/sofa-2.png') },
  { alt: 'Giày 3', src: assetUrl('PNG/giay-3.png') },
  { alt: 'Ly bút', src: assetUrl('PNG/ly-but.png') },
  { alt: 'Tai nghe', src: assetUrl('PNG/headphone.png') },
  { alt: 'Mascot khiên đỏ', src: assetUrl('PNG/mascot-khien-do.png') },
  { alt: 'Gối', src: assetUrl('PNG/goi.png') },
  { alt: 'Bó hoa', src: assetUrl('PNG/bo-hoa.png') },
  { alt: 'Hộp tim', src: assetUrl('PNG/hop-tim.png') },
  { alt: 'Nút warning', src: assetUrl('PNG/nhan-nut-warning.png') },
  { alt: 'Đĩa than', src: assetUrl('PNG/dia-than.png') },
  { alt: 'Đồng hồ', src: assetUrl('PNG/dong-ho.png') },
  { alt: 'Ngũ cốc', src: assetUrl('PNG/ngu-coc.png') },
  { alt: 'Mascot đá chân', src: assetUrl('PNG/mascot-da-chan.png') },
  { alt: 'Sofa', src: assetUrl('PNG/sofa.png') },
  { alt: 'Mascot cầm loa', src: assetUrl('PNG/mascot-cam-loa.png') },
  { alt: 'Cuộn len', src: assetUrl('PNG/cuon-len.png') },
  { alt: 'Hộp nhạc', src: assetUrl('PNG/hop-nhac.png') },
  { alt: 'Mascot nhảy', src: assetUrl('PNG/mascot-nhay.png') },
  { alt: 'Cọ vẽ', src: assetUrl('PNG/brush.png') },
  { alt: 'Máy ảnh', src: assetUrl('PNG/may-anh.png') },
  { alt: 'Ghi chú', src: assetUrl('PNG/note.png') },
  { alt: 'Giày', src: assetUrl('PNG/giay.png') },
  { alt: 'Radio', src: assetUrl('PNG/radio.png') },
  { alt: 'Thư tay', src: assetUrl('PNG/thu-tay.png') },
  { alt: 'Hoa ly', src: assetUrl('PNG/hoa-ly.png') },
  { alt: 'Rơi núi', src: assetUrl('PNG/roi-nui.png') },
  { alt: 'Mascot ngủ', src: assetUrl('PNG/mascot-ngu.png') },
  { alt: 'Ngôi sao', src: assetUrl('PNG/ngoi-sao.png') },
  { alt: 'iPod', src: assetUrl('PNG/ipod.png') },
  { alt: 'Tay trái tim', src: assetUrl('PNG/tay-trai-tim.png') },
]

export function ShareSheet({
  activeShareFrame,
  activeShareFrameId,
  allShareFrames,
  copy,
  customFrameInputRef,
  isOpen,
  onAddCustomFrame,
  onBeginMoveShareSticker,
  onColorShareSticker,
  onClose,
  onCopyShareQuote,
  onDownloadShareImage,
  onFlipShareSticker,
  onNativeShareQuote,
  onMoveShareSticker,
  onPlaceShareSticker,
  onResizeShareSticker,
  onRemoveShareSticker,
  onResetShareStickers,
  onRotateShareSticker,
  onSelectShareFrame,
  onTextColorChange,
  onTransformShareSticker,
  onUndoShareSticker,
  placedShareStickers,
  quote,
  shareQuoteFontSize,
  shareStickerHistoryCount,
  shareTextColor,
  shareTextColors,
}) {
  const previewRef = useRef(null)
  const activeStickerPointersRef = useRef(new Map())
  const stickerGestureRef = useRef(null)
  const [draggingStickerId, setDraggingStickerId] = useState(null)
  const [selectedStickerId, setSelectedStickerId] = useState(null)

  const getPreviewPoint = (event) => {
    const preview = previewRef.current
    if (!preview) return null

    const rect = preview.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(92, Math.max(8, y)),
    }
  }

  const getPreviewPointFromClient = (clientX, clientY) => {
    const preview = previewRef.current
    if (!preview) return null

    const rect = preview.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100

    return {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(92, Math.max(8, y)),
    }
  }

  const getPointerCenter = (pointers) => ({
    clientX: pointers.reduce((sum, pointer) => sum + pointer.clientX, 0) / pointers.length,
    clientY: pointers.reduce((sum, pointer) => sum + pointer.clientY, 0) / pointers.length,
  })

  const getPointerDistance = ([firstPointer, secondPointer]) => Math.hypot(
    secondPointer.clientX - firstPointer.clientX,
    secondPointer.clientY - firstPointer.clientY,
  )

  const getPointerAngle = ([firstPointer, secondPointer]) => (
    Math.atan2(secondPointer.clientY - firstPointer.clientY, secondPointer.clientX - firstPointer.clientX) * 180 / Math.PI
  )

  const beginStickerGesture = (sticker, pointers) => {
    if (!pointers.length) return

    stickerGestureRef.current = {
      angle: pointers.length > 1 ? getPointerAngle(pointers) : 0,
      distance: pointers.length > 1 ? getPointerDistance(pointers) : 0,
      pointerCount: pointers.length,
      rotation: sticker.rotation || 0,
      size: sticker.size || 22,
      stickerId: sticker.id,
      startCenter: getPointerCenter(pointers),
      startX: sticker.x,
      startY: sticker.y,
    }
  }

  const updateStickerGesture = (stickerId) => {
    const pointers = Array.from(activeStickerPointersRef.current.values())
    if (!pointers.length) return

    const sticker = placedShareStickers.find((item) => item.id === stickerId)
    if (!sticker) return

    const gesture = stickerGestureRef.current
    if (!gesture || gesture.stickerId !== stickerId || gesture.pointerCount !== pointers.length) {
      beginStickerGesture(sticker, pointers)
      return
    }

    const center = getPointerCenter(pointers)
    const point = getPreviewPointFromClient(center.clientX, center.clientY)
    const nextTransform = point ? { x: point.x, y: point.y } : {}

    if (pointers.length > 1 && gesture.distance > 0) {
      const nextDistance = getPointerDistance(pointers)
      const nextAngle = getPointerAngle(pointers)

      nextTransform.size = gesture.size * (nextDistance / gesture.distance)
      nextTransform.rotation = gesture.rotation + nextAngle - gesture.angle
    }

    onTransformShareSticker(stickerId, nextTransform)
  }

  const handleStickerDragStart = (event, sticker) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/json', JSON.stringify(sticker))
  }

  const handleStickerDrop = (event) => {
    event.preventDefault()

    const point = getPreviewPoint(event)
    const stickerData = event.dataTransfer.getData('application/json')
    if (!point || !stickerData) return

    try {
      const sticker = JSON.parse(stickerData)
      onPlaceShareSticker({ ...sticker, ...point })
    } catch {
      return
    }
  }

  const handlePlacedStickerPointerDown = (event, sticker) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const stickerId = sticker.id
    const pointerCount = activeStickerPointersRef.current.size
    setDraggingStickerId(stickerId)
    setSelectedStickerId(stickerId)
    if (!pointerCount) onBeginMoveShareSticker()
    activeStickerPointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
      startClientX: event.clientX,
      startClientY: event.clientY,
    })
    beginStickerGesture(sticker, Array.from(activeStickerPointersRef.current.values()))

    const point = getPreviewPoint(event)
    if (point && activeStickerPointersRef.current.size === 1) onMoveShareSticker(stickerId, point)
  }

  const handleRemovePlacedSticker = (stickerId) => {
    onRemoveShareSticker(stickerId)
    setSelectedStickerId((currentStickerId) => (currentStickerId === stickerId ? null : currentStickerId))
  }

  const handlePlacedStickerPointerMove = (event) => {
    if (!draggingStickerId) return

    if (!activeStickerPointersRef.current.has(event.pointerId)) return

    activeStickerPointersRef.current.set(event.pointerId, {
      ...activeStickerPointersRef.current.get(event.pointerId),
      clientX: event.clientX,
      clientY: event.clientY,
    })
    updateStickerGesture(draggingStickerId)
  }

  const handlePlacedStickerPointerUp = (event) => {
    activeStickerPointersRef.current.delete(event.pointerId)

    if (!activeStickerPointersRef.current.size) {
      stickerGestureRef.current = null
      setDraggingStickerId(null)
      return
    }

    const sticker = placedShareStickers.find((item) => item.id === draggingStickerId)
    if (sticker) beginStickerGesture(sticker, Array.from(activeStickerPointersRef.current.values()))
  }

  const renderStickerTray = (stickers, className) => (
    <div className={`share-sticker-tray ${className}`} aria-label="Sticker kéo vào khung chia sẻ">
      {stickers.map((sticker) => (
        <button
          className="share-sticker-tray-item"
          type="button"
          key={sticker.src}
          draggable
          aria-label={`Kéo ${sticker.alt} vào khung`}
          onClick={() => onPlaceShareSticker({ ...sticker, x: 50, y: 18 })}
          onDragStart={(event) => handleStickerDragStart(event, sticker)}
        >
          <img src={sticker.src} alt="" />
        </button>
      ))}
    </div>
  )

  const stickerColumnSplit = Math.ceil(shareStickerOptions.length / 2)
  const leftStickerOptions = shareStickerOptions.slice(0, stickerColumnSplit)
  const rightStickerOptions = shareStickerOptions.slice(stickerColumnSplit)
  const selectedSticker = placedShareStickers.find((sticker) => sticker.id === selectedStickerId)
  const hasStickerTools = Boolean(selectedSticker || placedShareStickers.length || shareStickerHistoryCount)

  useEffect(() => {
    if (isOpen) return

    activeStickerPointersRef.current.clear()
    stickerGestureRef.current = null
  }, [isOpen])

  const handleSelectNextSticker = () => {
    if (!placedShareStickers.length) return

    const currentIndex = placedShareStickers.findIndex((sticker) => sticker.id === selectedStickerId)
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % placedShareStickers.length
    setSelectedStickerId(placedShareStickers[nextIndex].id)
  }

  return (
    <div className={`share-sheet-backdrop ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
      <button className="share-sheet-dismiss" type="button" aria-label={copy.shareSheet.close} onClick={onClose} />
      <section
        className="share-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={copy.shareSheet.dialog}
        style={{
          '--share-bg': activeShareFrame.background,
          '--share-card': activeShareFrame.card,
          '--share-accent': activeShareFrame.accent,
          '--share-text': shareTextColor,
        }}
      >
        <button className="share-sheet-close" type="button" aria-label={copy.shareSheet.close} onClick={onClose}>
          <CloseIcon />
        </button>

        <div className="share-compose-area">
          {renderStickerTray(leftStickerOptions, 'share-sticker-tray-left')}
          <div
            ref={previewRef}
            className={`share-preview-letter ${activeShareFrame.imageUrl ? 'has-custom-frame' : ''}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleStickerDrop}
            style={activeShareFrame.imageUrl ? { backgroundImage: `url(${activeShareFrame.imageUrl})` } : undefined}
          >
            <div className="share-preview-stickers">
              {placedShareStickers.map((sticker) => (
                <button
                  className={`share-placed-sticker ${selectedStickerId === sticker.id ? 'is-selected' : ''}`}
                  type="button"
                  key={sticker.id}
                  aria-label={`Di chuyển ${sticker.alt}`}
                  aria-pressed={selectedStickerId === sticker.id}
                  onClick={() => setSelectedStickerId(sticker.id)}
                  onDoubleClick={() => handleRemovePlacedSticker(sticker.id)}
                  onPointerDown={(event) => handlePlacedStickerPointerDown(event, sticker)}
                  onPointerMove={handlePlacedStickerPointerMove}
                  onPointerUp={handlePlacedStickerPointerUp}
                  onPointerCancel={handlePlacedStickerPointerUp}
                  style={{
                    '--sticker-x': `${sticker.x}%`,
                    '--sticker-y': `${sticker.y}%`,
                    '--sticker-size': `${sticker.size}%`,
                    '--sticker-flip': sticker.flipped ? -1 : 1,
                    '--sticker-rotate': `${sticker.rotation}deg`,
                    '--sticker-color': sticker.color || shareTextColor,
                    '--sticker-src': `url(${sticker.src})`,
                  }}
                >
                  <span className="share-placed-sticker-art" />
                </button>
              ))}
            </div>
            <div className="share-letter-paper">
              <strong style={{ '--share-quote-size': shareQuoteFontSize }}>{quote}</strong>
            </div>
          </div>
          {renderStickerTray(rightStickerOptions, 'share-sticker-tray-right')}
        </div>

        {hasStickerTools ? (
          <>
            <div className="share-sticker-size-control" aria-label={selectedSticker ? `Chỉnh kích thước ${selectedSticker.alt}` : 'Điều khiển icon'}>
              <button type="button" aria-label="Hoàn tác icon" disabled={!shareStickerHistoryCount} onClick={onUndoShareSticker}>
                <UndoIcon />
              </button>
              <button type="button" aria-label="Reset icon về ban đầu" disabled={!placedShareStickers.length} onClick={onResetShareStickers}>
                <ResetIcon />
              </button>
              <button type="button" aria-label="Xoá icon đang chọn" disabled={!selectedSticker} onClick={() => handleRemovePlacedSticker(selectedSticker.id)}>
                ×
              </button>
              {selectedSticker ? (
                <>
                  <button type="button" aria-label="Thu nhỏ icon" onClick={() => onResizeShareSticker(selectedSticker.id, selectedSticker.size - 2)}>
                    -
                  </button>
                  <button type="button" aria-label="Phóng to icon" onClick={() => onResizeShareSticker(selectedSticker.id, selectedSticker.size + 2)}>
                    +
                  </button>
                  <button type="button" aria-label="Lật icon" onClick={() => onFlipShareSticker(selectedSticker.id)}>
                    <FlipIcon />
                  </button>
                  <button className="share-sticker-rotate-button" type="button" aria-label="Xoay icon 45 độ" onClick={() => onRotateShareSticker(selectedSticker.id)}>
                    <RotateIcon />
                    <small>45°</small>
                  </button>
                </>
              ) : null}
              <button type="button" aria-label="Chọn icon tiếp theo" disabled={!placedShareStickers.length} onClick={handleSelectNextSticker}>
                ›
              </button>
            </div>
            {selectedSticker ? (
              <div className="share-sticker-color-control" aria-label={`Đổi màu ${selectedSticker.alt}`}>
                {shareTextColors.map((color) => (
                  <button
                    className={(selectedSticker.color || shareTextColor).toLowerCase() === color ? 'is-active' : ''}
                    type="button"
                    key={color}
                    aria-label={`Đổi màu icon ${color}`}
                    aria-pressed={(selectedSticker.color || shareTextColor).toLowerCase() === color}
                    onClick={() => onColorShareSticker(selectedSticker.id, color)}
                    style={{ '--sticker-color-option': color }}
                  />
                ))}
                <label className="share-sticker-color-custom">
                  <input
                    type="color"
                    value={selectedSticker.color || shareTextColor}
                    aria-label="Màu icon tuỳ chỉnh"
                    onChange={(event) => onColorShareSticker(selectedSticker.id, event.target.value)}
                  />
                </label>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="share-frame-picker" aria-label={copy.shareSheet.framePicker}>
          {allShareFrames.map((frame) => (
            <button
              className={activeShareFrameId === frame.id ? 'is-active' : ''}
              type="button"
              key={frame.id}
              aria-label={copy.shareSheet.chooseFrame(frame.label)}
              aria-pressed={activeShareFrameId === frame.id}
              onClick={() => onSelectShareFrame(frame)}
              style={{
                '--frame-bg': frame.background,
                '--frame-card': frame.card,
              }}
            >
              {frame.imageUrl && <img src={frame.imageUrl} alt="" />}
            </button>
          ))}
          <button className="share-frame-add" type="button" aria-label={copy.shareSheet.addFrame} onClick={() => customFrameInputRef.current?.click()}>
            +
          </button>
          <input ref={customFrameInputRef} className="share-frame-input" type="file" accept="image/*" onChange={onAddCustomFrame} />
        </div>

        <div className="share-text-color-control" aria-label={copy.shareSheet.textColorLabel}>
          <span>{copy.shareSheet.textColor}</span>
          <div className="share-text-color-options">
            {shareTextColors.map((color) => (
              <button
                className={shareTextColor.toLowerCase() === color ? 'is-active' : ''}
                type="button"
                key={color}
                aria-label={copy.shareSheet.chooseTextColor(color)}
                aria-pressed={shareTextColor.toLowerCase() === color}
                onClick={() => onTextColorChange(color)}
                style={{ '--text-color-option': color }}
              />
            ))}
            <label className="share-text-color-custom">
              <input
                type="color"
                value={shareTextColor}
                onChange={(event) => onTextColorChange(event.target.value)}
                aria-label={copy.shareSheet.customTextColor}
              />
            </label>
          </div>
        </div>

        <div className="share-sheet-actions" aria-label={copy.shareSheet.actions}>
          <button type="button" onClick={onCopyShareQuote}>
            <span>
              <CopyIcon />
            </span>
            <p>{copy.shareSheet.copy}</p>
          </button>
          <button type="button" onClick={onNativeShareQuote}>
            <span>
              <ShareIcon />
            </span>
            <p>{copy.shareSheet.share}</p>
          </button>
          <button type="button" onClick={onDownloadShareImage}>
            <span>
              <DownloadIcon />
            </span>
            <p>{copy.shareSheet.download}</p>
          </button>
        </div>
      </section>
    </div>
  )
}

export function Toast({ message }) {
  return (
    <div className={`toast-message ${message ? 'is-visible' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
