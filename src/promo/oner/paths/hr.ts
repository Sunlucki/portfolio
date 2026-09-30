import type { Caption, FlightPath, Station } from '../path'

/* Пролёт iApply — ось времени (storyboard/v3/02-IAPPLY.md, «Мир: ось времени»).
   Рельс — прямая с юга на север, один рабочий день: 06:00 при z = 0, каждый
   час −4 м, 22:00 при z = −64. Слева от рельса (x < 0) — сторона фирмы
   (администратор, координатор), справа (x > 0) — сторона Яна; станции стоят у
   своего часа. Утро теснее нормы: до отметки на оси всего 4 м.

   Кадры и подписи — из сценария; координаты — из его таблицы, их правим там
   же, где правится сценарий. */

/* Панель у рельса повёрнута к точке на оси, из которой камера видит её целиком:
   камера идёт по рельсу и на станции только поворачивает голову. Так проекция
   камеры на рельс растёт от 05:30 до 22:00 без возвратов — время на оси идёт
   только вперёд («Проверка непрерывности»). Расстояние — как у CRM: панель
   занимает около половины ширины кадра и не больше 60% высоты. */
function viewDistance([width, height]: [number, number]): number {
  return Math.max(2.6, width * 1.5, height * 2.3)
}

function byRail(
  n: number,
  from: number,
  to: number,
  chapter: string,
  label: string,
  caption: Caption | null,
  x: number,
  z: number,
  height: number,
  size: [number, number],
  more: Pick<Station, 'appear' | 'vanish' | 'callout'> = {},
): Station {
  const distance = viewDistance(size)
  const along = Math.sqrt(distance * distance - x * x)
  return {
    n,
    from,
    to,
    chapter,
    label,
    caption,
    position: [x, height, z],
    yaw: Math.atan2(-x, along),
    size,
    /* Камера — на высоте центра панели, но не ниже глаз человека: к телефону
       на диске она смотрит чуть сверху. */
    eye: [0, Math.max(1.35, height), z + along],
    ...more,
  }
}

const PANEL: [number, number] = [1.6, 1.03]
/* Устройства — на дисках-подиумах 0,9 м: центр телефона на 1,05 м, ноутбука — на 1,0. */
const PHONE: [number, number] = [0.36, 0.74]
const LAPTOP: [number, number] = [1.3, 0.85]

const STATIONS: Station[] = [
  /* Крючок: три строки стоят на полу одна за другой через 0,8 м и читаются
     столбиком — в макете это одна плита. Наезд с 9 до 6 м, чуть сверху. Слова
     рассыпаются к f60, из частиц собирается вторая фраза; к f114 она уходит в
     пол, и камера проходит над ней к кольцу «01 Start». */
  {
    n: 1, from: 0, to: 59, chapter: '', label: 'Kartki. Podpisy. Przepisywanie.',
    caption: { pl: 'Kartki. Podpisy. Przepisywanie.', en: 'Timesheets. Signatures. Re-typing.' },
    position: [0, 0.9, 10], yaw: 0, size: [3.6, 1.8], eye: [0, 2, 17.5], appear: 0, vanish: 60, headline: true,
  },
  {
    n: 2, from: 60, to: 119, chapter: '', label: 'Godziny liczą się same.',
    caption: { pl: 'Godziny liczą się same.', en: 'Hours that count themselves.' },
    position: [0, 0.85, 4], yaw: 0, size: [3.8, 1.7], eye: [0, 1.55, 9], appear: 60, vanish: 114, headline: true,
  },
  byRail(3, 120, 209, '01 Start', 'MacBook · Dodaj użytkownika', { pl: 'Konto zakłada firma, pracownik tylko się loguje.', en: 'You create the account, the worker just signs in.' }, -1.3, 0, 1.0, LAPTOP),
  /* 04 и 05 — один телефон: кнопка «Zaloguj się» становится дверью, за ней тот
     же телефон уже с главной. В макете у каждой станции своя плита, они
     сменяются за дверью, на f270. */
  byRail(4, 210, 269, '01 Start', 'iPhone · Zaloguj się', null, 1.5, -0.4, 1.05, PHONE, { appear: 200, vanish: 270 }),
  byRail(5, 270, 359, '01 Start', 'Strona główna · 4 języki', { pl: 'Ekran w języku pracownika.', en: "The screen speaks the worker's language." }, 1.5, -0.4, 1.05, PHONE, { appear: 270, callout: { side: -1 } }),
  byRail(6, 360, 449, '02 Wejście', 'Centrum kontroli QR', { pl: 'Kod na obiekt. Wygasa sam.', en: 'One code per site. It expires on its own.' }, -1.3, -2.4, 1.5, PANEL),
  /* Скан у кольца геозоны (Hub в −0,6; −6,0, кольцо Ø 6 м): камера за
     телефоном, на 1,2 м выше, смотрит вниз на 35° — телефон и кольцо в кадре
     целиком. Потом диск въезжает в кольцо: в макете телефон 07 стоит у старта,
     пока не уйдёт его подпись, а телефон 08 встаёт в конце пути на f498, когда
     кольцо вспыхивает зелёным. */
  {
    n: 7, from: 450, to: 539, chapter: '02 Wejście', label: 'Skanuj kod QR · geostrefa',
    caption: { pl: 'Odbicie tylko na obiekcie: QR + GPS.', en: 'Clock in only on site: QR + GPS.' },
    position: [2.3, 1.05, -3.2], yaw: Math.atan2(1.1, 2.3), size: PHONE, eye: [3.4, 2.55, -0.9],
    target: [1.4, 0, -3.95], vanish: 566, callout: { side: -1 },
  },
  /* Телефон 08 стоит почти на рельсе, а центр QR — на том же часе через рельс,
     поэтому камера остаётся на стороне Яна, как на 07: телефон в кольце, Hub
     за ним. */
  {
    n: 8, from: 540, to: 599, chapter: '02 Wejście', label: 'Ekran blokady · Jesteś w pracy',
    caption: { pl: 'Czas pracy na ekranie blokady.', en: 'Shift time right on the lock screen.' },
    position: [0.6, 1.05, -4.9], yaw: Math.atan2(1, 2.4), size: PHONE, eye: [1.6, 1.35, -2.5], appear: 498,
  },
  /* 09 и 11 — один телефон, 10 — пульт напротив, через рельс. Экран телефона
     переворачивается на f778–792: в макете плиты сменяются на f784. */
  byRail(9, 600, 689, '03 Giełda', 'Giełda zmian · Podejmij', { pl: 'Wolne zmiany biorą sami.', en: 'Staff claim open shifts themselves.' }, 1.5, -11, 1.05, PHONE, { vanish: 784 }),
  byRail(10, 690, 779, '03 Giełda', 'Oczekujące zgłoszenia · Zatwierdź', { pl: 'Koordynator zatwierdza jednym kliknięciem.', en: 'One click to approve.' }, -1.4, -11, 1.5, PANEL),
  byRail(11, 780, 839, '03 Giełda', 'Moje zmiany · przypomnienie', { pl: 'Przypomnienie godzinę przed zmianą.', en: 'A reminder one hour before the shift.' }, 1.5, -11, 1.05, PHONE, { appear: 784, callout: { side: -1 } }),
  /* Панель графика расслаивается, слои переезжают на 6,5 м вперёд и собираются
     в пульт «Przegląd dnia». iPhone D координатора (−0,6; −23) — не отдельный
     объект: у станции одна панель. */
  byRail(12, 840, 959, '04 Grafik', 'Widok grafiku', { pl: 'Brakuje ludzi? Przeciągasz i gotowe.', en: 'Short-staffed? Drag and done.' }, -1.4, -15.5, 1.9, [2.8, 1.8], { vanish: 990 }),
  byRail(13, 960, 1079, '04 Grafik', 'Przegląd dnia · Obecność na żywo', { pl: 'Na żywo: kto jest na obiekcie.', en: "Live: who's on site." }, -1.4, -22, 1.5, PANEL, { appear: 978 }),
  /* Обе стороны сразу: карточка фирмы и iPhone E Яна в +1,3; −28,5. Камера
     над рельсом отступает дальше обычного, чтобы держать в кадре обе. */
  {
    n: 14, from: 1080, to: 1169, chapter: '05 Płace', label: 'Nowe zadanie · premia za akord',
    caption: { pl: 'Premie za akord liczą się same.', en: 'Piece-rate bonuses, calculated for you.' },
    position: [-1.3, 1.4, -28.5], yaw: Math.atan2(1.3, 4.2), size: [1.1, 1.3], eye: [0, 2.4, -24.3],
    target: [-0.3, 1.25, -28.5],
  },
  /* Полоса на полу, от 14:00 до 17:00; объект станции — черта 8 h поперёк
     рельса на 15:00. Кран: камера смотрит вдоль рельса вниз на полосу. */
  {
    n: 15, from: 1170, to: 1229, chapter: '05 Płace', label: 'Nadgodziny · 8 h → ×1,5',
    caption: { pl: 'Powyżej 8 godzin: nadgodziny ×1,5. Automatycznie.', en: 'Over 8 hours: overtime at ×1.5. Automatically.' },
    position: [0, 0.15, -36], yaw: 0, size: [1.2, 0.3], eye: [0, 4.6, -26.5], target: [0, 0, -35],
  },
  byRail(16, 1230, 1319, '05 Płace', 'MacBook · Eksport listy płac', { pl: 'Miesiąc zamykasz jednym plikiem.', en: 'Close the month with one file.' }, -1.3, -44, 1.0, LAPTOP),
  byRail(17, 1320, 1409, '06 Zawsze pod ręką', 'Wiadomości · Zgłoś nieobecność', { pl: 'Nieobecność zgłoszona w trzech dotknięciach.', en: 'Report an absence in three taps.' }, 1.4, -49, 1.05, PHONE, { callout: { side: -1 } }),
  /* Слева — телефон координатора с «Karta NFC», объект станции; справа, в
     +1,3; −53, iPhone H с виджетом — не отдельный объект. */
  byRail(18, 1410, 1499, '06 Zawsze pod ręką', 'Karta NFC · widżet', { pl: 'Bez smartfona? Karta NFC.', en: 'No smartphone? Use an NFC card.' }, -1.3, -53, 1.05, PHONE),
  /* Барабаны встают из рельса у 20:15, камера поднимается к 4 м и смотрит на
     них сверху; карточки падают сверху и встают над рельсом на 4–6 м. */
  {
    n: 19, from: 1500, to: 1559, chapter: 'Dlaczego', label: '4 języki · 3 role · ×1,5',
    caption: { pl: '4 języki · 3 role · ×1,5', en: '4 languages · 3 roles · ×1.5' },
    position: [0, 0.25, -57], yaw: 0, pitch: -0.6, size: [1.8, 0.5], eye: [0, 3, -53], appear: 1500,
  },
  {
    n: 20, from: 1560, to: 1619, chapter: 'Dlaczego', label: 'Trzy powody',
    caption: {
      pl: 'Dane na Twoim serwerze · Kod QR + GPS: nie da się podrobić · Wdrożenie z opiekunem',
      en: "Data on your server · QR + GPS: can't be faked · Rollout with a dedicated lead",
    },
    position: [0, 5, -59.5], yaw: 0, size: [3.0, 1.2], eye: [0, 5, -55], appear: 1560,
  },
  /* Финал: камера на 60 м, в 60 м за концом оси, смотрит назад на весь месяц
     с наклоном 35°. Заголовок висит на линии от неё к подиуму, лицом к ней:
     камера ныряет в «o» и садится у подиума. */
  {
    n: 21, from: 1620, to: 1709, chapter: 'Finał', label: 'Pierwszy miesiąc prowadzimy razem.',
    caption: { pl: 'Pierwszy miesiąc prowadzimy razem.', en: 'We run the first month with you.' },
    position: [0, 30, -94], yaw: Math.PI, pitch: -Math.PI / 4, size: [18, 5], eye: [0, 60, -124],
    target: [0, 0, -38], appear: 1640, headline: true,
  },
  /* Подиум в 2 м за концом оси, лицом на север: за ним назад уходит весь день.
     Знак, адрес и кнопка — справа, в выноске. */
  {
    n: 22, from: 1710, to: 1799, chapter: 'Finał', label: 'iApply.pl · iapply.com.pl',
    caption: { pl: 'Umów rozmowę', en: 'Book a call' },
    position: [0, 1.05, -66], yaw: Math.PI, size: PHONE, eye: [0, 1.35, -68.6],
  },
]

export const HR_FLIGHT: FlightPath = {
  id: 'hr',
  accent: '#6F5EB8',
  stations: STATIONS,
  /* Кольцо лежит там, где камера пересекает рельс по пути к главе. */
  chapters: [
    { label: '01 Start', frame: 120, position: [0, 0.02, 2] }, // 05:30
    { label: '02 Wejście', frame: 360, position: [0, 0.02, -0.8] }, // 06:12
    { label: '03 Giełda', frame: 600, position: [0, 0.02, -9.5] }, // 08:22
    { label: '04 Grafik', frame: 840, position: [0, 0.02, -13.5] }, // 09:22
    { label: '05 Płace', frame: 1080, position: [0, 0.02, -25] }, // 12:15
    { label: '06 Zawsze pod ręką', frame: 1320, position: [0, 0.02, -47] }, // 17:45
  ],
  /* Ось дня: из тумана перед крючком до метра за 22:00, подиум стоит за её концом. */
  rail: [{ points: [[0, 0, 22], [0, 0, 2], [0, 0, -32], [0, 0, -65]], closed: false }],
  camera: [
    /* Предрассветный туман: слова крючка в 9 м. */
    { frame: 0, eye: [0, 2.2, 19], target: [0, 0.9, 10] },
    /* Камера проходит кольцо «01 Start» и тормозит к MacBook. */
    { frame: 120, eye: [0, 1.7, 2.6], target: [-1.3, 1, 0] },
    /* Кран над графиком: 7 м, наклон вниз 50° — пройденный день оказывается
       строкой месячной сетки. */
    { frame: 955, eye: [0.3, 7, -13.5], target: [-1.4, 0.5, -18.6] },
    /* Отъезд К12: разворот на 180° через сторону прошедших дней. Без этого
       ключа камера перевернулась бы через зенит. */
    /* Взгляд — на пол над строками прошедших дней: с целью в небе полторы
       секунды в кадре были только пол и чернота. */
    { frame: 1628, eye: [18, 28, -86], target: [30, 0, -50] },
    /* Перед заголовком: сквозь просвет «o» уже виден подиум. Склейка ролика
       здесь — сплошной полёт, плоскость букв камера проходит около f1706. */
    { frame: 1695, eye: [0, 31.3, -95.3], target: [0, 1.05, -66] },
  ],
}
