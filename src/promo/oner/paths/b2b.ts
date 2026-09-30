import { ringPoint, type Caption, type FlightPath, type RailSegment, type Station } from '../path'
import type { Vector3Tuple } from 'three'

/* Пролёт портала B2B — конвейер (storyboard/v3/03-B2B.md, «Мир: конвейер»). Лента —
   шпилька: лента A идёт от головы (z = +8) на север по x = 0 до z = −36, разворот —
   полукруг R 4 м вокруг (4; −36), лента B возвращается на юг по x = 8 к узлу
   «Magazyn» в (8; +6). Оси — как в сценарии и у three.js: x — на восток, y — вверх,
   z — на юг, к камере в начале ролика; s — метры по ленте от головы.

   Экраны покупателя стоят справа по ходу ленты, то есть внутри шпильки, экраны
   продавца — слева, снаружи; и те и другие — в 1,6 м от оси. Камера летит над
   лентой и смотрит на панель вперёд-вбок, поэтому переходит с одной стороны на
   другую поворотом, а не перелётом через ленту.

   Кадры и подписи — из сценария; координаты — для аниматика, их правим там же,
   где правится сценарий. */

const LANE_A = 44
const TURN_RADIUS = 4
/** Конец разворота, s ≈ 56,6: дальше лента B. */
const TURN_END = LANE_A + Math.PI * TURN_RADIUS
/** Конец ленты B — край узла «Magazyn» Ø 3 м. */
const BELT_END = 97
const HUB: Vector3Tuple = [8, 0, 6]
const HUB_RADIUS = 1.5
const BAY = 1.6

interface BeltPoint {
  x: number
  z: number
  /** Куда лента везёт в этой точке. */
  dx: number
  dz: number
}

/** Точка на оси ленты в s метрах от головы. */
function belt(s: number): BeltPoint {
  if (s <= LANE_A) return { x: 0, z: 8 - s, dx: 0, dz: -1 }
  if (s < TURN_END) {
    const angle = (s - LANE_A) / TURN_RADIUS
    return {
      x: 4 - TURN_RADIUS * Math.cos(angle),
      z: -36 - TURN_RADIUS * Math.sin(angle),
      dx: Math.sin(angle),
      dz: -Math.cos(angle),
    }
  }
  return { x: 8, z: -36 + (s - TURN_END), dx: 0, dz: 1 }
}

function beltPoint(s: number, y = 0): Vector3Tuple {
  const { x, z } = belt(s)
  return [x, y, z]
}

/** Сторона пролёта: 1 — покупатель (справа по ходу, внутри шпильки), −1 — продавец. */
type Side = 1 | -1
const BUYER: Side = 1
const SELLER: Side = -1

/** Центр панели в пролёте; «вправо по ходу ленты» — это (−dz, dx). */
function bayPoint(s: number, side: Side, height: number): Vector3Tuple {
  const { x, z, dx, dz } = belt(s)
  return [x - side * BAY * dz, height, z + side * BAY * dx]
}

/* Камера стоит так, чтобы панель занимала около половины ширины кадра, как в CRM,
   и смотрит на неё под 35° к ленте, как на станции 10. Для панели 1,6 × 1,03 это
   2,6 м, и глаз — почти на оси ленты. */
const VIEW_ANGLE = (35 * Math.PI) / 180

function viewDistance([width, height]: [number, number]): number {
  return Math.max(2.6, width * 1.5, height * 2.3)
}

/** Поворот, при котором лицо объекта (+z) смотрит на глаз. */
function yawTo(position: Vector3Tuple, eye: Vector3Tuple): number {
  return Math.atan2(eye[0] - position[0], eye[2] - position[2])
}

/** Наклон к глазу, который выше объекта: лицо поднимается к нему. */
function pitchTo(position: Vector3Tuple, eye: Vector3Tuple): number {
  return -Math.atan2(eye[1] - position[1], Math.hypot(eye[0] - position[0], eye[2] - position[2]))
}

function inBay(
  n: number,
  from: number,
  to: number,
  chapter: string,
  label: string,
  caption: Caption | null,
  s: number,
  side: Side,
  size: [number, number],
  height: number,
): Station {
  const { dx, dz } = belt(s)
  const position = bayPoint(s, side, height)
  /* Взгляд — вперёд по ленте, повёрнутый на 35° к стороне панели. */
  const lookX = Math.cos(VIEW_ANGLE) * dx - side * Math.sin(VIEW_ANGLE) * dz
  const lookZ = Math.cos(VIEW_ANGLE) * dz + side * Math.sin(VIEW_ANGLE) * dx
  const distance = viewDistance(size)
  /* Камера — на высоте центра панели, но не ниже глаз человека: к низкой панели
     на нижней полке она смотрит сверху. */
  const eye: Vector3Tuple = [position[0] - distance * lookX, Math.max(1.35, height), position[2] - distance * lookZ]
  return {
    n,
    from,
    to,
    chapter,
    label,
    caption,
    position,
    yaw: yawTo(position, eye),
    size,
    eye,
    /* Выноска — от ленты наружу: у покупателя справа, у продавца слева. Лента
       остаётся посередине кадра, и камера, отходя к выноске, её не перелетает. */
    callout: { side },
  }
}

const PANEL: [number, number] = [1.6, 1.03]
/** Карточка-двойник: настройки, кредитный лимит. */
const CARD: [number, number] = [1.2, 0.8]
const PHONE: [number, number] = [0.36, 0.74]

/* Устройства у головы ленты — на подиумах 0,9 м, в линию z = +5,5: MacBook справа от
   ленты, iPhone покупателя слева, iPhone продавца ещё дальше слева. Повёрнуты к
   своим точкам съёмки: ноутбук — к ленте, телефоны — на юго-восток; с юга, из
   финала, видны все три. */
const MACBOOK: Vector3Tuple = [1.8, 1.0, 5.5]
const MACBOOK_EYE: Vector3Tuple = [1.0, 1.45, 7.1]
const PHONE_BUYER: Vector3Tuple = [-1.8, 1.05, 5.5]
const PHONE_BUYER_EYE: Vector3Tuple = [-0.4, 1.3, 6.9]
const PHONE_SELLER: Vector3Tuple = [-4.2, 1.05, 5.5]
const PHONE_SELLER_EYE: Vector3Tuple = [-2.8, 1.3, 6.9]

/* 09 считаем заранее: у 08 тот же глаз. Камера стоит за дверью 07 → 08 и только
   поворачивает голову — налево за карточкой 18+, потом обратно к витрине. */
const SKLEP = inBay(9, 600, 659, '02 Weryfikacja', 'Sklep · Marża ↓', { pl: 'Sortujesz po marży, nie tylko po cenie.', en: 'Sort by margin, not just by price.' }, 29, BUYER, PANEL, 1.6)
/* 08: окно 18+ выходит из витрины (s 29), перелетает через ленту и раскрывается
   карточкой настроек у продавца (s 31) — она и есть объект станции. */
const AGE_GATE = bayPoint(31, SELLER, 1.6)

/* 12: карточка «Wyceny» — в центре разворота, на полке перед стопкой тёмных плит.
   Камера смотрит с конца ленты A, с радиуса разворота: отсюда она и обходит стопку
   по дуге над лентой (ключ f900). */
const QUOTE: Vector3Tuple = [4, 1.5, -36]
const QUOTE_EYE: Vector3Tuple = [0.4, 1.5, -34.2]

/* 18: узел «Magazyn» в конце ленты B, веер веток — на восток. Камера поднялась на
   3 м (К4) и смотрит на узел сверху, с севера, со стороны ленты. */
const MAGAZYN: Vector3Tuple = [8, 1.4, 6]
const MAGAZYN_EYE: Vector3Tuple = [6, 4.6, 0.5]

/* 23: заголовок — в 12 м над головой ленты, лицом к камере на вершине отъезда
   (К12): 40 м над полом, к югу от шпильки. Вниз камера смотрит под 50°, а не 55°
   из сценария: при 55° с 40 м шпилька в вертикальный угол обзора 38° не входит. */
const HEADLINE: Vector3Tuple = [0, 12, 8]
const SUMMIT: Vector3Tuple = [5, 40, 24]

const STATIONS: Station[] = [
  {
    n: 1, from: 0, to: 59, chapter: '', label: 'Zamówienie przez [ … ]',
    caption: { pl: 'Zamówienie przez mail. Telefon. Arkusz.', en: 'Orders by email. Phone. Spreadsheet.' },
    position: [0, 1.6, 20], yaw: 0, size: [3.8, 1.6], eye: [0, 1.65, 28], vanish: 62, headline: true,
  },
  /* Слова уходят в пол к f110, а не к f119: камера в эти кадры уже летит сквозь их
     место к кольцу «01 Rejestracja», которое проходит на f120. */
  {
    n: 2, from: 60, to: 119, chapter: '', label: 'Hurt zamawia sam.',
    caption: { pl: 'Hurt zamawia sam.', en: 'Wholesale that orders itself.' },
    position: [0, 1.6, 12], yaw: 0, size: [3.6, 1.6], eye: [0, 1.6, 17], hold: 100,
    appear: 60, vanish: 110, headline: true,
  },
  {
    n: 3, from: 120, to: 209, chapter: '01 Rejestracja', label: 'MacBook · rejestracja',
    caption: { pl: 'Rejestracja hurtowa po NIP.', en: 'Wholesale sign-up by tax number.' },
    position: MACBOOK, yaw: yawTo(MACBOOK, MACBOOK_EYE), size: [1.3, 0.85], eye: MACBOOK_EYE,
  },
  /* Экран регистрации вылетает из ноутбука и встаёт в пролёт в 3,5 м дальше. */
  {
    ...inBay(4, 210, 299, '01 Rejestracja', 'Rejestracja · Biała lista MF', { pl: 'Dane firmy przychodzą same, z Białej listy MF.', en: 'Company details fill in from the official VAT registry.' }, 6, BUYER, PANEL, 1.6),
    appear: 210,
  },
  inBay(5, 300, 359, '01 Rejestracja', 'Sukces · tetris', { pl: 'Czekasz na akceptację? Zagraj.', en: 'Waiting for approval? Play a round.' }, 11, BUYER, PANEL, 1.3),
  inBay(6, 360, 449, '02 Weryfikacja', 'Kontrahenci B2B', { pl: 'Każdy kontrahent sprawdzony przez człowieka.', en: 'Every account approved by a person.' }, 17, SELLER, PANEL, 1.7),
  inBay(7, 450, 539, '02 Weryfikacja', 'Mail · konto zatwierdzone', { pl: 'Dostęp do cen hurtowych od razu po akceptacji.', en: "Wholesale prices unlock the moment you're approved." }, 23, BUYER, [1.0, 1.3], 1.5),
  {
    n: 8, from: 540, to: 599, chapter: '02 Weryfikacja', label: 'Bramka wieku 18+',
    caption: { pl: 'Bramkę 18+ włączasz tylko, gdy sprzedajesz alkohol albo tytoń.', en: 'Turn on the 18+ gate only when your catalogue has 18+ products.' },
    position: AGE_GATE, yaw: yawTo(AGE_GATE, SKLEP.eye), size: CARD, eye: SKLEP.eye, callout: { side: SELLER },
    /* Карточка есть только на этой станции: раскрывается у продавца и уходит в
       туман — в финальном отъезде пролёт 08 пуст. */
    appear: 554, vanish: 600,
  },
  SKLEP,
  inBay(10, 660, 749, '03 Ceny', 'Karton · progi ilościowe', { pl: 'Więcej w koszyku, niższa cena za sztukę.', en: 'Order more, pay less per unit.' }, 36, BUYER, PANEL, 1.6),
  /* Та же панель переворачивается и перелетает к продавцу: на обороте — редактор. */
  {
    ...inBay(11, 750, 839, '03 Ceny', 'Indywidualne zniżki', { pl: 'Każdy kontrahent widzi swoją cenę.', en: 'Every buyer sees their own price.' }, 36, SELLER, PANEL, 1.6),
    appear: 745,
  },
  {
    n: 12, from: 840, to: 899, chapter: '03 Ceny', label: 'Wyceny · Akceptuj',
    caption: { pl: 'Negocjujesz ofertą, a klient akceptuje jednym kliknięciem.', en: 'Negotiate with a quote and the buyer accepts in one click.' },
    position: QUOTE, yaw: yawTo(QUOTE, QUOTE_EYE), size: [1.2, 0.9], eye: QUOTE_EYE,
  },
  /* Верхняя плита стопки выезжает в пролёт ленты B и загорается панелью. */
  {
    ...inBay(13, 900, 989, '04 Zamówienie', 'Szybkie zamówienie', { pl: 'Wklejasz z arkusza i koszyk gotowy.', en: 'Paste from a spreadsheet and the cart is ready.' }, 60, BUYER, PANEL, 1.6),
    appear: 900,
  },
  inBay(14, 990, 1079, '04 Zamówienie', 'Złóż zamówienie', { pl: 'Płatność w terminie, w ramach limitu.', en: 'Pay later, within your credit limit.' }, 66, BUYER, PANEL, 1.8),
  /* Блок «Kredyt kupiecki» перелетает через ленту и становится карточкой «Kredyty». */
  {
    ...inBay(15, 1080, 1139, '04 Zamówienie', 'Kredyty · limit', { pl: 'Limit kupiecki pilnuje się sam.', en: 'Credit limits enforce themselves.' }, 71, SELLER, CARD, 1.5),
    appear: 1080,
  },
  inBay(16, 1140, 1199, '05 Realizacja', 'Mapowanie statusów', { pl: 'Zamówienie samo idzie do magazynu i BaseLinkera.', en: 'Orders flow to the warehouse and BaseLinker on their own.' }, 81, SELLER, PANEL, 1.6),
  inBay(17, 1200, 1259, '05 Realizacja', 'InPost ShipX · etykieta', { pl: 'Etykieta InPost jednym kliknięciem.', en: 'An InPost label in one click.' }, 91, SELLER, PANEL, 1.6),
  {
    n: 18, from: 1260, to: 1319, chapter: '05 Realizacja', label: 'Magazyn · 6 kanałów',
    caption: { pl: 'Jeden magazyn, wszystkie kanały sprzedaży.', en: 'One stock, every sales channel.' },
    position: MAGAZYN, yaw: yawTo(MAGAZYN, MAGAZYN_EYE), size: [2.0, 1.0], eye: MAGAZYN_EYE,
  },
  {
    n: 19, from: 1320, to: 1409, chapter: '06 Mobile', label: 'iPhone · sklep',
    caption: { pl: 'Zamówienie z telefonu w minutę.', en: 'Order from your phone in a minute.' },
    position: PHONE_BUYER, yaw: yawTo(PHONE_BUYER, PHONE_BUYER_EYE), size: PHONE, eye: PHONE_BUYER_EYE, appear: 1316,
  },
  {
    n: 20, from: 1410, to: 1499, chapter: '06 Mobile', label: 'iPhone · Telegram',
    caption: { pl: 'Akceptacje i wysyłki prosto z Telegrama.', en: 'Approvals and shipping straight from Telegram.' },
    position: PHONE_SELLER, yaw: yawTo(PHONE_SELLER, PHONE_SELLER_EYE), size: PHONE, eye: PHONE_SELLER_EYE, appear: 1405,
  },
  {
    n: 21, from: 1500, to: 1559, chapter: 'Dlaczego', label: '7 · 6 · 2',
    caption: { pl: '7 bramek płatności · 6 kanałów · 2 rejestry', en: '7 payment gateways · 6 channels · 2 registries' },
    position: [0, 4, 2], yaw: 0, size: [2.6, 1.0], eye: [0, 3.9, 8], appear: 1500,
  },
  {
    n: 22, from: 1560, to: 1619, chapter: 'Dlaczego', label: 'Trzy powody',
    caption: {
      pl: 'Rejestracja po NIP · Ceny i progi dla każdego kontrahenta · Kredyt kupiecki z limitem',
      en: 'Sign-up by tax number · Prices and tiers per buyer · Trade credit with limits',
    },
    position: [0, 5.8, 1.5], yaw: 0, size: [3.0, 1.2], eye: [0, 5.6, 7.5], appear: 1560,
  },
  {
    n: 23, from: 1620, to: 1709, chapter: 'Finał', label: 'Omówmy Twoją hurtownię.',
    caption: { pl: 'Omówmy Twoją hurtownię.', en: "Let's talk about your wholesale." },
    position: HEADLINE, yaw: yawTo(HEADLINE, SUMMIT), pitch: pitchTo(HEADLINE, SUMMIT), size: [6.4, 1.6], eye: SUMMIT,
    target: [5, 0, -10], hold: 1650, appear: 1640, headline: true,
  },
  /* EN-текста финала в сценарии нет (вопрос 5) — черновой перевод до ответа владельца. */
  {
    n: 24, from: 1710, to: 1799, chapter: 'Finał', label: 'Portal B2B · simbia.eu',
    caption: { pl: 'Portal B2B dla hurtu', en: 'B2B portal for wholesale' },
    position: [0, 1.3, 10], yaw: 0, size: [2.2, 1.2], eye: [0, 1.7, 16.4], hold: 1760, appear: 1710,
  },
]

/* Шесть веток к каналам — веером на восток, по 5 м от края узла; с севера на юг:
   Allegro, WooCommerce, Empik, Shoper, Shopify, Erli. */
const BRANCHES: RailSegment[] = [140, 120, 100, 80, 60, 40].map((degrees) => ({
  points: [ringPoint(HUB, HUB_RADIUS, degrees), ringPoint(HUB, HUB_RADIUS + 5, degrees)],
  closed: false,
}))

export const B2B_FLIGHT: FlightPath = {
  id: 'b2b',
  accent: '#FC5000',
  stations: STATIONS,
  chapters: [
    { label: '01 Rejestracja', frame: 120, position: beltPoint(0, 0.02) },
    { label: '02 Weryfikacja', frame: 360, position: beltPoint(15, 0.02) },
    { label: '03 Ceny', frame: 660, position: beltPoint(32, 0.02) },
    { label: '04 Zamówienie', frame: 900, position: beltPoint(50.3, 0.02) },
    { label: '05 Realizacja', frame: 1140, position: beltPoint(76, 0.02) },
    { label: '06 Mobile', frame: 1320, position: beltPoint(2.5, 0.02) },
  ],
  rail: [
    /* Лента целиком — A, разворот, B — точка на каждый метр. */
    { points: Array.from({ length: BELT_END + 1 }, (_, s) => beltPoint(s)), closed: false },
    { points: Array.from({ length: 24 }, (_, i) => ringPoint(HUB, HUB_RADIUS, i * 15)), closed: true },
    ...BRANCHES,
  ],
  camera: [
    /* В тумане перед крючком: наезд с 10 м. */
    { frame: 0, eye: [0, 1.5, 30], target: [0, 1.6, 20] },
    /* Разгон за импульсом кончается над кольцом «01 Rejestracja»: торможение к ноутбуку. */
    { frame: 120, eye: [0.1, 1.6, 8.3], target: MACBOOK },
    /* Рывок 05 → 06 гаснет над кольцом «02 Weryfikacja». */
    { frame: 360, eye: beltPoint(14.6, 1.65), target: bayPoint(17, SELLER, 1.7) },
    /* Коробка проходит кольцо «03 Ceny», камера — над ним. */
    { frame: 660, eye: beltPoint(32, 1.6), target: bayPoint(36, BUYER, 1.6) },
    /* Облёт стопки по развороту, 180° над лентой; вершина — кольцо «04 Zamówienie». */
    { frame: 900, eye: beltPoint(50.3, 1.6), target: [QUOTE[0], 1.2, QUOTE[2]] },
    /* От узла — на запад, через ноутбук, над кольцом «06 Mobile» к телефону. */
    { frame: 1320, eye: [0.4, 1.75, 5.9], target: PHONE_BUYER },
    /* Между счётчиками (21) и тремя причинами (22) — ровный подъём: без этой
       точки сплайн проседал до 2,6 м и полсекунды смотрел в пустое небо. */
    { frame: 1560, eye: [0, 4.75, 7.75], target: [0, 4.9, 1.75] },
    /* Нырок в «o»: у самых букв, взгляд — сквозь заголовок на голову ленты. Точка
       взгляда — в 8 м за буквами: ближе камера на спуске догоняет её и
       запрокидывается. */
    { frame: 1700, eye: [0.2, 13.3, 8.7], target: [-0.9, 6.4, 5] },
    /* За буквой камера выравнивается и садится перед знаком. */
    { frame: 1724, eye: [0, 2.8, 15.4], target: [0, 1.4, 10] },
    { frame: 1799, eye: [0.35, 1.7, 16.2], target: [0, 1.3, 10] },
  ],
}
