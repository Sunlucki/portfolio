import { ringPoint, yawToCenter, type Caption, type FlightPath, type Station } from '../path'
import type { Vector3Tuple } from 'three'

/* Пролёт CRM — кольцо (storyboard/v3/01-CRM.md, «Мир: кольцо»). Центр кольца
   (0, 0, −16), радиус 16 м, углы — от южной точки против часовой стрелки.
   Панели стоят снаружи кольца лицом к центру, камера идёт по внутренней
   стороне: за панелями — пустая студия, а не соседние станции.

   Кадры и подписи — из сценария; координаты — для аниматика, их правим там же,
   где правится сценарий. */

const CENTER: Vector3Tuple = [0, 0, -16]
const RADIUS = 16
/* Панель — на 2,2 м снаружи рельса, камера — внутри кольца на таком расстоянии,
   чтобы панель занимала около половины ширины кадра и не больше 60% высоты:
   рядом остаётся место карточкам. Для панели 1,6 × 1,03 это 2,6 м, для
   широкого канбана — 4,2 м, для высокой панели фактуры — 6,4 м. */
const PANEL_OUT = 2.2

function viewDistance([width, height]: [number, number]): number {
  return Math.max(2.6, width * 1.5, height * 2.3)
}

function onRing(
  n: number,
  from: number,
  to: number,
  chapter: string,
  label: string,
  caption: Caption | null,
  degrees: number,
  size: [number, number],
  height: number,
): Station {
  return {
    n,
    from,
    to,
    chapter,
    label,
    caption,
    position: ringPoint(CENTER, RADIUS + PANEL_OUT, degrees, height),
    yaw: yawToCenter(degrees),
    size,
    /* Камера — на высоте центра панели, но не ниже глаз человека: к низкой
       панели подвала письма она смотрит сверху. */
    eye: ringPoint(CENTER, RADIUS + PANEL_OUT - viewDistance(size), degrees, Math.max(1.35, height)),
  }
}

const PANEL: [number, number] = [1.6, 1.03]

const STATIONS: Station[] = [
  {
    n: 1, from: 0, to: 59, chapter: '', label: 'Arkusz. Skrzynka. Notatki.',
    caption: { pl: 'Arkusz. Skrzynka. Notatki.', en: 'Spreadsheet. Inbox. Notes.' },
    position: [0, 1.7, 12], yaw: 0, size: [3.4, 1.9], eye: [0, 1.65, 19], vanish: 62, headline: true,
  },
  {
    n: 2, from: 60, to: 119, chapter: '', label: 'Jeden system.',
    caption: { pl: 'Jeden system. Od leada do JPK.', en: 'One system. From lead to tax file.' },
    position: [0, 1.5, 6], yaw: 0, size: [3.6, 1.5], eye: [0, 1.55, 11], vanish: 122, headline: true,
  },
  {
    n: 3, from: 120, to: 209, chapter: '01 Start', label: 'MacBook · logowanie',
    caption: { pl: 'Wchodzisz kluczem, nie hasłem.', en: 'Sign in with a passkey, not a password.' },
    position: [0, 1.0, 0.3], yaw: 0, size: [1.3, 0.85], eye: [0.45, 1.45, 2.9],
  },
  {
    n: 4, from: 210, to: 269, chapter: '01 Start', label: 'Logowanie do CRM',
    caption: null,
    position: [0, 1.6, 1.8], yaw: 0, size: PANEL, eye: [0, 1.6, 4.9], appear: 200, vanish: 272,
  },
  onRing(5, 270, 359, '01 Start', 'Pulpit', { pl: 'Pulpit mówi, od czego zacząć dzień.', en: 'The dashboard tells you where to start.' }, 20, [2.4, 1.55], 1.5),
  onRing(6, 360, 449, '02 Leady', 'Kandydat z rejestrów', { pl: 'Firmy z rejestrów publicznych, z zarządem z KRS.', en: 'Companies from public registers, with the board from KRS.' }, 45, PANEL, 1.4),
  onRing(7, 450, 539, '02 Leady', 'Leady · Scoring', { pl: 'Scoring 0–100 liczy się sam.', en: 'A 0–100 score that updates itself.' }, 62, PANEL, 1.5),
  onRing(8, 540, 599, '02 Leady', 'Karta leada · warstwy', { pl: 'Wszystko o kliencie i o tym, kiedy najlepiej dzwonić.', en: 'Everything about the client, including the best time to call.' }, 75, PANEL, 1.5),
  onRing(9, 600, 659, '03 Sprzedaż', 'Wymagają uwagi', { pl: 'Priorytety: kto utknął i co zrobić.', en: "Priorities: who's stuck and what to do." }, 95, [1.8, 1.1], 1.6),
  onRing(10, 660, 719, '03 Sprzedaż', 'Jak poszła rozmowa?', { pl: 'Wynik rozmowy od razu zmienia scoring i priorytety.', en: 'Each call outcome feeds the score and priorities.' }, 105, PANEL, 1.5),
  onRing(11, 720, 779, '03 Sprzedaż', 'Kanban', { pl: 'Przeciągasz, a etap zmienia się od razu.', en: 'Drag it and the stage updates instantly.' }, 122, [2.8, 1.55], 2.2),
  onRing(12, 780, 839, '03 Sprzedaż', 'Oferta · Szkic → Wysłana', { pl: 'Oferta wysłana i zapisana w historii klienta.', en: 'Quote sent and logged on the client.' }, 138, [1.2, 1.2], 1.6),
  onRing(13, 840, 929, '04 Kontakt', 'Poczta → karta leada', { pl: 'Poczta przypięta do klienta.', en: 'Email pinned to the client.' }, 160, PANEL, 1.5),
  onRing(14, 930, 1019, '04 Kontakt', 'Plan sekwencji · 0 → 180', { pl: 'Follow-up do 180. dnia. Stop, gdy klient odpisze.', en: 'Follow-ups up to day 180, stopping when the client replies.' }, 185, PANEL, 1.4),
  onRing(15, 1020, 1079, '04 Kontakt', 'Wypisz się jednym kliknięciem', { pl: 'Wypis jednym kliknięciem. Na zawsze.', en: 'One-click unsubscribe. For good.' }, 212, PANEL, 0.8),
  onRing(16, 1080, 1169, '05 Dokumenty', 'Nowa faktura', { pl: 'Wpisujesz NIP, a dane firmy przychodzą same.', en: 'Type the NIP and company details fill in.' }, 240, [1.7, 2.8], 1.6),
  onRing(17, 1170, 1229, '05 Dokumenty', 'KSeF · Przyjęto', { pl: 'Faktura w KSeF z kodem QR.', en: 'Invoice in KSeF with a QR code.' }, 268, [1.2, 1.6], 1.5),
  onRing(18, 1230, 1319, '05 Dokumenty', 'Koszt z PDF → JPK_V7M', { pl: 'Koszty z PDF. JPK_V7M jednym plikiem.', en: 'Expenses from a PDF. JPK_V7M in one file.' }, 300, PANEL, 1.5),
  {
    n: 19, from: 1320, to: 1409, chapter: '06 Mobile', label: 'iPhone',
    caption: { pl: 'Ten sam CRM w telefonie.', en: 'The same CRM on your phone.' },
    position: [1.3, 1.05, 0.5], yaw: 0, size: [0.36, 0.74], eye: [1.0, 1.3, 2.5],
    target: [1.1, 1.0, 0.4], appear: 1320,
  },
  {
    n: 20, from: 1410, to: 1499, chapter: '06 Mobile', label: 'MacBook → iPhone',
    caption: { pl: 'Na biurku i w kieszeni.', en: 'At your desk and in your pocket.' },
    position: [0.65, 1.0, 0.4], yaw: 0, size: null, eye: [0.7, 1.55, 3.6], target: [0.65, 1.0, 0.3],
    /* Надпись — над обоими устройствами: сбоку она закрывала то телефон, то экран ноутбука. */
    callout: { side: -1, anchor: [0.6, 2.4] },
  },
  {
    n: 21, from: 1500, to: 1559, chapter: 'Dlaczego', label: '19 modułów',
    caption: { pl: '19 modułów. Jedna baza.', en: '19 modules. One database.' },
    position: [0, 4.6, -5.5], yaw: 0, size: [2.2, 1.0], eye: [0, 4.3, 1.2], appear: 1490,
  },
  {
    n: 22, from: 1560, to: 1619, chapter: 'Dlaczego', label: 'Trzy powody',
    caption: { pl: 'Serwer w Niemczech (EOG) · Klucz zamiast hasła · 5 języków', en: 'Servers in Germany (EEA) · Passkeys, not passwords · 5 languages' },
    position: [0, 6.6, -8], yaw: 0, size: [3.0, 1.2], eye: [0, 6.3, -1.8], appear: 1555,
  },
  {
    n: 23, from: 1620, to: 1709, chapter: 'Finał', label: 'Pokażemy go na żywo.',
    caption: { pl: 'Pokażemy go na żywo.', en: "We'll show it to you live." },
    position: [0, 10, -15.2], yaw: 0, pitch: -0.95, size: [5, 1.3], eye: [0, 28, -3],
    /* Камера проходит сквозь заголовок около f1696 (в сценарии — нырок в «o»);
       пока у панели нет букв, она уходит до прохода, иначе кадр заливает её
       подсветкой. */
    target: [0, 2, -16], hold: 1650, appear: 1630, vanish: 1692, headline: true,
  },
  {
    n: 24, from: 1710, to: 1799, chapter: 'Finał', label: 'SIMBIA CRM · crm.simbia.eu',
    caption: { pl: 'Od leada do JPK.', en: 'From lead to tax file.' },
    position: [0, 1.3, -16], yaw: 0, size: [2.2, 1.2], eye: [0, 1.7, -9.6], target: [0, 1.3, -16], hold: 1760,
  },
]

const ring: Vector3Tuple[] = Array.from({ length: 72 }, (_, i) => ringPoint(CENTER, RADIUS, i * 5))

export const CRM_FLIGHT: FlightPath = {
  id: 'crm',
  accent: '#59B4BD',
  stations: STATIONS,
  chapters: [
    { label: '01 Start', frame: 120, position: [0, 0.02, 4.2] },
    { label: '02 Leady', frame: 360, position: ringPoint(CENTER, RADIUS, 38, 0.02) },
    { label: '03 Sprzedaż', frame: 600, position: ringPoint(CENTER, RADIUS, 88, 0.02) },
    { label: '04 Kontakt', frame: 840, position: ringPoint(CENTER, RADIUS, 152, 0.02) },
    { label: '05 Dokumenty', frame: 1080, position: ringPoint(CENTER, RADIUS, 228, 0.02) },
    { label: '06 Mobile', frame: 1320, position: ringPoint(CENTER, RADIUS, 340, 0.02) },
  ],
  rail: [
    { points: [[0, 0, 28], [0, 0, 14], [0, 0, 5], [0, 0, 1.2]], closed: false },
    { points: ring, closed: true },
  ],
  camera: [
    { frame: 0, eye: [0, 1.75, 25], target: [0, 1.6, 12] },
    { frame: 119, eye: [0, 1.45, 7.2], target: [0, 1.0, 0.3] },
    { frame: 262, eye: [2.2, 1.6, 3.7], target: [5, 1.5, 0.2] },
    { frame: 1305, eye: ringPoint(CENTER, 15, 330, 1.5), target: ringPoint(CENTER, 18, 352, 1.2) },
    { frame: 1690, eye: [0, 11.5, -14.8], target: [0, 9.8, -16.2] },
    { frame: 1712, eye: [0, 3, -10.5], target: [0, 1.4, -16] },
    { frame: 1799, eye: [0.35, 1.7, -9.4], target: [0, 1.3, -16] },
  ],
}
