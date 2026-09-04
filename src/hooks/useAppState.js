import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { decisionMessages } from '../decisionMessages'
import { ui } from '../i18n/ui'
import {
  ambientSoundOptions,
  customShareFramesStorageKey,
  iceCubeSeconds,
  longBreakSeconds,
  maxIceCubes,
  shortBreakSeconds,
  shareFrames,
} from '../config/appConfig'
import { getRandomQuote, getQuoteLetters } from '../utils/quotes'
import { trackAnalyticsEvent } from '../utils/analytics'
import { createShareImageBlob, getShareQuoteFontSize } from '../utils/shareImage'
import { formatTime } from '../utils/time'

function getNextDecisionMessage(currentMessage = '') {
  const nextOptions =
    decisionMessages.length > 1
      ? decisionMessages.filter((message) => message !== currentMessage)
      : decisionMessages

  return nextOptions[Math.floor(Math.random() * nextOptions.length)]
}

export function useAppState() {
  const [quoteLetters] = useState(getQuoteLetters)
  const [randomQuote] = useState(getRandomQuote)
  const [quote, setQuote] = useState('')
  const [openedLetterId, setOpenedLetterId] = useState(null)
  const [savedQuotes, setSavedQuotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('savedQuotes') || '[]')
    } catch {
      return []
    }
  })
  const [toastMessage, setToastMessage] = useState('')
  const [iceCubeCount, setIceCubeCount] = useState(0)
  const [draggingIcePosition, setDraggingIcePosition] = useState(null)
  const [isIceDroppingIntoCup, setIsIceDroppingIntoCup] = useState(false)
  const [iceDropAnimationKey, setIceDropAnimationKey] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [retainedWaterCubes, setRetainedWaterCubes] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerPhase, setTimerPhase] = useState('focus')
  const [activeAmbientSound, setActiveAmbientSound] = useState(null)
  const [decisionMessage, setDecisionMessage] = useState('')
  const [decisionThread, setDecisionThread] = useState([])
  const [decisionMotion, setDecisionMotion] = useState('idle')
  const [decisionAnimationKey, setDecisionAnimationKey] = useState(0)
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false)
  const [activeShareFrameId, setActiveShareFrameId] = useState(shareFrames[0].id)
  const [shareTextColor, setShareTextColor] = useState(shareFrames[0].text)
  const [placedShareStickers, setPlacedShareStickers] = useState([])
  const [shareStickerHistoryCount, setShareStickerHistoryCount] = useState(0)
  const [customShareFrames, setCustomShareFrames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(customShareFramesStorageKey) || '[]')
    } catch {
      return []
    }
  })

  const toastTimeoutRef = useRef(null)
  const decisionTimeoutRef = useRef(null)
  const iceAddTimeoutRef = useRef(null)
  const iceDropTimeoutRef = useRef(null)
  const isIceDragFinishingRef = useRef(false)
  const latestIceDragPositionRef = useRef(null)
  const customFrameInputRef = useRef(null)
  const shareStickerIdRef = useRef(0)
  const shareStickerHistoryRef = useRef([])
  const iceCupRef = useRef(null)
  const audioContextRef = useRef(null)
  const ambientAudioRef = useRef(null)

  const isQuoteSaved = useMemo(() => savedQuotes.includes(quote), [quote, savedQuotes])
  const isFocusPhase = timerPhase === 'focus'
  const isBreakPhase = timerPhase === 'shortBreak' || timerPhase === 'longBreak'
  const isBreakReadyPhase = timerPhase === 'shortBreakReady' || timerPhase === 'longBreakReady'
  const totalIceSeconds = iceCubeCount * iceCubeSeconds
  const iceMeltProgress =
    isFocusPhase && totalIceSeconds > 0 ? 1 - Math.min(secondsLeft, totalIceSeconds) / totalIceSeconds : 0
  const currentIceWaterProgress = Math.max(0, (iceMeltProgress - 0.16) / 0.84)
  const currentMeltingWaterCubes = isFocusPhase && secondsLeft > 0 ? iceCubeCount * currentIceWaterProgress : 0
  const iceWaterProgress = Math.min(1, (retainedWaterCubes + currentMeltingWaterCubes) / maxIceCubes)
  const iceShrinkProgress = Math.max(0, (iceMeltProgress - 0.18) / 0.82)
  const iceFadeProgress = Math.max(0, (iceMeltProgress - 0.58) / 0.42)
  const iceWaterSurface = `${Math.max(8, iceWaterProgress * 78)}%`
  const iceFloatLift = `${Math.min(38, iceWaterProgress * 44)}%`
  const remainingWaterCapacityCubes = Math.max(0, maxIceCubes - retainedWaterCubes)
  const activeIceCubeCount = iceCubeCount
  const maxSelectableIceCubes = remainingWaterCapacityCubes
  const canAddIceCube =
    !isTimerRunning &&
    (isBreakReadyPhase || (isFocusPhase && (secondsLeft === 0 || secondsLeft === totalIceSeconds))) &&
    remainingWaterCapacityCubes > activeIceCubeCount
  const iceDropDepth = `${Math.max(148, 338 - iceCubeCount * 38)}%`
  const iceImpactBottom = `${Math.min(43, 13 + iceCubeCount * 6)}%`
  const openedLetter = useMemo(
    () => quoteLetters.find((letter) => letter.id === openedLetterId),
    [openedLetterId, quoteLetters],
  )
  const allShareFrames = useMemo(() => [...shareFrames, ...customShareFrames], [customShareFrames])
  const activeShareFrame = useMemo(
    () => allShareFrames.find((frame) => frame.id === activeShareFrameId) || shareFrames[0],
    [activeShareFrameId, allShareFrames],
  )
  const shareQuoteFontSize = useMemo(() => getShareQuoteFontSize(quote), [quote])
  const copy = ui
  const activeTimerMessage = isTimerRunning
    ? isBreakPhase
      ? copy.timer.ice.runningBreak
      : copy.timer.ice.runningFocus
    : iceCubeCount === 0 && retainedWaterCubes === 0
      ? copy.timer.ice.empty
      : timerPhase === 'shortBreakReady'
        ? copy.timer.ice.shortReady
      : timerPhase === 'longBreakReady'
        ? copy.timer.ice.longReady
      : isBreakPhase
        ? copy.timer.ice.breakPaused
      : secondsLeft === 0
      ? remainingWaterCapacityCubes === 0
        ? copy.timer.ice.full
        : copy.timer.ice.finished
      : copy.timer.ice.ready
  useLayoutEffect(() => {
    const canControlScrollRestoration = 'scrollRestoration' in window.history
    const previousScrollRestoration = canControlScrollRestoration ? window.history.scrollRestoration : null

    if (canControlScrollRestoration) {
      window.history.scrollRestoration = 'manual'
    }

    if (window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }

    window.scrollTo(0, 0)

    return () => {
      if (canControlScrollRestoration) {
        window.history.scrollRestoration = previousScrollRestoration
      }
    }
  }, [])

  useEffect(() => {
    const defaultTitle = '138'

    if (!isTimerRunning) {
      document.title = defaultTitle
      return
    }

    const label = isBreakPhase ? copy.timer.pageTitle.break : copy.timer.pageTitle.focus
    document.title = `${formatTime(secondsLeft)} - ${label}!`

    return () => {
      document.title = defaultTitle
    }
  }, [copy.timer.pageTitle.break, copy.timer.pageTitle.focus, isBreakPhase, isTimerRunning, secondsLeft])

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return null
      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }

    return audioContextRef.current
  }, [])

  const playTone = useCallback(
    ({ frequency = 520, duration = 0.08, gain = 0.08, type = 'sine', delay = 0 }) => {
      const audioContext = getAudioContext()
      if (!audioContext) return

      const startTime = audioContext.currentTime + delay
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, startTime)
      gainNode.gain.setValueAtTime(0.0001, startTime)
      gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.02)
    },
    [getAudioContext],
  )

  const playButtonClick = useCallback(() => {
    playTone({ frequency: 740, duration: 0.045, gain: 0.045, type: 'triangle' })
  }, [playTone])

  const playIceMeltNotice = useCallback(() => {
    playTone({ frequency: 783.99, duration: 0.09, gain: 0.05, type: 'sine' })
    playTone({ frequency: 1046.5, duration: 0.12, gain: 0.045, type: 'triangle', delay: 0.08 })
  }, [playTone])

  const playTimerDone = useCallback(() => {
    const alarmNotes = [
      { frequency: 880, delay: 0 },
      { frequency: 1174.66, delay: 0.12 },
      { frequency: 1046.5, delay: 0.24 },
      { frequency: 1318.51, delay: 0.36 },
      { frequency: 880, delay: 0.62 },
      { frequency: 1174.66, delay: 0.74 },
      { frequency: 1046.5, delay: 0.86 },
      { frequency: 1318.51, delay: 0.98 },
    ]

    alarmNotes.forEach(({ frequency, delay }) => {
      playTone({ frequency, duration: 0.16, gain: 0.07, type: 'triangle', delay })
      playTone({ frequency: frequency * 2, duration: 0.12, gain: 0.018, type: 'sine', delay: delay + 0.01 })
    })
  }, [playTone])

  const stopAmbientSound = useCallback(() => {
    if (!ambientAudioRef.current) return

    ambientAudioRef.current.pause()
    ambientAudioRef.current.currentTime = 0
    ambientAudioRef.current.src = ''
    ambientAudioRef.current = null
  }, [])

  const handleInterfaceClick = useCallback(
    (event) => {
      const clickedButton = event.target.closest('button')
      if (!clickedButton || clickedButton.disabled) return
      playButtonClick()
    },
    [playButtonClick],
  )

  const handleIceCubeCountChange = useCallback(
    (nextCount) => {
      if (maxSelectableIceCubes <= 0 || (!isFocusPhase && !isBreakReadyPhase)) return

      const normalizedCount = Math.min(maxSelectableIceCubes, Math.max(0, nextCount))
      setIceCubeCount(normalizedCount)

      if (isBreakReadyPhase && normalizedCount > 0) {
        setTimerPhase('focus')
      }

      if (!isTimerRunning) {
        setSecondsLeft(normalizedCount * iceCubeSeconds)
      }
    },
    [isBreakReadyPhase, isFocusPhase, isTimerRunning, maxSelectableIceCubes],
  )

  const finishIceDrag = useCallback(
    (clientX, clientY) => {
      if (isIceDragFinishingRef.current) return
      isIceDragFinishingRef.current = true
      const releaseX = latestIceDragPositionRef.current?.x ?? clientX
      const releaseY = latestIceDragPositionRef.current?.y ?? clientY

      const cupBounds = iceCupRef.current?.getBoundingClientRect()
      if (!cupBounds) {
        setDraggingIcePosition({ x: releaseX, y: releaseY, isDropping: false, isReturning: true })
        window.setTimeout(() => {
          setDraggingIcePosition(null)
          latestIceDragPositionRef.current = null
          isIceDragFinishingRef.current = false
        }, 260)
        return
      }

      const rimDropLeft = cupBounds.left + cupBounds.width * 0.08
      const rimDropRight = cupBounds.right - cupBounds.width * 0.08
      const rimDropTop = cupBounds.top - cupBounds.height * 0.04
      const rimDropBottom = cupBounds.top + cupBounds.height * 0.2
      const isInsideCup =
        releaseX >= rimDropLeft && releaseX <= rimDropRight && releaseY >= rimDropTop && releaseY <= rimDropBottom

      if (isInsideCup && canAddIceCube) {
        setDraggingIcePosition(null)
        setIsIceDroppingIntoCup(true)
        setIceDropAnimationKey((currentKey) => currentKey + 1)
        window.clearTimeout(iceAddTimeoutRef.current)
        window.clearTimeout(iceDropTimeoutRef.current)
        iceAddTimeoutRef.current = window.setTimeout(() => {
          handleIceCubeCountChange(secondsLeft === 0 ? 1 : iceCubeCount + 1)
        }, 900)
        iceDropTimeoutRef.current = window.setTimeout(() => {
          setIsIceDroppingIntoCup(false)
          latestIceDragPositionRef.current = null
          isIceDragFinishingRef.current = false
        }, 1320)
        return
      }

      setDraggingIcePosition({ x: releaseX, y: releaseY, isDropping: false, isReturning: true })
      window.setTimeout(() => {
        setDraggingIcePosition(null)
        latestIceDragPositionRef.current = null
        isIceDragFinishingRef.current = false
      }, 260)
    },
    [canAddIceCube, handleIceCubeCountChange, iceCubeCount, secondsLeft],
  )

  useEffect(() => {
    if (!isTimerRunning) return undefined

    const timerId = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          playTimerDone()
          window.clearInterval(timerId)
          setIsTimerRunning(false)

          if (isBreakPhase) {
            setTimerPhase('focus')
            return iceCubeCount > 0 ? iceCubeCount * iceCubeSeconds : 0
          }

          setRetainedWaterCubes((currentCubes) => {
            const nextCubes = Math.min(maxIceCubes, currentCubes + iceCubeCount)
            setTimerPhase(nextCubes >= maxIceCubes ? 'longBreakReady' : 'shortBreakReady')
            return nextCubes
          })
          setIceCubeCount(0)

          return 0
        }

        const nextSeconds = currentSeconds - 1
        const completedFocusSeconds = totalIceSeconds - nextSeconds
        const hasMeltedOneCube =
          !isBreakPhase &&
          totalIceSeconds > iceCubeSeconds &&
          nextSeconds > 0 &&
          completedFocusSeconds > 0 &&
          completedFocusSeconds % iceCubeSeconds === 0

        if (hasMeltedOneCube) {
          playIceMeltNotice()
        }

        return nextSeconds
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [iceCubeCount, isBreakPhase, isTimerRunning, playIceMeltNotice, playTimerDone, totalIceSeconds])

  useEffect(() => {
    stopAmbientSound()
    if (!activeAmbientSound) return undefined

    const selectedSound = ambientSoundOptions.find((sound) => sound.id === activeAmbientSound)
    if (!selectedSound) return undefined

    const audio = new Audio(selectedSound.src)
    audio.loop = true
    audio.volume = 0.62
    ambientAudioRef.current = audio

    audio.play().catch(() => {
      stopAmbientSound()
    })

    return stopAmbientSound
  }, [activeAmbientSound, stopAmbientSound])

  useEffect(() => {
    const animatedElements = document.querySelectorAll('.scroll-pop')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )

    animatedElements.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isShareSheetOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isShareSheetOpen])

  useEffect(() => {
    if (!draggingIcePosition || draggingIcePosition.isDropping) return undefined

    const handlePointerMove = (event) => {
      event.preventDefault()
      latestIceDragPositionRef.current = { x: event.clientX, y: event.clientY }
      setDraggingIcePosition({ x: event.clientX, y: event.clientY, isDropping: false, isReturning: false })
    }

    const handlePointerUp = (event) => {
      event.preventDefault()
      finishIceDrag(event.clientX, event.clientY)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp, { passive: false })
    window.addEventListener('pointercancel', handlePointerUp, { passive: false })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [draggingIcePosition, finishIceDrag])

  useEffect(
    () => () => {
      window.clearTimeout(decisionTimeoutRef.current)
      window.clearTimeout(iceAddTimeoutRef.current)
      window.clearTimeout(iceDropTimeoutRef.current)
    },
    [],
  )

  const showToast = useCallback((message) => {
    setToastMessage(message)
    window.clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('')
    }, 2200)
  }, [])

  const handleOpenLetter = (letter) => {
    setOpenedLetterId(letter.id)
    setQuote(randomQuote)
    trackAnalyticsEvent('letter_open', 'card-room', { letterId: letter.id })
  }

  const handleToggleSaveQuote = () => {
    if (!quote) return

    const nextSavedQuotes = isQuoteSaved
      ? savedQuotes.filter((savedQuote) => savedQuote !== quote)
      : [...savedQuotes, quote]

    setSavedQuotes(nextSavedQuotes)
    localStorage.setItem('savedQuotes', JSON.stringify(nextSavedQuotes))
    trackAnalyticsEvent('quote_save', 'card-room', { saved: !isQuoteSaved })
    showToast(isQuoteSaved ? copy.toasts.unsaved : copy.toasts.saved)
  }

  const handleShareQuote = () => {
    if (!quote) return
    setIsShareSheetOpen(true)
    trackAnalyticsEvent('quote_share', 'card-room', { method: 'open_sheet' })
  }

  const handleSelectShareFrame = (frame) => {
    setActiveShareFrameId(frame.id)
    setShareTextColor(frame.text)
  }

  const saveShareStickerSnapshot = (stickers) => {
    shareStickerHistoryRef.current = [...shareStickerHistoryRef.current.slice(-19), stickers.map((sticker) => ({ ...sticker }))]
    setShareStickerHistoryCount(shareStickerHistoryRef.current.length)
  }

  const handlePlaceShareSticker = (sticker) => {
    shareStickerIdRef.current += 1
    const rotation = ((shareStickerIdRef.current % 7) - 3) * 4

    saveShareStickerSnapshot(placedShareStickers)
    setPlacedShareStickers((currentStickers) => [
      ...currentStickers,
      {
        alt: sticker.alt,
        color: sticker.color || shareTextColor,
        flipped: false,
        id: `share-sticker-${Date.now()}-${shareStickerIdRef.current}`,
        rotation,
        size: 22,
        src: sticker.src,
        x: sticker.x,
        y: sticker.y,
      },
    ])
  }

  const handleBeginMoveShareSticker = () => {
    saveShareStickerSnapshot(placedShareStickers)
  }

  const handleMoveShareSticker = (stickerId, point) => {
    setPlacedShareStickers((currentStickers) =>
      currentStickers.map((sticker) => (sticker.id === stickerId ? { ...sticker, ...point } : sticker)),
    )
  }

  const handleTransformShareSticker = (stickerId, transform) => {
    setPlacedShareStickers((currentStickers) =>
      currentStickers.map((sticker) => {
        if (sticker.id !== stickerId) return sticker
        const nextSize = Number(transform.size)
        const nextX = Number(transform.x)
        const nextY = Number(transform.y)

        return {
          ...sticker,
          ...transform,
          rotation: transform.rotation ?? sticker.rotation,
          size: Number.isFinite(nextSize) ? Math.min(38, Math.max(10, nextSize)) : sticker.size,
          x: Number.isFinite(nextX) ? Math.min(92, Math.max(8, nextX)) : sticker.x,
          y: Number.isFinite(nextY) ? Math.min(92, Math.max(8, nextY)) : sticker.y,
        }
      }),
    )
  }

  const handleResizeShareSticker = (stickerId, size) => {
    const nextSize = Math.min(38, Math.max(10, Number(size)))

    saveShareStickerSnapshot(placedShareStickers)
    setPlacedShareStickers((currentStickers) =>
      currentStickers.map((sticker) => (sticker.id === stickerId ? { ...sticker, size: nextSize } : sticker)),
    )
  }

  const handleColorShareSticker = (stickerId, color) => {
    saveShareStickerSnapshot(placedShareStickers)
    setPlacedShareStickers((currentStickers) =>
      currentStickers.map((sticker) => (sticker.id === stickerId ? { ...sticker, color } : sticker)),
    )
  }

  const handleRotateShareSticker = (stickerId) => {
    saveShareStickerSnapshot(placedShareStickers)
    setPlacedShareStickers((currentStickers) =>
      currentStickers.map((sticker) =>
        sticker.id === stickerId ? { ...sticker, rotation: (sticker.rotation + 45) % 360 } : sticker,
      ),
    )
  }

  const handleFlipShareSticker = (stickerId) => {
    saveShareStickerSnapshot(placedShareStickers)
    setPlacedShareStickers((currentStickers) =>
      currentStickers.map((sticker) => (sticker.id === stickerId ? { ...sticker, flipped: !sticker.flipped } : sticker)),
    )
  }

  const handleRemoveShareSticker = (stickerId) => {
    saveShareStickerSnapshot(placedShareStickers)
    setPlacedShareStickers((currentStickers) => currentStickers.filter((sticker) => sticker.id !== stickerId))
  }

  const handleResetShareStickers = () => {
    if (!placedShareStickers.length) return

    saveShareStickerSnapshot(placedShareStickers)
    setPlacedShareStickers([])
  }

  const handleUndoShareSticker = () => {
    const previousStickers = shareStickerHistoryRef.current.at(-1)
    if (!previousStickers) return

    shareStickerHistoryRef.current = shareStickerHistoryRef.current.slice(0, -1)
    setShareStickerHistoryCount(shareStickerHistoryRef.current.length)
    setPlacedShareStickers(previousStickers)
  }

  const handleNativeShareQuote = async () => {
    if (!quote) return

    const shareData = {
      title: '138.loveyourself',
      text: quote,
      url: window.location.href.split('#')[0],
    }

    try {
      const imageBlob = await createShareImageBlob({ activeShareFrame, placedShareStickers, quote, shareTextColor })
      const imageFile = new File([imageBlob], '138-love-yourself-quote.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [imageFile] })) {
        await navigator.share({
          ...shareData,
          files: [imageFile],
        })
        setIsShareSheetOpen(false)
        showToast(copy.toasts.sharedFrame)
        return
      }

      if (navigator.share) {
        await navigator.share(shareData)
        setIsShareSheetOpen(false)
        showToast(copy.toasts.sharedQuote)
        return
      }

      await navigator.clipboard.writeText(`${quote}\n\n${shareData.url}`)
      showToast(copy.toasts.copied)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast(copy.toasts.shareFailed)
      }
    }
  }

  const handleCopyShareQuote = async () => {
    if (!quote) return

    try {
      await navigator.clipboard.writeText(`${quote}\n\n${window.location.href.split('#')[0]}`)
      showToast(copy.toasts.copied)
    } catch {
      showToast(copy.toasts.copyFailed)
    }
  }

  const handleDownloadShareImage = async () => {
    if (!quote) return

    try {
      const imageBlob = await createShareImageBlob({ activeShareFrame, placedShareStickers, quote, shareTextColor })
      const imageUrl = URL.createObjectURL(imageBlob)
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = '138-love-yourself-quote.png'
      link.click()
      URL.revokeObjectURL(imageUrl)
      showToast(copy.toasts.imageCreated)
    } catch {
      showToast(copy.toasts.imageFailed)
    }
  }

  const handleShareInstagramStory = async () => {
    if (!quote) return

    try {
      const imageBlob = await createShareImageBlob({ activeShareFrame, placedShareStickers, quote, shareTextColor })
      const imageFile = new File([imageBlob], '138-love-yourself-story.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [imageFile] })) {
        await navigator.share({
          files: [imageFile],
          title: '138.loveyourself',
        })
        showToast(copy.toasts.chooseInstagram)
        return
      }

      const imageUrl = URL.createObjectURL(imageBlob)
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = '138-love-yourself-story.png'
      link.click()
      URL.revokeObjectURL(imageUrl)
      showToast(copy.toasts.downloadedFallback)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast(copy.toasts.instagramFailed)
      }
    }
  }

  const handleAddCustomFrame = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast(copy.toasts.chooseImageFile)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const nextFrame = {
        id: `custom-${Date.now()}`,
        label: file.name.replace(/\.[^.]+$/, '') || 'Custom',
        background: '#EDE5D2',
        card: '#8fc3d4',
        accent: '#EDE5D2',
        text: '#4789C8',
        imageUrl: reader.result,
      }
      const nextFrames = [...customShareFrames, nextFrame]

      setCustomShareFrames(nextFrames)
      setActiveShareFrameId(nextFrame.id)
      setShareTextColor(nextFrame.text)

      try {
        localStorage.setItem(customShareFramesStorageKey, JSON.stringify(nextFrames))
      } catch {
        showToast(copy.toasts.frameTooLarge)
        return
      }

      showToast(copy.toasts.frameAdded)
    }
    reader.onerror = () => showToast(copy.toasts.imageReadFailed)
    reader.readAsDataURL(file)
  }

  const handleIceDragStart = (event) => {
    if (!canAddIceCube) return

    event.preventDefault()
    isIceDragFinishingRef.current = false
    latestIceDragPositionRef.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDraggingIcePosition({ x: event.clientX, y: event.clientY, isDropping: false, isReturning: false })
  }

  const handleIceDragEnd = (event) => {
    if (!draggingIcePosition || draggingIcePosition.isDropping) return
    event.preventDefault()
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    finishIceDrag(event.clientX, event.clientY)
  }

  const handleResetTimer = () => {
    setIsTimerRunning(false)
    setTimerPhase('focus')
    setIceCubeCount(0)
    setRetainedWaterCubes(0)
    setSecondsLeft(0)
    trackAnalyticsEvent('timer_reset', 'focus-room')
  }

  const handleTimerStartToggle = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false)
      trackAnalyticsEvent('timer_pause', 'focus-room', { phase: timerPhase })
      return
    }

    if (timerPhase === 'shortBreakReady') {
      setTimerPhase('shortBreak')
      setSecondsLeft(shortBreakSeconds)
      setIsTimerRunning(true)
      trackAnalyticsEvent('timer_start', 'focus-room', { phase: 'shortBreak' })
      return
    }

    if (timerPhase === 'longBreakReady') {
      setTimerPhase('longBreak')
      setSecondsLeft(longBreakSeconds)
      setIsTimerRunning(true)
      trackAnalyticsEvent('timer_start', 'focus-room', { phase: 'longBreak' })
      return
    }

    if (isBreakPhase) {
      setIsTimerRunning(true)
      trackAnalyticsEvent('timer_start', 'focus-room', { phase: timerPhase })
      return
    }

    if (iceCubeCount === 0 || totalIceSeconds === 0) {
      return
    }

    if (secondsLeft === 0) {
      setSecondsLeft(totalIceSeconds)
    }

    setIsTimerRunning(true)
    trackAnalyticsEvent('timer_start', 'focus-room', { phase: 'focus', iceCubeCount })
  }

  const handleStartBreak = (breakType) => {
    setIsTimerRunning(true)
    setTimerPhase(breakType === 'long' ? 'longBreak' : 'shortBreak')
    setSecondsLeft(breakType === 'long' ? longBreakSeconds : shortBreakSeconds)
  }

  const handleSkipBreak = () => {
    setIsTimerRunning(false)
    setTimerPhase('focus')
    setSecondsLeft(iceCubeCount * iceCubeSeconds)
  }

  const handleAmbientSoundToggle = (soundId) => {
    setActiveAmbientSound((currentSound) => (currentSound === soundId ? null : soundId))
    trackAnalyticsEvent('ambient_toggle', 'focus-room', { soundId })
  }

  const revealDecisionMessage = (currentMessage = '') => {
    const nextMessage = getNextDecisionMessage(currentMessage)

    setDecisionMessage(nextMessage)
    setDecisionThread((currentThread) => {
      const nextThread = [...currentThread]
      const lastEntry = nextThread[nextThread.length - 1]

      if (!lastEntry || !lastEntry.isThinking) return nextThread

      nextThread[nextThread.length - 1] = {
        ...lastEntry,
        isThinking: false,
        response: nextMessage,
      }

      return nextThread
    })
    setDecisionAnimationKey((currentKey) => currentKey + 1)
    setDecisionMotion('revealed')
  }

  const handleAskDecision = (prompt = 'xin 1 dấu hiệu') => {
    const normalizedPrompt = String(prompt || '').trim()
    if (!normalizedPrompt) return

    window.clearTimeout(decisionTimeoutRef.current)
    setDecisionMotion('thinking')
    setDecisionThread((currentThread) => [
      ...currentThread.map((entry) => ({ ...entry, isThinking: false })),
      { id: `${Date.now()}-${currentThread.length}`, isThinking: true, prompt: normalizedPrompt, response: '' },
    ])
    setDecisionAnimationKey((currentKey) => currentKey + 1)
    trackAnalyticsEvent('decision_ask', 'card-room', { promptLength: normalizedPrompt.length })
    decisionTimeoutRef.current = window.setTimeout(() => {
      revealDecisionMessage(decisionMessage)
    }, 2000)
  }

  return {
    activeAmbientSound,
    activeShareFrame,
    activeShareFrameId,
    activeTimerMessage,
    allShareFrames,
    canAddIceCube,
    copy,
    customFrameInputRef,
    decisionAnimationKey,
    decisionMessage,
    decisionMotion,
    decisionThread,
    draggingIcePosition,
    handleAddCustomFrame,
    handleAmbientSoundToggle,
    handleAskDecision,
    handleCopyShareQuote,
    handleDownloadShareImage,
    handleFlipShareSticker,
    handleIceCubeCountChange,
    handleIceDragEnd,
    handleIceDragStart,
    handleInterfaceClick,
    handleBeginMoveShareSticker,
    handleColorShareSticker,
    handleNativeShareQuote,
    handleOpenLetter,
    handleMoveShareSticker,
    handlePlaceShareSticker,
    handleResizeShareSticker,
    handleRemoveShareSticker,
    handleResetShareStickers,
    handleRotateShareSticker,
    handleResetTimer,
    handleSelectShareFrame,
    handleShareInstagramStory,
    handleShareQuote,
    handleSkipBreak,
    handleStartBreak,
    handleTimerStartToggle,
    handleTransformShareSticker,
    handleToggleSaveQuote,
    handleUndoShareSticker,
    iceCubeCount,
    iceCupRef,
    iceDropAnimationKey,
    iceDropDepth,
    iceFadeProgress,
    iceFloatLift,
    iceImpactBottom,
    iceMeltProgress,
    iceShrinkProgress,
    iceWaterProgress,
    iceWaterSurface,
    isIceDroppingIntoCup,
    isQuoteSaved,
    isShareSheetOpen,
    isTimerRunning,
    maxSelectableIceCubes,
    openedLetter,
    openedLetterId,
    placedShareStickers,
    quote,
    quoteLetters,
    secondsLeft,
    setDraggingIcePosition,
    setIsShareSheetOpen,
    setShareTextColor,
    shareQuoteFontSize,
    shareStickerHistoryCount,
    shareTextColor,
    toastMessage,
    timerPhase,
  }
}
