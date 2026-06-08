import { CloseIcon, CopyIcon, DownloadIcon, InstagramIcon, ShareIcon } from './icons'

const sharePreviewStickers = [
  { alt: 'Mascot cầm loa', className: 'share-sticker-megaphone', src: '/PNG/mascot-cam-loa.png' },
  { alt: 'Messenger', className: 'share-sticker-message', src: '/PNG/messenger.png' },
  { alt: 'Ghi chú', className: 'share-sticker-note', src: '/PNG/note.png' },
  { alt: 'Máy ảnh', className: 'share-sticker-camera', src: '/PNG/may-anh.png' },
  { alt: 'Tay trái tim', className: 'share-sticker-heart', src: '/PNG/tay-trai-tim.png' },
  { alt: 'Hoa ly', className: 'share-sticker-flower', src: '/PNG/hoa-ly.png' },
  { alt: 'Ngôi sao', className: 'share-sticker-star', src: '/PNG/ngoi-sao.png' },
  { alt: 'Radio', className: 'share-sticker-radio', src: '/PNG/radio.png' },
  { alt: 'Tai nghe', className: 'share-sticker-headphone', src: '/PNG/headphone.png' },
  { alt: 'Thư tay', className: 'share-sticker-letter', src: '/PNG/thu-tay.png' },
  { alt: 'Have a nice day', className: 'share-sticker-nice-day', src: '/PNG/have-a-nice-day.png' },
  { alt: 'iPod', className: 'share-sticker-ipod', src: '/PNG/ipod.png' },
]

export function ShareSheet({
  activeShareFrame,
  activeShareFrameId,
  allShareFrames,
  copy,
  customFrameInputRef,
  isOpen,
  onAddCustomFrame,
  onClose,
  onCopyShareQuote,
  onDownloadShareImage,
  onNativeShareQuote,
  onSelectShareFrame,
  onShareInstagramStory,
  onTextColorChange,
  quote,
  shareQuoteFontSize,
  shareTextColor,
  shareTextColors,
}) {
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

        <div
          className={`share-preview-letter ${activeShareFrame.imageUrl ? 'has-custom-frame' : ''}`}
          style={activeShareFrame.imageUrl ? { backgroundImage: `url(${activeShareFrame.imageUrl})` } : undefined}
        >
          <div className="share-preview-stickers" aria-hidden="true">
            <svg className="share-sticker-links" viewBox="0 0 100 160" preserveAspectRatio="none">
              <path d="M19 21 C31 12 47 15 58 25 S76 35 83 27" />
              <path d="M18 47 C10 60 12 75 25 84 S30 110 20 126" />
              <path d="M76 47 C89 58 88 76 76 86 S75 113 88 126" />
              <path d="M24 130 C38 145 58 142 68 132 S82 130 87 140" />
            </svg>
            {sharePreviewStickers.map((sticker) => (
              <img className={`share-preview-sticker ${sticker.className}`} src={sticker.src} alt="" key={sticker.src} />
            ))}
          </div>
          <div className="share-letter-paper">
            <strong style={{ '--share-quote-size': shareQuoteFontSize }}>{quote}</strong>
          </div>
        </div>

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
          <button type="button" onClick={onShareInstagramStory}>
            <span>
              <InstagramIcon />
            </span>
            <p>{copy.shareSheet.instagram}</p>
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
