import type { CSSProperties, ReactNode } from 'react'
import { AppWindow } from '../kit/surfaces'
import { HOST } from './data'
import { PAGE, WINDOW } from './layout'
import { L, SCREEN } from './twin'

/** Окно браузера ролика: адрес hurtownia.demo/…, страница — SVG-экран продукта
    1024 × 659 CSS px, растянутый на PAGE. overlay — DOM-слои поверх экрана в
    координатах страницы мира (px окна). */
export function ScreenWindow({ path, page = L.page, children, overlay, clip = true, style }: { path: string; page?: string; children?: ReactNode; overlay?: ReactNode; clip?: boolean; style?: CSSProperties }) {
  return (
    <AppWindow url={`${HOST}${path}`} width={PAGE.width} height={PAGE.height} page={page} clip={clip} style={{ left: WINDOW.x, top: WINDOW.y, ...style }}>
      <svg width={PAGE.width} height={PAGE.height} viewBox={`0 0 ${SCREEN.w} ${SCREEN.h}`} style={{ position: 'absolute', left: 0, top: 0, display: 'block' }}>
        {children}
      </svg>
      {overlay}
    </AppWindow>
  )
}
