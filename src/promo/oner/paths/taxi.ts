import { CatmullRomCurve3, Vector3 } from 'three'
import type { Vector3Tuple } from 'three'
import type { FlightPath, Station } from '../path'

/* Пролёт TAXI BOSS — дорога (storyboard/v3/04-TAXI.md, «Мир: дорога»). Ось
   дороги — сплайн через точки сценария (x — на восток, y — на север); в осях
   мира север — это −z: камера стартует на юге и едет на север. s — расстояние
   по оси от столба 01, до столба — отрицательное. Слева по ходу — владелец
   парка (MacBook, щиты его панели), справа — водитель (iPhone на дисках, как
   дорожные знаки). Машин в мире нет ни одной — только панели и карточки.

   Кадры и подписи — из сценария; координаты — для аниматика, их правим там же,
   где правится сценарий. */

const ROAD: [number, number][] = [[0, -12], [0, 20], [4, 34], [12, 46], [16, 58], [15, 70], [14, 76]]
const AXIS = new CatmullRomCurve3(ROAD.map(([east, north]) => new Vector3(east, 0, -north)), false, 'centripetal')
const LENGTH = AXIS.getLength()
/* Столб 01 — в 12 м от начала дороги, на широте 0: до s 20 дорога идёт на
   север. Конец сплайна, центр площадки, приходится на s ≈ 80 — как в сценарии. */
const START = 12

/** Точка оси и направление движения на расстоянии s от столба 01. За концом
    дороги, на площадке, ось продолжается по касательной. */
function road(s: number): { point: Vector3; forward: Vector3 } {
  const u = Math.min(1, Math.max(0, (s + START) / LENGTH))
  const forward = AXIS.getTangentAt(u)
  const point = AXIS.getPointAt(u).addScaledVector(forward, s + START - u * LENGTH)
  return { point, forward }
}

/** Точка у дороги: side — отступ от оси, «+» — вправо по ходу, «−» — влево. */
function beside(s: number, side: number, y: number): Vector3Tuple {
  const { point, forward } = road(s)
  return [point.x - forward.z * side, y, point.z + forward.x * side]
}

/** Точка на отрезке from → to в distance метрах от from. */
function toward(from: Vector3Tuple, to: Vector3Tuple, distance: number): Vector3Tuple {
  const a = new Vector3(...from)
  const b = new Vector3(...to).sub(a).setLength(distance).add(a)
  return [b.x, b.y, b.z]
}

/* Камера встаёт перед объектом так, чтобы он занимал около половины ширины
   кадра и не больше 60% высоты, — как в пролёте CRM: рядом остаётся место
   выноске. Для щита 1,6 × 1,03 это 2,6 м, для широкого щита «Flota» — 3,6 м. */
function viewDistance([width, height]: [number, number]): number {
  return Math.max(2.6, width * 1.5, height * 2.3)
}

type Placement = Pick<Station, 'position' | 'yaw' | 'size' | 'eye'>

/** Объект у дороги лицом к камере и точка, откуда камера на него смотрит.
    turn — на сколько градусов камера отворачивает от курса к объекту (0 — объект
    на оси, прямо по ходу). Камера — на высоте центра объекта, но не ниже
    машины: между станциями она едет на 1,2 м. */
function roadside(
  s: number,
  side: number,
  height: number,
  size: [number, number],
  turn: number,
  distance = viewDistance(size),
): Placement {
  const { point, forward } = road(s)
  const angle = (Math.sign(side) * turn * Math.PI) / 180
  // Взгляд камеры — курс, повёрнутый к обочине объекта; лицо объекта — навстречу.
  const lookX = forward.x * Math.cos(angle) - forward.z * Math.sin(angle)
  const lookZ = forward.z * Math.cos(angle) + forward.x * Math.sin(angle)
  const position: Vector3Tuple = [point.x - forward.z * side, height, point.z + forward.x * side]
  return {
    position,
    yaw: Math.atan2(-lookX, -lookZ),
    size,
    eye: [position[0] - lookX * distance, Math.max(1.2, height), position[2] - lookZ * distance],
  }
}

const PANEL: [number, number] = [1.6, 1.03]
const PHONE: [number, number] = [0.36, 0.74]
const MACBOOK: [number, number] = [1.3, 0.85]

/* Щит панели владельца: слева, в 3 м от оси, центр на 1,6 м, повёрнут к
   подъезжающей камере на 30° — камера отворачивает к нему на 60°. */
function board(s: number, size = PANEL, side = -3, height = 1.6): Placement {
  return roadside(s, side, height, size, 60)
}

/* iPhone водителя на диске справа, в 2,2 м от оси, центр на 1,15 м. Камера
   поворачивает к нему на 55°, как на станции 03; выноска — слева от телефона,
   над дорогой, а не над пустой студией за обочиной. */
const TO_ROAD = { side: -1 } as const

function phone(s: number): Placement & Pick<Station, 'callout'> {
  return { ...roadside(s, 2.2, 1.15, PHONE, 55), callout: TO_ROAD }
}

/* Площадка в конце дороги: MacBook слева и iPhone G справа на подиумах, в
   2,6 м от оси на s 81,8, повёрнуты к въезду, откуда камера смотрит на знак в
   финале, — на 20° от курса. */
function podium(side: number, size: [number, number], height: number): Placement {
  return roadside(81.8, side, height, size, 20)
}

/* Финал: камера уходит с площадки вверх и на северо-восток, до 50 м, и смотрит
   на юго-запад вдоль всей дороги — пологая S от столба 01 до площадки.
   Заголовок — в 15 м перед ней, лицом к камере, в кадре справа от дороги: не
   закрывает ни S, ни столбы. Камера ныряет в него (скрытая склейка № 2): когда
   стекло заполнило кадр, она уже у въезда на площадку. */
const TOP = beside(94, 36, 50)
const VIEW = beside(44, 0, 0)
const HEADLINE = toward(TOP, beside(40, -18, 0), 15)
const upward = new Vector3(...TOP).sub(new Vector3(...HEADLINE)).normalize()

const STATIONS: Station[] = [
  /* Крючок: табло над дорогой на s −1,5, фраза — в 1 м перед ним. Камера, как в
     сценарии, на 1,5 м: наезжает с s −8 до −5,4 и срывается к столбу 01. */
  {
    n: 1, from: 0, to: 59, chapter: '', label: 'Ogłoszenia. Telefony. Teczki.',
    caption: { pl: 'Ogłoszenia. Telefony. Teczki.', en: 'Job ads. Phone calls. Paper folders.' },
    ...roadside(-1.5, 0, 1.65, [2.8, 1.1], 0), eye: beside(-7, 0, 1.5), vanish: 119, headline: true,
  },
  {
    n: 2, from: 60, to: 119, chapter: '', label: 'Kierowcy przychodzą sami.',
    caption: { pl: 'Kierowcy przychodzą sami.', en: 'Drivers come to you.' },
    ...roadside(-2.5, 0, 1.65, [3.2, 1], 0), eye: beside(-5.4, 0, 1.5), hold: 104, appear: 60, vanish: 119, headline: true,
  },
  {
    n: 3, from: 120, to: 209, chapter: '01 Kandydat', label: 'iPhone · kalkulator zarobków',
    caption: { pl: 'Kalkulator zarobków zbiera kandydatów całą dobę.', en: 'An earnings calculator collects candidates around the clock.' },
    ...phone(3.5), hold: 135, appear: 120,
  },
  {
    n: 4, from: 210, to: 299, chapter: '01 Kandydat', label: 'Twoje potencjalne zarobki',
    caption: null,
    /* Тот же iPhone A: камера отходит на 0,5 м и чуть влево (К2), в кадр входит
       дорога. */
    ...roadside(3.5, 2.2, 1.15, PHONE, 58, 3.2), size: null, target: beside(4, 1.2, 1.1),
  },
  {
    n: 5, from: 300, to: 359, chapter: '01 Kandydat', label: 'MacBook · Leady',
    caption: { pl: 'Zgłoszenie od razu w panelu floty.', en: 'The lead lands in your fleet panel.' },
    ...roadside(6.5, -2.5, 1, MACBOOK, 55),
  },
  {
    n: 6, from: 360, to: 449, chapter: '02 Rejestracja', label: 'Forma współpracy',
    caption: { pl: 'Trzy formy współpracy. Kierowca wybiera sam.', en: 'Three ways to work with you. The driver picks.' },
    ...roadside(19.5, 0, 1.5, [2.3, 1.05], 0), hold: 390, appear: 360, vanish: 430,
  },
  {
    n: 7, from: 450, to: 539, chapter: '02 Rejestracja', label: 'iPhone · rejestracja',
    caption: { pl: 'Konto w minutę. Bez hasła.', en: 'An account in a minute. No password.' },
    ...phone(23),
  },
  {
    n: 8, from: 540, to: 599, chapter: '02 Rejestracja', label: 'Telegram · klucz dostępu',
    caption: { pl: 'Logowanie przez Telegram albo klucz dostępu.', en: 'Sign in with Telegram or a passkey.' },
    ...roadside(23, 2.2, 1.15, PHONE, 80), size: null, callout: TO_ROAD,
  },
  {
    n: 9, from: 600, to: 689, chapter: '03 Dokumenty', label: 'iPhone · dokumenty',
    caption: { pl: 'Dokumenty zdjęciem z telefonu.', en: 'Documents straight from the phone camera.' },
    ...phone(27.5), hold: 615,
  },
  {
    n: 10, from: 690, to: 779, chapter: '03 Dokumenty', label: 'Zgłoszenia · weryfikacja',
    caption: { pl: 'Odrzucasz z powodem, a kierowca wie, co poprawić.', en: 'Reject with a reason and the driver knows what to fix.' },
    ...board(30),
  },
  {
    n: 11, from: 780, to: 839, chapter: '03 Dokumenty', label: 'Aplikacja · Zatwierdzony',
    caption: { pl: 'Trzy zatwierdzone, profil zweryfikowany automatycznie.', en: 'All three approved, the profile verifies itself.' },
    ...phone(33),
  },
  {
    n: 12, from: 840, to: 929, chapter: '04 Umowa', label: 'Utwórz umowę',
    caption: { pl: 'Umowa z szablonu jednym kliknięciem.', en: 'A contract from a template in one click.' },
    ...board(38), hold: 865,
  },
  {
    n: 13, from: 930, to: 1019, chapter: '04 Umowa', label: 'Aplikacja · podpis',
    caption: { pl: 'Podpis palcem na telefonie.', en: 'Signed with a finger on the phone.' },
    ...phone(41),
  },
  {
    n: 14, from: 1020, to: 1079, chapter: '04 Umowa', label: 'Przypisz samochód',
    caption: { pl: 'Auto przypisane, kierowca widzi je od razu.', en: 'Car assigned, the driver sees it instantly.' },
    ...board(44),
  },
  {
    n: 15, from: 1080, to: 1169, chapter: '05 Flota', label: 'Flota · terminy',
    caption: { pl: 'Ubezpieczenia i przeglądy pod kontrolą.', en: 'Insurance and inspections under control.' },
    ...board(59, [2.4, 1.55], -3.2, 1.5),
  },
  {
    n: 16, from: 1170, to: 1229, chapter: '05 Flota', label: 'Tablica 09:00',
    caption: { pl: 'Codziennie o 9:00 system sprawdza terminy.', en: 'Every day at 9:00 the system checks due dates.' },
    ...roadside(68, 2.4, 2, [1.2, 0.45], 55), callout: TO_ROAD,
  },
  {
    n: 17, from: 1230, to: 1319, chapter: '05 Flota', label: 'MacBook · Historia serwisowa',
    caption: { pl: 'Historia serwisowa każdego auta.', en: 'A service history for every car.' },
    ...podium(-2.6, MACBOOK, 1),
  },
  {
    n: 18, from: 1320, to: 1409, chapter: '06 Mobile', label: 'Cześć, Oleksandr',
    caption: { pl: 'Aplikacja kierowcy na iPhone.', en: 'A driver app for iPhone.' },
    ...podium(2.6, PHONE, 1.05), callout: TO_ROAD,
  },
  {
    n: 19, from: 1410, to: 1499, chapter: '06 Mobile', label: '7 języków',
    caption: { pl: '7 języków. Arabski od prawej do lewej.', en: '7 languages. Arabic runs right to left.' },
    ...podium(2.6, PHONE, 1.05), size: null, callout: TO_ROAD,
  },
  {
    n: 20, from: 1500, to: 1559, chapter: 'Dlaczego', label: '7 · 3 · 4',
    caption: { pl: '7 języków · 3 formy współpracy · 4 kroki', en: '7 languages · 3 ways to work · 4 steps' },
    ...roadside(82, 0, 4.2, [2.4, 1], 0), appear: 1500,
  },
  {
    n: 21, from: 1560, to: 1619, chapter: 'Dlaczego', label: 'Trzy powody',
    caption: {
      pl: 'Płacisz za kierowcę na linii · Start bez wdrożenia · Terminy pilnują się same',
      en: 'Pay per driver on the road · Start without a rollout · Deadlines watch themselves',
    },
    ...roadside(82.5, 0, 6, [3, 1.2], 0), appear: 1555,
  },
  {
    n: 22, from: 1620, to: 1709, chapter: 'Finał', label: 'Porozmawiajmy o Twojej flocie.',
    caption: { pl: 'Porozmawiajmy o Twojej flocie.', en: "Let's talk about your fleet." },
    position: HEADLINE, yaw: Math.atan2(upward.x, upward.z), pitch: -Math.asin(upward.y), size: [5.6, 1.75],
    eye: TOP, target: VIEW, hold: 1680, appear: 1640, headline: true,
  },
  {
    n: 23, from: 1710, to: 1799, chapter: 'Finał', label: 'TAXI BOSS · taxiboss.pl',
    caption: { pl: 'Porozmawiajmy', en: "Let's talk" },
    ...roadside(78, 0, 1.3, [2.2, 1.2], 0), eye: beside(74.5, 0, 1.5), hold: 1710, appear: 1630,
  },
]

/* Столбы глав — у правой обочины, последний, «06 Mobile», — на площадке по оси:
   его линия идёт вдоль оси, между ноутбуком и телефоном. */
const POST = 2
const RAIL_STEPS = Math.round(LENGTH / 2)

export const TAXI_FLIGHT: FlightPath = {
  id: 'taxi',
  accent: '#FFBF00',
  stations: STATIONS,
  chapters: [
    { label: '01 Kandydat', frame: 120, position: beside(0, POST, 0.02) },
    { label: '02 Rejestracja', frame: 360, position: beside(15, POST, 0.02) },
    { label: '03 Dokumenty', frame: 600, position: beside(25.5, POST, 0.02) },
    { label: '04 Umowa', frame: 840, position: beside(34.5, POST, 0.02) },
    { label: '05 Flota', frame: 1080, position: beside(55, POST, 0.02) },
    { label: '06 Mobile', frame: 1320, position: beside(83.5, 0, 0.02) },
  ],
  rail: [
    {
      points: Array.from({ length: RAIL_STEPS + 1 }, (_, i) => beside((i / RAIL_STEPS) * LENGTH - START, 0, 0)),
      closed: false,
    },
  ],
  camera: [
    { frame: 0, eye: beside(-8, 0, 1.5), target: beside(-1.5, 0, 1.65) },
    /* Рывки К7 гаснут у столбов 02 и 05 — на сильной доле камера на линии. */
    { frame: 360, eye: beside(15, 0.8, 1.2), target: beside(19.5, 0, 1.5) },
    { frame: 1080, eye: beside(55, 0.8, 1.2), target: beside(62, 0.8, 1.2) },
    /* Начало отъезда: камера к востоку от площадки на 18 м и смотрит, как из
       диска поднимается знак. Без этой ступени подъём сразу на 50 м раскачал бы
       сплайн камеры на станциях 20–21: у ключей сплайна нет длины отрезка. */
    { frame: 1630, eye: beside(80, 14, 18), target: beside(78, 0, 1) },
    { frame: 1709, eye: toward(HEADLINE, TOP, 0.3), target: toward(TOP, HEADLINE, 30) },
  ],
}
