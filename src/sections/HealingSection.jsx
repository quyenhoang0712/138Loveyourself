import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { assetUrl } from '../utils/assets'

const pieceValues = { b: 330, k: 0, n: 320, p: 100, q: 900, r: 500 }
const capturedPieceOrder = { q: 0, r: 1, b: 2, n: 3, p: 4 }
const centerSquares = new Set(['d4', 'd5', 'e4', 'e5'])
const botSearchDepth = 2
const pieceNames = { b: 'tượng', k: 'vua', n: 'mã', p: 'tốt', q: 'hậu', r: 'xe' }
const pieceAssetNames = { b: 'tuong', k: 'vua', n: 'ma', p: 'tot', q: 'hau', r: 'xe' }

function getPieceAsset(type) {
  return assetUrl(`thong-diep/${pieceAssetNames[type]}.svg`)
}
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
            <img src={getPieceAsset(piece.type)} alt="" />
          </span>
        )) : <span className="healing-captured-empty">Chưa ăn quân</span>}
      </span>
      {materialLead ? <strong>{materialLead}</strong> : null}
    </div>
  )
}

const game2048Directions = {
  left: Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => row * 4 + column)),
  right: Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => row * 4 + (3 - column))),
  up: Array.from({ length: 4 }, (_, column) => Array.from({ length: 4 }, (_, row) => row * 4 + column)),
  down: Array.from({ length: 4 }, (_, column) => Array.from({ length: 4 }, (_, row) => (3 - row) * 4 + column)),
}

function addRandom2048Tile(board) {
  const emptyIndexes = board.flatMap((value, index) => value ? [] : [index])
  if (!emptyIndexes.length) return board
  const nextBoard = [...board]
  const index = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)]
  nextBoard[index] = Math.random() < 0.9 ? 2 : 4
  return nextBoard
}

function create2048Board() {
  return addRandom2048Tile(addRandom2048Tile(Array(16).fill(0)))
}

function move2048Board(board, direction) {
  const nextBoard = Array(16).fill(0)
  const motions = []
  const mergedIndexes = []
  let gainedScore = 0

  game2048Directions[direction].forEach((indexes) => {
    const tiles = indexes
      .map((boardIndex) => ({ boardIndex, value: board[boardIndex] }))
      .filter((tile) => tile.value)
    let destinationOffset = 0

    for (let index = 0; index < tiles.length; index += 1) {
      const tile = tiles[index]
      const nextTile = tiles[index + 1]
      const destinationIndex = indexes[destinationOffset]

      if (tile.value === nextTile?.value) {
        const mergedValue = tile.value * 2
        nextBoard[destinationIndex] = mergedValue
        motions.push(
          { from: tile.boardIndex, merged: true, to: destinationIndex, value: tile.value },
          { from: nextTile.boardIndex, merged: true, to: destinationIndex, value: nextTile.value },
        )
        mergedIndexes.push(destinationIndex)
        gainedScore += mergedValue
        index += 1
      } else {
        nextBoard[destinationIndex] = tile.value
        motions.push({ from: tile.boardIndex, merged: false, to: destinationIndex, value: tile.value })
      }

      destinationOffset += 1
    }
  })

  return {
    board: nextBoard,
    changed: nextBoard.some((value, index) => value !== board[index]),
    gainedScore,
    mergedIndexes,
    motions,
  }
}

function canMove2048(board) {
  if (board.some((value) => value === 0)) return true
  return board.some((value, index) => (
    (index % 4 < 3 && value === board[index + 1]) ||
    (index < 12 && value === board[index + 4])
  ))
}

export function HealingSection() {
  const [activeGame, setActiveGame] = useState('chess')
  const [game2048, setGame2048] = useState(() => ({
    board: create2048Board(), lastMergedIndexes: [], lastNewTileIndex: -1, moveCount: 0, score: 0,
  }))
  const [game2048Animation, setGame2048Animation] = useState(null)
  const [is2048Started, setIs2048Started] = useState(false)
  const [isGameTransitioning, setIsGameTransitioning] = useState(false)
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
  const gameTransitionTimersRef = useRef([])
  const didPlay2048WinRef = useRef(false)
  const didPlay2048GameOverRef = useRef(false)
  const didPlayChessGameOverRef = useRef(false)
  const game2048AnimationTimerRef = useRef(null)
  const game2048PointerStartRef = useRef(null)
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
  const game2048Board = game2048.board
  const game2048Score = game2048.score
  const highest2048Tile = Math.max(...game2048Board)
  const is2048GameOver = is2048Started && !canMove2048(game2048Board)
  const game2048Status = !is2048Started
    ? 'Nhấn Bắt đầu khi bạn đã sẵn sàng.'
    : highest2048Tile >= 2048
    ? 'Bạn đã chạm tới 2048! Có thể tiếp tục chơi nha.'
    : is2048GameOver ? 'Hết nước đi rồi. Mình chơi ván mới nhé!' : 'Ghép các ô giống nhau để chạm tới 2048.'

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

  const playChessSelectSound = useCallback(() => {
    playChessTone({ duration: 0.045, frequency: 360, gain: 0.022, type: 'sine' })
  }, [playChessTone])

  const playChessCheckSound = useCallback(() => {
    playChessTone({ delay: 0.12, duration: 0.1, frequency: 880, gain: 0.045, type: 'triangle' })
    playChessTone({ delay: 0.22, duration: 0.12, frequency: 1174.66, gain: 0.035, type: 'sine' })
  }, [playChessTone])

  const playCaptureSound = useCallback(() => {
    playChessTone({ duration: 0.11, frequency: 150, gain: 0.07, type: 'square' })
    playChessTone({ delay: 0.055, duration: 0.12, frequency: 105, gain: 0.045, type: 'triangle' })
  }, [playChessTone])

  const playGameSwitchSound = useCallback(() => {
    playChessTone({ duration: 0.12, frequency: 330, gain: 0.035, type: 'sine' })
    playChessTone({ delay: 0.08, duration: 0.13, frequency: 493.88, gain: 0.04, type: 'sine' })
    playChessTone({ delay: 0.16, duration: 0.16, frequency: 659.25, gain: 0.035, type: 'triangle' })
  }, [playChessTone])

  const play2048MoveSound = useCallback((didMerge) => {
    playChessTone({ duration: 0.055, frequency: didMerge ? 520 : 260, gain: 0.035, type: 'triangle' })
    if (didMerge) playChessTone({ delay: 0.045, duration: 0.11, frequency: 780, gain: 0.04, type: 'sine' })
  }, [playChessTone])

  const playBlockedMoveSound = useCallback(() => {
    playChessTone({ duration: 0.06, frequency: 125, gain: 0.025, type: 'square' })
  }, [playChessTone])

  const playGameStartSound = useCallback(() => {
    ;[392, 523.25, 659.25].forEach((frequency, index) => {
      playChessTone({ delay: index * 0.075, duration: 0.14, frequency, gain: 0.035, type: 'sine' })
    })
  }, [playChessTone])

  const playWinSound = useCallback(() => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      playChessTone({ delay: index * 0.1, duration: 0.2, frequency, gain: 0.04, type: 'triangle' })
    })
  }, [playChessTone])

  const playGameOverSound = useCallback(() => {
    ;[392, 311.13, 233.08, 174.61].forEach((frequency, index) => {
      playChessTone({ delay: index * 0.12, duration: 0.22, frequency, gain: 0.04, type: 'triangle' })
    })
  }, [playChessTone])

  const handle2048Move = useCallback((direction) => {
    if (!is2048Started || is2048GameOver || game2048Animation) return
    const result = move2048Board(game2048Board, direction)
    if (!result.changed) {
      playBlockedMoveSound()
      return
    }

    play2048MoveSound(result.gainedScore > 0)
    const nextBoard = addRandom2048Tile(result.board)
    const newTileIndex = nextBoard.findIndex((value, index) => value && !result.board[index])
    setGame2048Animation({ id: game2048.moveCount + 1, motions: result.motions })
    setGame2048({
      board: nextBoard,
      lastMergedIndexes: result.mergedIndexes,
      lastNewTileIndex: newTileIndex,
      score: game2048Score + result.gainedScore,
      moveCount: game2048.moveCount + 1,
    })
    window.clearTimeout(game2048AnimationTimerRef.current)
    game2048AnimationTimerRef.current = window.setTimeout(() => setGame2048Animation(null), 190)
  }, [game2048.moveCount, game2048Animation, game2048Board, game2048Score, is2048GameOver, is2048Started, play2048MoveSound, playBlockedMoveSound])

  const start2048 = useCallback(() => {
    didPlay2048WinRef.current = false
    didPlay2048GameOverRef.current = false
    window.clearTimeout(game2048AnimationTimerRef.current)
    setGame2048Animation(null)
    setGame2048({ board: create2048Board(), lastMergedIndexes: [], lastNewTileIndex: -1, score: 0, moveCount: 0 })
    setIs2048Started(true)
    playGameStartSound()
  }, [playGameStartSound])

  const handle2048PointerDown = useCallback((event) => {
    if (!is2048Started || is2048GameOver || game2048Animation) return
    game2048PointerStartRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    if (event.nativeEvent.isTrusted) event.currentTarget.setPointerCapture?.(event.pointerId)
  }, [game2048Animation, is2048GameOver, is2048Started])

  const handle2048PointerUp = useCallback((event) => {
    const start = game2048PointerStartRef.current
    game2048PointerStartRef.current = null
    if (!start || start.pointerId !== event.pointerId) return
    const moveX = event.clientX - start.x
    const moveY = event.clientY - start.y
    if (Math.max(Math.abs(moveX), Math.abs(moveY)) < 24) return
    const direction = Math.abs(moveX) > Math.abs(moveY)
      ? moveX > 0 ? 'right' : 'left'
      : moveY > 0 ? 'down' : 'up'
    handle2048Move(direction)
  }, [handle2048Move])

  const handleGameSwitch = useCallback(() => {
    if (isGameTransitioning) return
    gameTransitionTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    playGameSwitchSound()
    setIsGameTransitioning(true)
    const swapTimer = window.setTimeout(() => {
      setActiveGame((currentGame) => currentGame === 'chess' ? '2048' : 'chess')
    }, 220)
    const finishTimer = window.setTimeout(() => setIsGameTransitioning(false), 520)
    gameTransitionTimersRef.current = [swapTimer, finishTimer]
  }, [isGameTransitioning, playGameSwitchSound])

  useEffect(() => () => {
    gameTransitionTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    window.clearTimeout(game2048AnimationTimerRef.current)
  }, [])

  useEffect(() => {
    if (activeGame !== '2048' || !is2048Started) return undefined
    const keyDirections = {
      ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up',
      a: 'left', d: 'right', s: 'down', w: 'up',
    }
    const handleKeyDown = (event) => {
      const direction = keyDirections[event.key]
      if (!direction) return
      event.preventDefault()
      handle2048Move(direction)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeGame, handle2048Move, is2048Started])

  useEffect(() => {
    if (highest2048Tile >= 2048 && !didPlay2048WinRef.current) {
      didPlay2048WinRef.current = true
      playWinSound()
    }
  }, [highest2048Tile, playWinSound])

  useEffect(() => {
    if (is2048GameOver && !didPlay2048GameOverRef.current) {
      didPlay2048GameOverRef.current = true
      playGameOverSound()
    }
  }, [is2048GameOver, playGameOverSound])

  useEffect(() => {
    if (!chess.isGameOver()) {
      didPlayChessGameOverRef.current = false
      return
    }
    if (didPlayChessGameOverRef.current) return
    didPlayChessGameOverRef.current = true
    const playerWon = chess.isCheckmate() && chess.turn() !== playerColor
    if (playerWon) playWinSound()
    else playGameOverSound()
  }, [chess, playGameOverSound, playWinSound, playerColor])

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
      if (botMove.captured) playCaptureSound()
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
  }, [botColor, chess, gameFen, isBoardSwitching, isPiecesEntering, playCaptureSound, playChessCheckSound, playChessMoveSound, playerColor])

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
      if (piece?.color === playerColor) {
        playChessSelectSound()
        setSelectedSquare(square)
      }
      return
    }

    if (selectedSquare === square) {
      setSelectedSquare(null)
      return
    }

    if (piece?.color === playerColor) {
      playChessSelectSound()
      setSelectedSquare(square)
      return
    }

    const targetMove = legalMoveMap.get(square)
    if (!targetMove) return

    const nextChess = new Chess(gameFen)
    nextChess.move(getMovePayload(targetMove))
    playChessMoveSound()
    if (targetMove.captured) playCaptureSound()
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

    didPlayChessGameOverRef.current = false
    playGameStartSound()
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

    didPlayChessGameOverRef.current = false
    playGameStartSound()
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
      <header className="healing-room-title">
        <h1>Phòng thư giãn</h1>
      </header>
      <div className={`healing-game-stage ${isGameTransitioning ? 'is-game-switching' : ''}`}>
        <h2>{activeGame === 'chess' ? 'CỜ VUA' : '2048'}</h2>
        {activeGame === 'chess' ? (
        <div className="healing-simple-shell">
          <div className="healing-chess-panel">
          <div className="healing-chess-heading">
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
            <span>Bạn đi quân {playerColor === 'w' ? 'trắng' : 'đen'}</span>
            <button type="button" onClick={resetChessBoard}>Đặt lại</button>
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
                        <span>
                          <img
                            className="healing-chess-piece-image"
                            src={getPieceAsset(piece.type)}
                            alt=""
                            draggable="false"
                          />
                        </span>
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
        ) : (
          <div className="healing-simple-shell healing-2048-shell">
            <section className="healing-2048-panel" aria-labelledby="healing-2048-title">
              <header className="healing-2048-heading">
                <div><span>Điểm</span><strong>{game2048Score}</strong></div>
                <p id="healing-2048-title">Ghép ô thật nhẹ nhàng</p>
                <button type="button" onClick={start2048}>{is2048Started ? 'Ván mới' : 'Bắt đầu'}</button>
              </header>
              <p className="healing-2048-status">{game2048Status}</p>
              <div className="healing-2048-board-wrap">
                <div
                  className={`healing-2048-board ${game2048Animation ? 'is-animating' : ''}`}
                  role="grid"
                  aria-label={`Bàn 2048, điểm ${game2048Score}. Có thể vuốt trực tiếp để di chuyển.`}
                  onPointerCancel={() => { game2048PointerStartRef.current = null }}
                  onPointerDown={handle2048PointerDown}
                  onPointerUp={handle2048PointerUp}
                >
                  {game2048Board.map((value, index) => (
                    <div
                      className="healing-2048-cell"
                      role="gridcell"
                      aria-label={value ? `Ô ${value}` : 'Ô trống'}
                      key={index}
                    >
                      {!game2048Animation && value ? (
                        <span
                          className={`healing-2048-tile tile-${value} ${game2048.lastMergedIndexes.includes(index) ? 'is-merged' : ''} ${game2048.lastNewTileIndex === index ? 'is-new' : ''}`}
                          key={`${index}-${value}-${game2048.moveCount}`}
                        >{value}</span>
                      ) : null}
                    </div>
                  ))}
                  {game2048Animation ? (
                    <div className="healing-2048-motion-layer" aria-hidden="true">
                      {game2048Animation.motions.map((motion, index) => (
                        <span
                          className={`healing-2048-tile healing-2048-moving-tile tile-${motion.value} ${motion.merged ? 'is-merging-source' : ''}`}
                          key={`${game2048Animation.id}-${motion.from}-${motion.to}-${index}`}
                          style={{
                            '--tile-dx': (motion.from % 4) - (motion.to % 4),
                            '--tile-dy': Math.floor(motion.from / 4) - Math.floor(motion.to / 4),
                            gridColumn: (motion.to % 4) + 1,
                            gridRow: Math.floor(motion.to / 4) + 1,
                          }}
                        >{motion.value}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
                {is2048GameOver ? (
                  <div className="healing-2048-game-over" role="alert">
                    <strong>Thua cuộc</strong>
                    <span>Điểm của bạn: {game2048Score}</span>
                    <button type="button" onClick={start2048}>Chơi lại</button>
                  </div>
                ) : null}
              </div>
              <div className="healing-2048-controls" aria-label="Điều khiển 2048">
                <button type="button" disabled={!is2048Started || is2048GameOver || Boolean(game2048Animation)} aria-label="Di chuyển lên" onClick={() => handle2048Move('up')}>↑</button>
                <button type="button" disabled={!is2048Started || is2048GameOver || Boolean(game2048Animation)} aria-label="Di chuyển sang trái" onClick={() => handle2048Move('left')}>←</button>
                <button type="button" disabled={!is2048Started || is2048GameOver || Boolean(game2048Animation)} aria-label="Di chuyển xuống" onClick={() => handle2048Move('down')}>↓</button>
                <button type="button" disabled={!is2048Started || is2048GameOver || Boolean(game2048Animation)} aria-label="Di chuyển sang phải" onClick={() => handle2048Move('right')}>→</button>
              </div>
              <small>Dùng phím mũi tên hoặc W A S D trên bàn phím.</small>
            </section>
          </div>
        )}
        <div className="healing-game-switch-controls" aria-label="Chuyển trò chơi">
          <button
            className="healing-room-arrow healing-room-arrow-left"
            type="button"
            aria-label={`Xem trò chơi trước: ${activeGame === 'chess' ? '2048' : 'Cờ vua'}`}
            disabled={isGameTransitioning}
            onClick={handleGameSwitch}
          >←</button>
          <button
            className="healing-room-arrow healing-room-arrow-right"
            type="button"
            aria-label={`Xem trò chơi tiếp theo: ${activeGame === 'chess' ? '2048' : 'Cờ vua'}`}
            disabled={isGameTransitioning}
            onClick={handleGameSwitch}
          >→</button>
        </div>
      </div>
    </section>
  )
}
