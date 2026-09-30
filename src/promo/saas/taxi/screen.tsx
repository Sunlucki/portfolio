import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { useLang } from '../kit/lang'
import { AppWindow, CHROME, Phone } from '../kit/surfaces'
import type { Point, Rect } from '../kit/theme'
import { prepareTaxi, TB } from './twins'

/* Сцена TAXI в 2D: телефон водителя справа, окно панели владельца слева —
   как обочины дороги в 3D (слева владелец, справа водитель). Оба в координатах
   мира (кадр 1920 × 1080 при zoom = 1); каждая глава кладёт их на те же места,
   поэтому склейки между главами — встык, без скачка.

   Экраны рисуют художники продукта на холсте (<Live>): холст перерисовывается,
   только когда меняется его состояние (state) — печать по букве, прокрутка,
   смена статуса — или язык ролика. Рисование — в useLayoutEffect, до снимка
   кадра; тема и язык художников ставятся прямо перед ним. */

/* ── Раскладка мира ────────────────────────────────────────────────────── */

export interface PhonePlace {
  /** Центр телефона в мире. */
  cx: number
  cy: number
  /** Пикселей мира на точку iOS. */
  s: number
}

/** Телефон водителя: по центру кадра, экран 393 × 852 pt в масштабе 1. */
export const PHONE: PhonePlace = { cx: 960, cy: 540, s: 1 }

/** Точка экрана телефона (pt) → мир. */
export function onPhone(x: number, y: number, phone: PhonePlace = PHONE): Point {
  return [phone.cx + (x - 196.5) * phone.s, phone.cy + (y - 426) * phone.s]
}

/** Прямоугольник экрана телефона (pt) → мир. */
export function phoneRect(rect: Rect, phone: PhonePlace = PHONE): Rect {
  const [x, y] = onPhone(rect.x, rect.y, phone)
  return { x, y, width: rect.width * phone.s, height: rect.height * phone.s }
}

/** Экран телефона целиком в мире. */
export const PHONE_SCREEN: Rect = phoneRect({ x: 0, y: 0, width: 393, height: 852 })

/** Окно панели владельца: страница 1280 × 800 CSS (как экран MacBook) слева от
    телефона; строка браузера — над страницей. */
export const DESK = { x: -760, y: 170, width: 1280, height: 800 }

/** Точка страницы панели (CSS) → мир. */
export const onDesk = (x: number, y: number): Point => [DESK.x + x, DESK.y + y]

export const deskRect = (rect: Rect): Rect => ({ x: DESK.x + rect.x, y: DESK.y + rect.y, width: rect.width, height: rect.height })

export const HOST = 'taxiboss.pl'

/* ── Холст художника ───────────────────────────────────────────────────── */

/** Холст двойника в логических единицах макета (pt телефона, px CSS панели):
    width × height, плотность ratio. draw зовётся при монтировании и когда
    меняется state — кадр сцены воспроизводится точно в любом порядке.
    Холст в ветках условия (a ? <Live/> : <Live/>) — с разными key: иначе React
    оставит тот же экземпляр, и при том же state картинка не перерисуется. */
export function Live({
  width,
  height,
  ratio = 2,
  state = 0,
  draw,
  style,
}: {
  width: number
  height: number
  ratio?: number
  state?: string | number
  draw: (ctx: CanvasRenderingContext2D) => void
  style?: CSSProperties
}) {
  const host = useRef<HTMLDivElement>(null)
  const lang = useLang()
  const canvas = useMemo(() => (typeof document === 'undefined' ? null : document.createElement('canvas')), [])
  useLayoutEffect(() => {
    const node = host.current
    if (!node || !canvas) return
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    node.appendChild(canvas)
    return () => {
      if (canvas.parentNode === node) node.removeChild(canvas)
    }
  }, [canvas])
  useLayoutEffect(() => {
    if (!canvas) return
    const w = Math.max(1, Math.round(width * ratio))
    const h = Math.max(1, Math.round(height * ratio))
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.letterSpacing = '0px'
    prepareTaxi(lang)
    draw(ctx)
    // Холст зависит только от state, размера и языка — draw пересоздаётся каждый кадр.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, width, height, ratio, state, lang])
  return <div ref={host} style={{ position: 'absolute', left: 0, top: 0, width, height, ...style }} />
}

/* ── Устройства ────────────────────────────────────────────────────────── */

/** iPhone водителя (kit <Phone>, тёмный экран): children — экран в точках iOS
    (393 × 852), над ними — маска строки состояния художника (у набора своя
    строка поверх), выше — overlay (уведомления, касания в pt). */
export function TaxiPhone({
  phone = PHONE,
  children,
  overlay,
  style,
}: {
  phone?: PhonePlace
  children?: ReactNode
  overlay?: ReactNode
  style?: CSSProperties
}) {
  const s = phone.s
  return (
    <Phone scale={s} dark screen={TB.bg} style={{ left: phone.cx - 212 * s, top: phone.cy - 441.5 * s, ...style }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 393, height: 852, transform: `scale(${s})`, transformOrigin: '0 0' }}>
        {children}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 393, height: 54, background: TB.bg }} />
        {overlay}
      </div>
    </Phone>
  )
}

/** Окно браузера с панелью владельца (kit <AppWindow>): страница 1280 × 800,
    фон страницы — тёмный фон продукта. */
export function Desk({ path = '/admin', children, style, clip = true }: { path?: string; children?: ReactNode; style?: CSSProperties; clip?: boolean }) {
  return (
    <AppWindow url={`${HOST}${path}`} width={DESK.width} height={DESK.height} page={TB.bg} clip={clip} style={{ left: DESK.x, top: DESK.y - CHROME, ...style }}>
      {children}
    </AppWindow>
  )
}
