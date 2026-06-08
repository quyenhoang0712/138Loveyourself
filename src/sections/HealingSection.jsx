import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'

const pieceValues = { b: 330, k: 0, n: 320, p: 100, q: 900, r: 500 }
const classicBoardPieceSymbols = {
  b: { b: '♝', n: '♞', r: '♜' },
  w: { b: '♗', n: '♘', r: '♖' },
}
const capturedPieceSymbols = {
  b: { b: '♝', n: '♞', p: '♟', q: '♛', r: '♜' },
  w: { b: '♗', n: '♘', p: '♙', q: '♕', r: '♖' },
}
const capturedPieceOrder = { q: 0, r: 1, b: 2, n: 3, p: 4 }
const centerSquares = new Set(['d4', 'd5', 'e4', 'e5'])
const botSearchDepth = 2
const pieceNames = { b: 'tượng', k: 'vua', n: 'mã', p: 'tốt', q: 'hậu', r: 'xe' }
const pieceSquareTables = {
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 12, 8, 8, 8, 8, 12, -10,
    -10, 10, 16, 18, 18, 16, 10, -10,
    -10, 8, 18, 22, 22, 18, 8, -10,
    -10, 8, 18, 22, 22, 18, 8, -10,
    -10, 10, 16, 18, 18, 16, 10, -10,
    -10, 12, 8, 8, 8, 8, 12, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  k: [
    24, 30, 12, 0, 0, 12, 30, 24,
    18, 18, 0, 0, 0, 0, 18, 18,
    -8, -18, -24, -28, -28, -24, -18, -8,
    -26, -34, -40, -48, -48, -40, -34, -26,
    -36, -44, -50, -56, -56, -50, -44, -36,
    -42, -48, -56, -64, -64, -56, -48, -42,
    -46, -54, -62, -72, -72, -62, -54, -46,
    -50, -58, -68, -80, -80, -68, -58, -50,
  ],
  n: [
    -48, -28, -18, -14, -14, -18, -28, -48,
    -30, -12, 4, 8, 8, 4, -12, -30,
    -18, 8, 16, 22, 22, 16, 8, -18,
    -14, 10, 22, 28, 28, 22, 10, -14,
    -14, 10, 22, 28, 28, 22, 10, -14,
    -18, 8, 16, 22, 22, 16, 8, -18,
    -30, -12, 4, 8, 8, 4, -12, -30,
    -48, -28, -18, -14, -14, -18, -28, -48,
  ],
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    52, 52, 52, 52, 52, 52, 52, 52,
    18, 18, 24, 32, 32, 24, 18, 18,
    8, 8, 14, 26, 26, 14, 8, 8,
    2, 2, 8, 22, 22, 8, 2, 2,
    4, -4, -8, 10, 10, -8, -4, 4,
    4, 8, 8, -24, -24, 8, 8, 4,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  q: [
    -18, -10, -10, -4, -4, -10, -10, -18,
    -8, 4, 6, 6, 6, 6, 4, -8,
    -8, 6, 10, 12, 12, 10, 6, -8,
    -4, 6, 12, 16, 16, 12, 6, -4,
    0, 6, 12, 16, 16, 12, 6, -4,
    -8, 8, 12, 12, 12, 12, 8, -8,
    -8, 4, 8, 8, 8, 8, 4, -8,
    -18, -10, -10, -4, -4, -10, -10, -18,
  ],
  r: [
    0, 0, 4, 8, 8, 4, 0, 0,
    10, 14, 14, 14, 14, 14, 14, 10,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4,
    0, 0, 4, 8, 8, 4, 0, 0,
  ],
}

function getFreshChess() {
  return new Chess()
}

function HealingChessIcon({ type }) {
  return (
    <svg aria-hidden="true" className="healing-chess-pawn-icon" viewBox="0 0 116 151">
      <path d="M109.988 151H5.57481C2.25519 151 -0.318739 148.117 0.0320398 144.814C3.11936 115.65 27.797 92.9238 57.7828 92.9238C87.7686 92.9238 112.444 115.65 115.534 144.814C115.884 148.115 113.31 151 109.991 151H109.988Z" />
      <path d="M18.315 42.598C8.99036 32.869 8.99036 17.0374 18.315 7.30851C25.1401 0.190683 35.3592 -2.09752 45.1601 2.09094C47.3995 3.04803 49.4275 4.47671 51.1396 6.26313L55.7694 11.0951C56.8752 12.2496 58.6871 12.2496 59.7929 11.0951L64.4227 6.26313C66.1348 4.47671 68.1605 3.04803 70.4022 2.09094C80.2054 -2.09752 90.4245 0.190683 97.2472 7.30851C106.572 17.0374 106.572 32.869 97.2472 42.598L61.8046 79.5739C59.5908 81.8831 55.9692 81.8831 53.7576 79.5739L18.315 42.598Z" />
      {type === 'q' ? (
        <>
          <g className="healing-chess-piece-detail" transform="matrix(0.72 0.16 -0.16 0.72 58 -66)">
            <path d="M20 44 32 12 47 38 58 6 69 38 84 12 96 44 88 60H28L20 44Z" />
            <path d="M29 60H87V75H29V60Z" />
            <path d="M32 12H32.8M58 6H58.8M84 12H84.8" />
          </g>
          <g className="healing-chess-piece-detail healing-chess-robe">
            <path d="M35 98C44 111 72 111 81 98" />
            <path d="M23 139C35 126 42 113 45 99" />
            <path d="M93 139C81 126 74 113 71 99" />
            <path d="M58 101V139" />
          </g>
        </>
      ) : null}
      {type === 'k' ? (
        <>
          <g className="healing-chess-piece-detail" transform="translate(16 -65) scale(0.74)">
            <path d="M24 60C30 37 43 22 58 22C73 22 86 37 92 60L82 70H34L24 60Z" />
            <path d="M58 4V30M47 17H69" />
            <path d="M38 70H78" />
          </g>
          <g className="healing-chess-piece-detail healing-chess-king-regalia">
            <path d="M20 141C26 119 36 101 49 90" />
            <path d="M96 141C90 119 80 101 67 90" />
            <path d="M29 108C40 119 76 119 87 108" />
            <path d="M108 66V139" />
            <path d="M98 82H114M108 66H108.8" />
          </g>
        </>
      ) : null}
      {type === 'r' ? (
        <g className="healing-chess-piece-detail" transform="matrix(0.62 0.16 -0.16 0.62 62 -54)">
          <path d="M24 36V16H38V28H50V16H66V28H78V16H92V36L84 55H32L24 36Z" />
          <path d="M32 55H84V68H32V55Z" />
        </g>
      ) : null}
      {type === 'b' ? (
        <g className="healing-chess-piece-detail" transform="matrix(0.62 0.16 -0.16 0.62 62 -54)">
          <path d="M58 4C70 16 75 28 72 42C70 52 64 58 58 65C52 58 46 52 44 42C41 28 46 16 58 4Z" />
          <path d="M58 15V48" />
        </g>
      ) : null}
      {type === 'n' ? (
        <g className="healing-chess-piece-detail" transform="matrix(0.62 0.16 -0.16 0.62 62 -54)">
          <path d="M34 62C34 40 45 19 69 9C75 24 83 31 93 38C89 50 79 60 66 66L34 62Z" />
          <path d="M55 30 45 41M68 27H68.8" />
        </g>
      ) : null}
    </svg>
  )
}

function getMovePayload(move) {
  return move.promotion
    ? { from: move.from, promotion: move.promotion, to: move.to }
    : { from: move.from, to: move.to }
}

function getSquarePosition(square) {
  return {
    columnIndex: square.charCodeAt(0) - 97,
    rowIndex: 8 - Number(square[1]),
  }
}

function getDisplaySquarePosition(square, playerColor) {
  const { columnIndex, rowIndex } = getSquarePosition(square)

  return playerColor === 'b'
    ? { columnIndex: 7 - columnIndex, rowIndex: 7 - rowIndex }
    : { columnIndex, rowIndex }
}

function getBoardPieces(chess) {
  return chess.board().flatMap((row, rowIndex) => (
    row.flatMap((piece, columnIndex) => {
      if (!piece) return []

      return {
        piece,
        square: `${String.fromCharCode(97 + columnIndex)}${8 - rowIndex}`,
      }
    })
  ))
}

function getPieceDistance(firstSquare, secondSquare, playerColor) {
  const firstPosition = getDisplaySquarePosition(firstSquare, playerColor)
  const secondPosition = getDisplaySquarePosition(secondSquare, playerColor)

  return (
    Math.abs(firstPosition.columnIndex - secondPosition.columnIndex) +
    Math.abs(firstPosition.rowIndex - secondPosition.rowIndex)
  )
}

function getResetReturnStyles(fen, playerColor) {
  const currentPieces = getBoardPieces(new Chess(fen))
  const freshPieces = getBoardPieces(getFreshChess())
  const usedCurrentSquares = new Set()
  const styles = {}

  freshPieces.forEach(({ piece, square }) => {
    const sameSquarePiece = currentPieces.find((currentPiece) => (
      currentPiece.square === square &&
      currentPiece.piece.color === piece.color &&
      currentPiece.piece.type === piece.type
    ))

    if (sameSquarePiece) usedCurrentSquares.add(square)
  })

  freshPieces.forEach(({ piece, square }) => {
    if (usedCurrentSquares.has(square)) return

    const returnPiece = currentPieces
      .filter((currentPiece) => (
        !usedCurrentSquares.has(currentPiece.square) &&
        currentPiece.piece.color === piece.color &&
        currentPiece.piece.type === piece.type
      ))
      .sort((firstPiece, secondPiece) => (
        getPieceDistance(firstPiece.square, square, playerColor) -
        getPieceDistance(secondPiece.square, square, playerColor)
      ))[0]

    if (!returnPiece) return

    usedCurrentSquares.add(returnPiece.square)
    const fromPosition = getDisplaySquarePosition(returnPiece.square, playerColor)
    const toPosition = getDisplaySquarePosition(square, playerColor)

    styles[square] = {
      '--reset-move-x': fromPosition.columnIndex - toPosition.columnIndex,
      '--reset-move-y': fromPosition.rowIndex - toPosition.rowIndex,
      '--reset-return-delay': `${Math.min(getPieceDistance(returnPiece.square, square, playerColor) * 38, 190)}ms`,
    }
  })

  return styles
}

function getPieceSquareValue(piece, rowIndex, columnIndex) {
  const table = pieceSquareTables[piece.type]
  if (!table) return 0
  const blackIndex = rowIndex * 8 + columnIndex
  const whiteIndex = (7 - rowIndex) * 8 + columnIndex
  return table[piece.color === 'b' ? blackIndex : whiteIndex] || 0
}

function evaluatePosition(chess) {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? 100000 : -100000
  if (chess.isDraw() || chess.isStalemate()) return 0

  const boardScore = chess.board().reduce((score, row, rowIndex) => (
    score + row.reduce((rowScore, piece, columnIndex) => {
      if (!piece) return rowScore
      const value = (pieceValues[piece.type] || 0) + getPieceSquareValue(piece, rowIndex, columnIndex)
      return rowScore + (piece.color === 'b' ? value : -value)
    }, 0)
  ), 0)

  return boardScore + (chess.isCheck() ? (chess.turn() === 'w' ? 35 : -35) : 0)
}

function getScoreForColor(chess, color) {
  const score = evaluatePosition(chess)
  return color === 'b' ? score : -score
}

function getMoveScoreHint(move) {
  const capturedValue = move.captured ? pieceValues[move.captured] || 0 : 0
  const movingValue = pieceValues[move.piece] || 0
  const promotionValue = move.promotion ? pieceValues[move.promotion] || 0 : 0
  const centerBonus = centerSquares.has(move.to) ? 18 : 0

  return capturedValue * 10 - movingValue + promotionValue + centerBonus
}

function getOrderedMoves(chess) {
  return chess.moves({ verbose: true }).sort((firstMove, secondMove) => (
    getMoveScoreHint(secondMove) - getMoveScoreHint(firstMove)
  ))
}

function minimax(chess, depth, alpha, beta, botColor) {
  if (depth === 0 || chess.isGameOver()) return getScoreForColor(chess, botColor)

  const moves = getOrderedMoves(chess)
  if (chess.turn() === botColor) {
    let bestScore = -Infinity

    for (const move of moves) {
      chess.move(getMovePayload(move))
      bestScore = Math.max(bestScore, minimax(chess, depth - 1, alpha, beta, botColor))
      chess.undo()
      alpha = Math.max(alpha, bestScore)
      if (beta <= alpha) break
    }

    return bestScore
  }

  let bestScore = Infinity

  for (const move of moves) {
    chess.move(getMovePayload(move))
    bestScore = Math.min(bestScore, minimax(chess, depth - 1, alpha, beta, botColor))
    chess.undo()
    beta = Math.min(beta, bestScore)
    if (beta <= alpha) break
  }

  return bestScore
}

function getBotMove(fen, botColor) {
  const chess = new Chess(fen)
  const moves = getOrderedMoves(chess)
  if (!moves.length) return null

  const scoredMoves = moves.map((move) => {
    chess.move(getMovePayload(move))
    const score = minimax(chess, botSearchDepth - 1, -Infinity, Infinity, botColor)
    chess.undo()
    const tinyMistake = Math.random() * 42

    return { move, score: score + tinyMistake }
  })

  scoredMoves.sort((firstMove, secondMove) => secondMove.score - firstMove.score)
  const choicePool = Math.random() < 0.42 ? scoredMoves.slice(0, 4) : scoredMoves.slice(0, 2)
  return choicePool[Math.floor(Math.random() * choicePool.length)]?.move || scoredMoves[0].move
}

function getGameStatus(chess, isBotThinking, playerColor) {
  if (chess.isCheckmate()) return chess.turn() === playerColor ? 'Bot thắng bằng chiếu hết.' : 'Bạn thắng bằng chiếu hết.'
  if (chess.isDraw()) return 'Ván cờ hòa.'
  if (chess.isGameOver()) return 'Ván cờ kết thúc.'
  if (isBotThinking) return 'Bot đang nghĩ...'
  if (chess.turn() !== playerColor) return 'Đến lượt bot.'
  if (chess.isCheck()) return 'Bạn đang bị chiếu.'
  return 'Đến lượt bạn.'
}

function getCapturedScore(pieces) {
  return pieces.reduce((score, piece) => score + (pieceValues[piece.type] || 0), 0)
}

function getDisplayMaterialLead(score, otherScore) {
  const lead = Math.round((score - otherScore) / 100)
  return lead > 0 ? `+${lead}` : ''
}

function sortCapturedPieces(pieces) {
  return [...pieces].sort((firstPiece, secondPiece) => (
    (capturedPieceOrder[firstPiece.type] ?? 9) - (capturedPieceOrder[secondPiece.type] ?? 9)
  ))
}

function CapturedPiecesRow({ label, pieces, score, otherScore }) {
  const materialLead = getDisplayMaterialLead(score, otherScore)
  const sortedPieces = sortCapturedPieces(pieces)

  return (
    <div className="healing-captured-row">
      <span className="healing-captured-label">{label}</span>
      <span className="healing-captured-pieces" aria-label={sortedPieces.length ? `Quân ${label} đã ăn` : `${label} chưa ăn quân`}>
        {sortedPieces.length ? sortedPieces.map((piece, index) => (
          <span className={`healing-captured-piece piece-${piece.color}`} key={`${piece.type}-${index}`}>
            {capturedPieceSymbols[piece.color]?.[piece.type] || ''}
          </span>
        )) : <span className="healing-captured-empty">Chưa ăn quân</span>}
      </span>
      {materialLead ? <strong>{materialLead}</strong> : null}
    </div>
  )
}

export function HealingSection() {
  const [gameFen, setGameFen] = useState(() => getFreshChess().fen())
  const [playerColor, setPlayerColor] = useState('w')
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [lastMove, setLastMove] = useState(null)
  const [capturedPieces, setCapturedPieces] = useState({ b: [], w: [] })
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [isBoardSwitching, setIsBoardSwitching] = useState(false)
  const [isPiecesEntering, setIsPiecesEntering] = useState(false)
  const [pieceEnterMode, setPieceEnterMode] = useState('edge')
  const [resetReturnStyles, setResetReturnStyles] = useState({})
  const chessAudioContextRef = useRef(null)
  const chess = useMemo(() => new Chess(gameFen), [gameFen])
  const botColor = playerColor === 'w' ? 'b' : 'w'
  const boardRows = useMemo(() => {
    const rows = chess.board().map((row, rowIndex) => (
      row.map((piece, columnIndex) => ({ columnIndex, piece, rowIndex }))
    ))

    return playerColor === 'b'
      ? rows.slice().reverse().map((row) => row.slice().reverse())
      : rows
  }, [chess, playerColor])
  const legalMoves = useMemo(
    () => (selectedSquare ? chess.moves({ square: selectedSquare, verbose: true }) : []),
    [chess, selectedSquare],
  )
  const legalMoveMap = useMemo(() => new Map(legalMoves.map((move) => [move.to, move])), [legalMoves])
  const gameStatus = getGameStatus(chess, isBotThinking, playerColor)
  const playerCapturedPieces = capturedPieces[playerColor]
  const botCapturedPieces = capturedPieces[botColor]
  const playerCapturedScore = getCapturedScore(playerCapturedPieces)
  const botCapturedScore = getCapturedScore(botCapturedPieces)

  const getChessAudioContext = useCallback(() => {
    if (!chessAudioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return null
      chessAudioContextRef.current = new AudioContextClass()
    }

    if (chessAudioContextRef.current.state === 'suspended') {
      chessAudioContextRef.current.resume()
    }

    return chessAudioContextRef.current
  }, [])

  const playChessTone = useCallback(
    ({ delay = 0, duration = 0.08, frequency = 440, gain = 0.06, type = 'sine' }) => {
      const audioContext = getChessAudioContext()
      if (!audioContext) return

      const startTime = audioContext.currentTime + delay
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, startTime)
      gainNode.gain.setValueAtTime(0.0001, startTime)
      gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.012)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.03)
    },
    [getChessAudioContext],
  )

  const playChessMoveSound = useCallback(() => {
    playChessTone({ duration: 0.07, frequency: 190, gain: 0.055, type: 'triangle' })
    playChessTone({ delay: 0.035, duration: 0.055, frequency: 420, gain: 0.026, type: 'square' })
  }, [playChessTone])

  const playChessCheckSound = useCallback(() => {
    playChessTone({ delay: 0.12, duration: 0.1, frequency: 880, gain: 0.045, type: 'triangle' })
    playChessTone({ delay: 0.22, duration: 0.12, frequency: 1174.66, gain: 0.035, type: 'sine' })
  }, [playChessTone])

  useEffect(() => {
    if (chess.turn() !== botColor || chess.isGameOver() || isBoardSwitching || isPiecesEntering) {
      return undefined
    }

    const botMoveTimer = window.setTimeout(() => {
      const botMove = getBotMove(gameFen, botColor)
      if (!botMove) {
        setIsBotThinking(false)
        return
      }

      const nextChess = new Chess(gameFen)
      nextChess.move(getMovePayload(botMove))
      playChessMoveSound()
      if (nextChess.isCheck()) playChessCheckSound()
      setLastMove({ captured: Boolean(botMove.captured), from: botMove.from, to: botMove.to })
      if (botMove.captured) {
        setCapturedPieces((currentPieces) => ({
          ...currentPieces,
          [botColor]: [
            ...currentPieces[botColor],
            { color: playerColor, type: botMove.captured },
          ],
        }))
      }
      setGameFen(nextChess.fen())
      setSelectedSquare(null)
      setIsBotThinking(false)
    }, 1200)

    return () => window.clearTimeout(botMoveTimer)
  }, [botColor, chess, gameFen, isBoardSwitching, isPiecesEntering, playChessCheckSound, playChessMoveSound, playerColor])

  useEffect(() => {
    if (!isBoardSwitching) return undefined

    const boardSwitchTimer = window.setTimeout(() => {
      setIsBoardSwitching(false)
      setPieceEnterMode('edge')
      setIsPiecesEntering(true)
    }, 700)

    return () => window.clearTimeout(boardSwitchTimer)
  }, [isBoardSwitching])

  useEffect(() => {
    if (!isPiecesEntering) return undefined

    const piecesEnterTimer = window.setTimeout(() => {
      setIsPiecesEntering(false)
      if (pieceEnterMode === 'return') setResetReturnStyles({})
    }, 2600)

    return () => window.clearTimeout(piecesEnterTimer)
  }, [isPiecesEntering, pieceEnterMode])

  const handleChessSquareClick = (square, piece) => {
    if (
      chess.turn() !== playerColor ||
      chess.isGameOver() ||
      isBotThinking ||
      isBoardSwitching ||
      isPiecesEntering
    ) return

    if (!selectedSquare) {
      if (piece?.color === playerColor) setSelectedSquare(square)
      return
    }

    if (selectedSquare === square) {
      setSelectedSquare(null)
      return
    }

    if (piece?.color === playerColor) {
      setSelectedSquare(square)
      return
    }

    const targetMove = legalMoveMap.get(square)
    if (!targetMove) return

    const nextChess = new Chess(gameFen)
    nextChess.move(getMovePayload(targetMove))
    playChessMoveSound()
    if (nextChess.isCheck()) playChessCheckSound()
    setLastMove({ captured: Boolean(targetMove.captured), from: selectedSquare, to: square })
    if (targetMove.captured) {
      setCapturedPieces((currentPieces) => ({
        ...currentPieces,
        [playerColor]: [
          ...currentPieces[playerColor],
          { color: botColor, type: targetMove.captured },
        ],
      }))
    }
    setGameFen(nextChess.fen())
    setIsBotThinking(nextChess.turn() === botColor && !nextChess.isGameOver())
    setSelectedSquare(null)
  }

  const resetChessBoard = () => {
    const returnStyles = getResetReturnStyles(gameFen, playerColor)

    setResetReturnStyles(returnStyles)
    setGameFen(getFreshChess().fen())
    setCapturedPieces({ b: [], w: [] })
    setIsBotThinking(playerColor === 'b')
    setLastMove(null)
    setSelectedSquare(null)
    setIsBoardSwitching(false)
    setIsPiecesEntering(false)
    setPieceEnterMode('return')
    window.requestAnimationFrame(() => setIsPiecesEntering(true))
  }

  const handlePlayerColorChange = (nextColor) => {
    if (nextColor === playerColor) return

    setIsBoardSwitching(true)
    setIsPiecesEntering(false)
    setPieceEnterMode('edge')
    setResetReturnStyles({})
    setPlayerColor(nextColor)
    setGameFen(getFreshChess().fen())
    setCapturedPieces({ b: [], w: [] })
    setIsBotThinking(nextColor === 'b')
    setLastMove(null)
    setSelectedSquare(null)
  }

  return (
    <section className="healing-section">
      <div className="healing-simple-shell">
        <div className="healing-chess-panel">
          <div className="healing-chess-heading">
            <div>
              <p>Bàn cờ thư giãn</p>
              <span>Bạn đi quân {playerColor === 'w' ? 'trắng' : 'đen'}</span>
            </div>
            <div className="healing-chess-actions">
              <div className="healing-color-switch" aria-label="Chọn màu quân">
                <button
                  className={playerColor === 'w' ? 'is-active' : ''}
                  type="button"
                  onClick={() => handlePlayerColorChange('w')}
                >
                  Trắng
                </button>
                <button
                  className={playerColor === 'b' ? 'is-active' : ''}
                  type="button"
                  onClick={() => handlePlayerColorChange('b')}
                >
                  Đen
                </button>
              </div>
              <button type="button" onClick={resetChessBoard}>Đặt lại</button>
            </div>
          </div>
          <p className="healing-chess-status">{gameStatus}</p>
          <div className="healing-captured-scoreboard healing-captured-scoreboard-top" aria-label="Quân bot đã ăn">
            <CapturedPiecesRow
              label="Bot"
              pieces={botCapturedPieces}
              score={botCapturedScore}
              otherScore={playerCapturedScore}
            />
          </div>
          <div
            className={`healing-chess-board ${isBoardSwitching ? 'is-color-switching' : ''} ${isPiecesEntering ? 'is-pieces-entering' : ''} ${isPiecesEntering && pieceEnterMode === 'return' ? 'is-pieces-returning' : ''}`}
            aria-label="Bàn cờ vua thư giãn"
          >
            {boardRows.map((row, displayRowIndex) =>
              row.map(({ columnIndex, piece, rowIndex }, displayColumnIndex) => {
                const squareName = `${String.fromCharCode(97 + columnIndex)}${8 - rowIndex}`
                const legalMove = legalMoveMap.get(squareName)
                const isSelected = selectedSquare === squareName
                const isLastMove = lastMove?.from === squareName || lastMove?.to === squareName
                const isLastMoveTo = lastMove?.to === squareName
                const isCaptureMove = isLastMoveTo && lastMove?.captured
                const pieceLabel = piece ? pieceNames[piece.type] : ''
                const classicPieceSymbol = piece ? classicBoardPieceSymbols[piece.color]?.[piece.type] : ''
                const topDistance = displayRowIndex
                const rightDistance = 7 - displayColumnIndex
                const bottomDistance = 7 - displayRowIndex
                const leftDistance = displayColumnIndex
                const closestEdge = Math.min(topDistance, rightDistance, bottomDistance, leftDistance)
                const pieceEnterIndex = displayRowIndex < 2
                  ? displayRowIndex * 8 + displayColumnIndex
                  : (displayRowIndex - 4) * 8 + displayColumnIndex
                const pieceEnterX = closestEdge === leftDistance
                  ? '-280px'
                  : closestEdge === rightDistance
                    ? '280px'
                    : `${(displayColumnIndex - 3.5) * 22}px`
                const pieceEnterY = closestEdge === topDistance
                  ? '-280px'
                  : closestEdge === bottomDistance
                    ? '280px'
                    : `${(displayRowIndex - 3.5) * 22}px`
                const pieceEnterDelay = `${pieceEnterIndex * 52}ms`
                const resetMoveStyle = pieceEnterMode === 'return' ? resetReturnStyles[squareName] : undefined
                const moveStyle = isLastMoveTo
                  ? (() => {
                      const fromPosition = getDisplaySquarePosition(lastMove.from, playerColor)
                      const toPosition = getDisplaySquarePosition(lastMove.to, playerColor)

                      return {
                        '--move-x': fromPosition.columnIndex - toPosition.columnIndex,
                        '--move-y': fromPosition.rowIndex - toPosition.rowIndex,
                      }
                    })()
                  : undefined

                return (
                  <button
                    className={`healing-chess-square ${(rowIndex + columnIndex) % 2 === 0 ? 'is-light' : 'is-dark'} ${isSelected ? 'is-selected' : ''} ${legalMove ? 'is-legal-move' : ''} ${legalMove?.captured ? 'is-capture' : ''} ${isLastMove ? 'is-last-move' : ''} ${isLastMoveTo ? 'is-last-move-to' : ''} ${isCaptureMove ? 'is-capture-move' : ''}`}
                    type="button"
                    key={squareName}
                    aria-label={piece ? `Quân ${pieceLabel} ở ô ${squareName}` : `Ô trống ${squareName}`}
                    onClick={() => handleChessSquareClick(squareName, piece)}
                  >
                    {piece ? (
                      <span
                        className={`healing-chess-piece piece-${piece.color} piece-type-${piece.type} ${resetMoveStyle ? 'is-reset-return' : ''}`}
                        style={{
                          ...moveStyle,
                          ...resetMoveStyle,
                          '--piece-enter-delay': pieceEnterDelay,
                          '--piece-enter-x': pieceEnterX,
                          '--piece-enter-y': pieceEnterY,
                        }}
                      >
                        <span>{classicPieceSymbol || <HealingChessIcon type={piece.type} />}</span>
                      </span>
                    ) : null}
                  </button>
                )
              }),
            )}
          </div>
          <div className="healing-captured-scoreboard healing-captured-scoreboard-bottom" aria-label="Quân bạn đã ăn">
            <CapturedPiecesRow
              label="Bạn"
              pieces={playerCapturedPieces}
              score={playerCapturedScore}
              otherScore={botCapturedScore}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
