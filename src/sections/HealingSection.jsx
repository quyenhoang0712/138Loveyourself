import { useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'

const pieceSymbols = {
  b: { b: '♝', k: '♚', n: '♞', p: '♟', q: '♛', r: '♜' },
  w: { b: '♗', k: '♔', n: '♘', p: '♙', q: '♕', r: '♖' },
}
const pieceValues = { b: 330, k: 0, n: 320, p: 100, q: 900, r: 500 }
const centerSquares = new Set(['d4', 'd5', 'e4', 'e5'])
const botSearchDepth = 3
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
    const tinyMistake = Math.random() * 16

    return { move, score: score + tinyMistake }
  })

  scoredMoves.sort((firstMove, secondMove) => secondMove.score - firstMove.score)
  const choicePool = Math.random() < 0.08 ? scoredMoves.slice(0, 2) : scoredMoves.slice(0, 1)
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

export function HealingSection() {
  const [gameFen, setGameFen] = useState(() => getFreshChess().fen())
  const [playerColor, setPlayerColor] = useState('w')
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [lastMove, setLastMove] = useState(null)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [isBoardSwitching, setIsBoardSwitching] = useState(false)
  const [isPiecesEntering, setIsPiecesEntering] = useState(false)
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
      setLastMove({ captured: Boolean(botMove.captured), from: botMove.from, to: botMove.to })
      setGameFen(nextChess.fen())
      setSelectedSquare(null)
      setIsBotThinking(false)
    }, 1200)

    return () => window.clearTimeout(botMoveTimer)
  }, [botColor, chess, gameFen, isBoardSwitching, isPiecesEntering])

  useEffect(() => {
    if (!isBoardSwitching) return undefined

    const boardSwitchTimer = window.setTimeout(() => {
      setIsBoardSwitching(false)
      setIsPiecesEntering(true)
    }, 1050)

    return () => window.clearTimeout(boardSwitchTimer)
  }, [isBoardSwitching])

  useEffect(() => {
    if (!isPiecesEntering) return undefined

    const piecesEnterTimer = window.setTimeout(() => {
      setIsPiecesEntering(false)
    }, 2600)

    return () => window.clearTimeout(piecesEnterTimer)
  }, [isPiecesEntering])

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
    setLastMove({ captured: Boolean(targetMove.captured), from: selectedSquare, to: square })
    setGameFen(nextChess.fen())
    setIsBotThinking(nextChess.turn() === botColor && !nextChess.isGameOver())
    setSelectedSquare(null)
  }

  const resetChessBoard = () => {
    setGameFen(getFreshChess().fen())
    setIsBotThinking(playerColor === 'b')
    setLastMove(null)
    setSelectedSquare(null)
    setIsBoardSwitching(false)
    setIsPiecesEntering(false)
  }

  const handlePlayerColorChange = (nextColor) => {
    if (nextColor === playerColor) return

    setIsBoardSwitching(true)
    setIsPiecesEntering(false)
    setPlayerColor(nextColor)
    setGameFen(getFreshChess().fen())
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
          <div
            className={`healing-chess-board ${isBoardSwitching ? 'is-color-switching' : ''} ${isPiecesEntering ? 'is-pieces-entering' : ''}`}
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
                const pieceSymbol = piece ? pieceSymbols[piece.color][piece.type] : ''
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
                const moveStyle = isLastMoveTo
                  ? {
                      '--move-x': getSquarePosition(lastMove.from).columnIndex - getSquarePosition(lastMove.to).columnIndex,
                      '--move-y': getSquarePosition(lastMove.from).rowIndex - getSquarePosition(lastMove.to).rowIndex,
                    }
                  : undefined

                return (
                  <button
                    className={`healing-chess-square ${(rowIndex + columnIndex) % 2 === 0 ? 'is-light' : 'is-dark'} ${isSelected ? 'is-selected' : ''} ${legalMove ? 'is-legal-move' : ''} ${legalMove?.captured ? 'is-capture' : ''} ${isLastMove ? 'is-last-move' : ''} ${isLastMoveTo ? 'is-last-move-to' : ''} ${isCaptureMove ? 'is-capture-move' : ''}`}
                    type="button"
                    key={squareName}
                    aria-label={pieceSymbol ? `${pieceSymbol} ở ô ${squareName}` : `Ô trống ${squareName}`}
                    onClick={() => handleChessSquareClick(squareName, piece)}
                  >
                    {pieceSymbol ? (
                      <span
                        className={`healing-chess-piece piece-${piece.color}`}
                        style={{
                          ...moveStyle,
                          '--piece-enter-delay': pieceEnterDelay,
                          '--piece-enter-x': pieceEnterX,
                          '--piece-enter-y': pieceEnterY,
                        }}
                      >
                        <span>{pieceSymbol}</span>
                      </span>
                    ) : null}
                  </button>
                )
              }),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
