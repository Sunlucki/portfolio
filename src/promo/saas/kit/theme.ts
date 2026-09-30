import { createContext, useContext, type CSSProperties } from 'react'

/* Токены сцены v4: светлая «бумага», чернила, тени и матовое стекло. Цвета
   интерфейса продукта живут в его двойниках, здесь — только сцена ролика.
   Чернила и бумага совпадают с токенами светлой темы CRM
   (apps/web/src/styles/tokens.css, [data-theme='light']): кадр и продукт —
   одного тона. */

export const W = 1920
export const H = 1080

export const FONT = '"Inter Variable", Inter, system-ui, sans-serif'

export const INK = '#111827'
export const MUTED = '#4b5563'
export const DIM = '#6b7280'
export const PAPER = '#f3f4f8'
export const CARD = '#ffffff'
export const LINE = 'rgba(15, 23, 42, 0.09)'

/** Мягкие большие тени: всё парит над бумагой, ничего не «вырезано». */
export const SHADOW = {
  window: '0 1px 2px rgba(15, 23, 42, 0.05), 0 12px 32px rgba(15, 23, 42, 0.08), 0 44px 96px rgba(15, 23, 42, 0.13)',
  card: '0 1px 2px rgba(15, 23, 42, 0.05), 0 8px 22px rgba(15, 23, 42, 0.07), 0 26px 52px rgba(15, 23, 42, 0.08)',
  lifted: '0 2px 4px rgba(15, 23, 42, 0.06), 0 20px 44px rgba(15, 23, 42, 0.13), 0 56px 110px rgba(15, 23, 42, 0.16)',
}

/** Liquid Glass (владелец 28.09): светлое матовое стекло, светлая кромка сверху,
    мягкая тень. Без неона и цветных ореолов. */
export const GLASS: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.62)',
  backdropFilter: 'blur(22px) saturate(160%)',
  WebkitBackdropFilter: 'blur(22px) saturate(160%)',
  boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.4), ${SHADOW.card}`,
}

/** Акцент продукта. Ролик оборачивает сцены в <Accent value="…">; по умолчанию —
    бирюзовый CRM светлой темы. Акцент — только на том, что сейчас важно. */
const AccentContext = createContext('#2a9baa')
export const Accent = AccentContext.Provider
export const useAccent = () => useContext(AccentContext)

/** #rrggbb → rgba() с прозрачностью. */
export function tint(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((ch) => ch + ch).join('') : value.slice(0, 6)
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type Point = readonly [number, number]

export const center = (rect: Rect): [number, number] => [rect.x + rect.width / 2, rect.y + rect.height / 2]

/** Прямоугольник между a и b: t = 0 — a, t = 1 — b. */
export function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, width: a.width + (b.width - a.width) * t, height: a.height + (b.height - a.height) * t }
}

/** Тот же прямоугольник с тем же центром, в scale раз больше. */
export function grow(rect: Rect, scale: number): Rect {
  return { x: rect.x + (rect.width * (1 - scale)) / 2, y: rect.y + (rect.height * (1 - scale)) / 2, width: rect.width * scale, height: rect.height * scale }
}
