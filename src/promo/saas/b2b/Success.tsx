import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, fit, focus, viewAt, type CameraKey } from '../kit/camera'
import { Swing } from '../kit/transitions'
import { useLang } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeOut, glide, readFrames, span, spring } from '../kit/motion'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { useSoundCue } from '../kit/sound'
import { caption, tag } from './data'
import { at, mid, world, xy } from './layout'
import { Cell, RegBackground, SUCCESS, SuccessPanel, TETRIS, TetrisFrame } from './screens/Registration'
import { tetrisAt, tetrisEvents } from './tetris'
import { L } from './twin'
import { ScreenWindow } from './Window'

/* 05 · 01 Rejestracja · Успех и тетрис (22 доли). Диск садится белым кругом,
   в нём рисуется оранжевая галочка; «Sprawdź swoją skrzynkę e-mail» и абзац
   встают — камера наезжает, текст держится, пока читается. Клик «DALEJ»:
   элементы падают за кромку с поворотом (как fallAway продукта), на их месте
   встаёт тетрис «Zagraj, my sprawdzamy zgłoszenie», идёт партия: нижний ряд
   собирается и снимается (+100).

   0–18     галочка в круге (м-галочка); 6–26 заголовок, абзац, «DALEJ» (pop)
   10–36    наезд на сообщение (≈60% ширины кадра)
   36–134   сообщение читается (readFrames заголовка и абзаца)
   140      клик «DALEJ»; 144–170 элементы падают
   160–176  тетрис встаёт; камера на поле
   176–320  партия; 188–296 выноска 05 */

const MESSAGE = 'Sprawdź swoją skrzynkę e-mail. Wysłaliśmy link weryfikacyjny na adres biuro@••••••.pl. Po potwierdzeniu Twoje zgłoszenie trafi do ręcznej weryfikacji, a nasz zespół poinformuje Cię e-mailem.'
const READ = 36 + readFrames(MESSAGE)
const T0 = { next: Math.max(140, READ + 4), fall: 0, tetris: 0, play: 0 }
T0.fall = T0.next + 4
T0.tetris = T0.next + 20
T0.play = T0.tetris + 16

const TEXT = world({ x: 262, y: SUCCESS.circle.y - SUCCESS.circle.r, w: 500, h: SUCCESS.button.y + SUCCESS.button.h - (SUCCESS.circle.y - SUCCESS.circle.r) })
const BUTTON = world(SUCCESS.button)
const BOARD = world({ x: TETRIS.row.x, y: TETRIS.row.y - 20, w: TETRIS.row.w, h: TETRIS.board.y + TETRIS.board.h - TETRIS.row.y + 30 })

const CAMERA: CameraKey[] = [
  { at: 0, ...fit(world({ x: 176, y: 120, w: 672, h: 520 }), { max: 1.2 }) },
  { at: 10, dur: 26, ...focus(TEXT, { fill: 0.6, tall: 0.84 }) },
  { at: T0.tetris - 6, dur: 26, ...fit(BOARD, { max: 1.7, margin: 50, shift: [-260, 0] }) },
]

const CURSOR = [
  { at: T0.next - 26, x: BUTTON.x + BUTTON.width + 170, y: BUTTON.y + 150 },
  { at: T0.next - 4, x: BUTTON.x + BUTTON.width * 0.55, y: BUTTON.y + BUTTON.height * 0.6 },
  { at: T0.next + 24, x: BUTTON.x + BUTTON.width * 1.6, y: BUTTON.y + BUTTON.height * 2.4 },
]
const CLICK_AT = cursorAt(CURSOR, T0.next)
const BOARD_CAM = viewAt(CAMERA, T0.play + 40)
/** Где и когда в партии встают фигуры и снимается ряд (для звука). */
const TETRIS_EVENTS = tetrisEvents()

/** Длина сцены на сетке долей; последние кадры — уход каруселью влево. */
export const SUCCESS_FRAMES = Math.ceil((T0.play + 150) / 15) * 15
const LEAVE = SUCCESS_FRAMES - 8

export function Success() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const camera = viewAt(CAMERA, frame)
  const cursor = cursorAt(CURSOR, frame, [T0.next], T0.next + 20)
  const [cx, cy] = camera.project(cursor.x, cursor.y)
  const [rx, ry] = camera.project(CLICK_AT.x, CLICK_AT.y)
  const fall = [0, 2.4, 4.8, 7.2].map((delay) => easeIn(span(frame, T0.fall + delay, 21)))
  const press = 1 - 0.05 * clamp01(1 - Math.abs(frame - T0.next) / 3)
  const game = tetrisAt(frame - T0.play)
  const boardShow = easeOut(span(frame, T0.tetris, 12))
  /* Выноска — у поля справа. */
  const anchor = camera.project(...(() => { const b = world(TETRIS.board); return [b.x + b.width, b.y + b.height * 0.3] as [number, number] })())
  const boxX = BOARD_CAM.project(world(TETRIS.board).x + world(TETRIS.board).width, 0)[0] + 150
  const leave = glide(span(frame, LEAVE, 30))
  /* Звук (клик, камера, выноска и уход каруселью — у набора): галочка в
     круге — регистрация принята; после «DALEJ» экран осыпается; встаёт поле
     тетриса; фигуры встают, собранный ряд вспыхивает и снимается (фигуры,
     что встают уже на уходе, — без звука). */
  const point = (x: number, y: number) => xy(camera.project(x, y))
  const cell = (col: number, row: number) => point(...at(TETRIS.board.x + (col + 0.5) * TETRIS.cell, TETRIS.board.y + (row + 0.5) * TETRIS.cell))
  useSoundCue('success', 8, point(...at(SUCCESS.circle.x, SUCCESS.circle.y)), { gain: 0.9 })
  useSoundCue('layers', T0.fall, point(...mid(TEXT)), { gain: 0.55, seconds: 0.6 })
  useSoundCue('popIn', T0.tetris, point(...mid(world(TETRIS.board))), { gain: 0.6 })
  TETRIS_EVENTS.locks.forEach((lock) => useSoundCue('thump', T0.play + lock.at < LEAVE ? T0.play + lock.at : null, cell(lock.col, lock.row), { gain: 0.45 }))
  TETRIS_EVENTS.clears.forEach((clear) => useSoundCue('glint', T0.play + clear.at < LEAVE ? T0.play + clear.at : null, cell(4.5, clear.row), { gain: 0.6, seconds: 0.5 }))
  return (
    <AbsoluteFill>
      <Swing t={-leave}>
      <Camera view={camera}>
        <ScreenWindow path="/b2b/resellers" page={L.brand}>
          <RegBackground />
          {frame < T0.fall + 30 && <SuccessPanel check={easeOut(span(frame, 4, 14))} fall={fall} enter={[1, spring(frame, 6, SPRINGS.pop), spring(frame, 12, SPRINGS.pop), spring(frame, 18, SPRINGS.pop)]} press={press} />}
          {frame >= T0.tetris && (
            <g>
              <TetrisFrame score={game.score} show={boardShow} />
              {game.locked.map(([col, row]) => (
                <Cell key={`l${col}-${row}`} col={col} row={row} alpha={game.flash.rows.includes(row) ? 0.95 * (1 - game.flash.t) + 0.05 : 0.95} />
              ))}
              {game.falling.map(([col, row]) => (
                <Cell key={`f${col}-${row}`} col={col} row={row} alpha={0.75} />
              ))}
            </g>
          )}
        </ScreenWindow>
      </Camera>
      <Callout anchor={anchor} box={{ x: boxX, y: anchor[1] - 40, width: 500 }} tag={tag(5, lang)} title={caption(5, lang)} at={T0.play + 8} until={T0.play + 118} />
      </Swing>
      <Ripple x={rx} y={ry} at={T0.next} />
      <Cursor x={cx} y={cy} press={cursor.press} opacity={cursor.opacity} />
    </AbsoluteFill>
  )
}
