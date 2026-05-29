import { CloseIcon, CopyIcon, DownloadIcon, InstagramIcon, ShareIcon } from './icons'

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
