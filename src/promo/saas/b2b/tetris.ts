/* Тетрис ожидания (src/components/b2b/WaitingTetris.tsx) — сыгранная партия:
   фигуры и их повороты — из продукта (SHAPES), ходы заданы сценарием. Всё
   считается заново в каждом кадре от начала: кадр воспроизводится точно. */

const COLS = 10
const ROWS = 20

/** Фигуры продукта: состояния поворота, у каждого — клетки [x, y]. */
const SHAPES: number[][][][] = [
  [[[0, 1], [1, 1], [2, 1], [3, 1]], [[2, 0], [2, 1], [2, 2], [2, 3]]],
  [[[1, 0], [2, 0], [1, 1], [2, 1]]],
  [[[1, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [2, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [1, 2]], [[1, 0], [0, 1], [1, 1], [1, 2]]],
  [[[1, 0], [2, 0], [0, 1], [1, 1]], [[1, 0], [1, 1], [2, 1], [2, 2]]],
  [[[0, 0], [1, 0], [1, 1], [2, 1]], [[2, 0], [1, 1], [2, 1], [1, 2]]],
  [[[0, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [1, 1], [1, 2]], [[0, 1], [1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [0, 2], [1, 2]]],
  [[[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [1, 1], [1, 2], [2, 2]], [[0, 1], [1, 1], [2, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]]],
]

export interface Move {
  shape: number
  rotation: number
  /** Куда фигура сдвигается от точки появления (x = 3). */
  x: number
}

/** Партия: I, O, I закрывают нижний ряд (+100), потом T и L. */
export const PLAY: Move[] = [
  { shape: 0, rotation: 0, x: 0 },
  { shape: 1, rotation: 0, x: 3 },
  { shape: 0, rotation: 0, x: 6 },
  { shape: 2, rotation: 0, x: 0 },
  { shape: 6, rotation: 0, x: 6 },
  { shape: 5, rotation: 1, x: 2 },
]

/** Кадров на ряд падения и пауза между фигурами. */
const RATE = 1.5
const GAP = 5
const FLASH = 8

type Board = number[][]

const empty = (): Board => Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0))
const cellsOf = (m: Move) => SHAPES[m.shape]![m.rotation % SHAPES[m.shape]!.length]!

function collides(board: Board, m: Move, x: number, y: number) {
  return cellsOf(m).some(([cx, cy]) => {
    const px = x + cx!
    const py = y + cy!
    if (px < 0 || px >= COLS || py >= ROWS) return true
    return py >= 0 && board[py]![px] === 1
  })
}

export interface TetrisState {
  /** Лежащие клетки [col, row]. */
  locked: [number, number][]
  /** Падающая фигура. */
  falling: [number, number][]
  /** Ряды, которые вспыхивают перед снятием, и доля вспышки. */
  flash: { rows: number[]; t: number }
  score: number
}

/** Состояние партии через frame кадров после её начала. */
export function tetrisAt(frame: number): TetrisState {
  let board = empty()
  let score = 0
  let t = 0
  let flash = { rows: [] as number[], t: 0 }
  for (const move of PLAY) {
    /* Фигура появляется в (3, −1), сдвигается к x по клетке за 2 кадра и
       падает по ряду за RATE кадров до упора. */
    let land = -1
    while (!collides(board, move, move.x, land + 1)) land++
    const fallFrames = (land + 1) * RATE
    const lockAt = t + Math.max(fallFrames, Math.abs(move.x - 3) * 2)
    if (frame < lockAt) {
      const local = frame - t
      if (local < 0) break
      const steps = Math.floor(local / 2)
      const x = 3 + Math.sign(move.x - 3) * Math.min(Math.abs(move.x - 3), steps)
      const y = Math.min(land, -1 + Math.floor(local / RATE))
      return { locked: cellsList(board), falling: cellsOf(move).map(([cx, cy]) => [x + cx!, y + cy!] as [number, number]).filter(([, r]) => r >= 0), flash, score }
    }
    for (const [cx, cy] of cellsOf(move)) if (land + cy! >= 0) board[land + cy!]![move.x + cx!] = 1
    const full = board.map((row, i) => (row.every((cell) => cell === 1) ? i : -1)).filter((i) => i >= 0)
    t = lockAt
    if (full.length) {
      if (frame < t + FLASH) {
        flash = { rows: full, t: (frame - t) / FLASH }
        return { locked: cellsList(board), falling: [], flash, score }
      }
      board = [...Array.from({ length: full.length }, () => Array<number>(COLS).fill(0)), ...board.filter((_, i) => !full.includes(i))]
      score += [0, 100, 300, 500, 800][full.length] ?? 0
      t += FLASH
    }
    t += GAP
  }
  return { locked: cellsList(board), falling: [], flash: { rows: [], t: 0 }, score }
}

/** Кадры партии (от её начала), где фигура встаёт и где снимается ряд, с
    клеткой — для звука (kit/sound). Тот же ход, что у tetrisAt. */
export function tetrisEvents(): { locks: { at: number; col: number; row: number }[]; clears: { at: number; row: number }[] } {
  let board = empty()
  let t = 0
  const locks: { at: number; col: number; row: number }[] = []
  const clears: { at: number; row: number }[] = []
  for (const move of PLAY) {
    let land = -1
    while (!collides(board, move, move.x, land + 1)) land++
    const lockAt = t + Math.max((land + 1) * RATE, Math.abs(move.x - 3) * 2)
    const cells = cellsOf(move)
    const mean = (k: 0 | 1) => cells.reduce((sum, cell) => sum + cell[k]!, 0) / cells.length
    locks.push({ at: lockAt, col: move.x + mean(0), row: land + mean(1) })
    for (const [cx, cy] of cells) if (land + cy! >= 0) board[land + cy!]![move.x + cx!] = 1
    const full = board.map((row, i) => (row.every((cell) => cell === 1) ? i : -1)).filter((i) => i >= 0)
    t = lockAt
    if (full.length) {
      clears.push({ at: t, row: full[0]! })
      board = [...Array.from({ length: full.length }, () => Array<number>(COLS).fill(0)), ...board.filter((_, i) => !full.includes(i))]
      t += FLASH
    }
    t += GAP
  }
  return { locks, clears }
}

function cellsList(board: Board): [number, number][] {
  const out: [number, number][] = []
  board.forEach((row, y) => row.forEach((cell, x) => cell && out.push([x, y])))
  return out
}
