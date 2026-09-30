import type { Vector3Tuple } from 'three'

/* Путь ролика — данные, а не код: станции, кольца глав, рельс и ключи камеры.
   Один и тот же объект читают ролик (Remotion) и лендинг. Единицы — метры и
   кадры, координаты и кадры — из сценария продукта
   (storyboard/v3/0N-*.md, таблица «Мир» и «Маршрут камеры»). */

export type FlightTheme = 'light' | 'dark'

export interface Caption {
  pl: string
  en: string
}

export interface Station {
  /** Номер станции = номер сцены раскадровки. */
  n: number
  /** Кадры станции в ролике, включительно. */
  from: number
  to: number
  /** Глава: «01 Start», «02 Leady»… Пусто у крючка и финала. */
  chapter: string
  /** Короткое имя станции в макете. */
  label: string
  /** Подпись станции из сценария. У станций без своей подписи — null. */
  caption: Caption | null
  /** Центр объекта станции (панели, устройства, заголовка). */
  position: Vector3Tuple
  /** Поворот вокруг вертикали, радианы; лицо панели — её +z. */
  yaw: number
  /** Наклон вперёд-назад, радианы: заголовок над кольцом смотрит вверх. */
  pitch?: number
  /** Ширина × высота объекта, метры. null — у станции нет своего объекта. */
  size: [number, number] | null
  /** Откуда камера смотрит на станцию, пока стоит на ней. */
  eye: Vector3Tuple
  /** Куда смотрит; по умолчанию — в центр объекта. */
  target?: Vector3Tuple
  /** Кадр, на котором камера стоит на станции; по умолчанию — середина. */
  hold?: number
  /** С какого кадра объект есть в мире (панель входа вылетает из экрана,
      телефон поднимается из пола). По умолчанию — всегда. */
  appear?: number
  /** Кадр, к которому объект ушёл из мира: слова крючка уходят в пол, панель
      входа становится дверью. По умолчанию остаётся до конца — пройденный
      путь виден в финальном отъезде. */
  vanish?: number
  /** Объект станции сам и есть текст (крючок, финальный заголовок): подпись
      рисуется на нём крупно, выноски нет. */
  headline?: boolean
  /** Выноска подписи: с какой стороны панели (1 — справа, −1 — слева, как видит
      камера) и откуда на панели идёт линия — доли полуширины и полувысоты от
      центра. По умолчанию справа, из правой части экрана чуть выше середины. */
  callout?: { side?: 1 | -1; anchor?: [number, number] }
  /** Свой акцент станции: на главной у каждого портала — цвет его продукта. */
  accent?: string
}

/** Подлёт камеры к месту действия (v3.2, владелец 28.09: «подлёты камеры к
    каждому дашборду поближе»). at — точка в осях объекта станции, м (x вправо,
    y вверх от центра); distance — от неё до камеры, м (по умолчанию 0,9);
    from…to — кадры мира: к from + 14 камера на месте, к to — снова на пути.
    Подлёты задаёт отделка (Finish.closeups): ей известна раскладка экранов. */
export interface Closeup {
  at: [number, number]
  from: number
  to: number
  distance?: number
}

export interface ChapterMark {
  label: string
  /** Кадр, на котором камера проходит кольцо, — сильная доля. */
  frame: number
  position: Vector3Tuple
}

export interface CameraKey {
  frame: number
  eye: Vector3Tuple
  target: Vector3Tuple
}

export interface RailSegment {
  points: Vector3Tuple[]
  closed: boolean
}

export interface FlightPath {
  id: 'crm' | 'hr' | 'b2b' | 'taxi'
  /** Акцент продукта: рельс, кольца, свечение активной панели. */
  accent: string
  stations: Station[]
  chapters: ChapterMark[]
  rail: RailSegment[]
  /** Ключи камеры между станциями: вход, развороты, отъезд, финал. */
  camera: CameraKey[]
}

/** Кадр, на котором камера стоит на станции. */
export function holdFrame(station: Station): number {
  return station.hold ?? Math.round((station.from + station.to) / 2)
}

/** Точка на кольце. Угол — в градусах от южной точки против часовой стрелки,
    если смотреть сверху; так углы и записаны в сценарии CRM. */
export function ringPoint(center: Vector3Tuple, radius: number, degrees: number, y = 0): Vector3Tuple {
  const angle = (degrees * Math.PI) / 180
  return [center[0] + radius * Math.sin(angle), y, center[2] + radius * Math.cos(angle)]
}

/** Поворот, при котором лицо панели на кольце смотрит в центр кольца. */
export function yawToCenter(degrees: number): number {
  return (degrees * Math.PI) / 180 + Math.PI
}
