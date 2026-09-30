import { LangProvider, type Lang } from '../kit/lang'
import { FONT_SAMPLE, FontGate } from '../kit/painted'
import { Scenes, schedule } from '../kit/scenes'
import { Stage } from '../kit/surfaces'
import { Accent } from '../kit/theme'
import { ABSENCE_BEATS, Absence } from './Absence'
import { FINALE_BEATS, Finale } from './Finale'
import { HookPhrase, HookWords } from './Hook'
import { HOME_BEATS, Home } from './Home'
import { LOCK_BEATS, Lock } from './Lock'
import { MARKET_BEATS, Market } from './Market'
import { NFC_BEATS, Nfc } from './Nfc'
import { OVERTIME_BEATS, Overtime } from './Overtime'
import { PAYROLL_BEATS, Payroll } from './Payroll'
import { QR_BEATS, Qr } from './Qr'
import { SCHEDULE_BEATS, Schedule } from './Schedule'
import { START_BEATS, Start } from './Start'
import { TASKS_BEATS, Tasks } from './Tasks'
import { IA } from './twins'
import { WHY_BEATS, Why } from './Why'

/* iApply · v4 «SaaS 2D» (владелец 28.09): светлые 2D-сцены с 3D-переходами
   элементов, без пролёта камеры. Сценарий — раскадровка v2
   (storyboard/02-IAPPLY.md), подписи станций — packages/oner/src/paths/hr.ts,
   двойники — художники packages/oner/src/motion/hr.ts в светлой теме
   (HR_LOOK.prepare('light')). Акцент — фиолетовый продукта #3A3086. Темп — по
   отзывам владельца 28.09: всплывающие окна крупно (focus) и не меньше
   readFrames, предмет летит с экрана на экран — камера за ним.

   Сцены (доли по 15 кадров, склейки на долях), кадры ролика:
   0–119      01 Крючок A      «Kartki. Podpisy. Przepisywanie.» — зачёркивание
   120–269    02 Крючок B      «Godziny liczą się same.», путь QR → GPS → Płace
   270–824    03–04 Start      круг (П3) → «Dodaj użytkownika» → форма крупно →
                               строка Jana летит в телефон → вход, тост → П1
   825–1094   05 Języki        главная PL → UA → RU → EN (П15), уход каруселью
   1095–1889  06–07 Wejście    центр QR: 8 h, «Generuj QR», тост, «Wygasa:»,
                               плашка GPS → код летит в сканер → геозона 200 m
   1890–2144  08 Blokada       Live Activity и Dynamic Island, таймер идёт
   2145–2909  09–11 Giełda     стопка (П8) → «Podejmij» → заявка летит в пульт →
                               «Zatwierdź» → импульс обратно → «Moje zmiany»,
                               напоминание iOS; уход прокруткой насквозь (П14)
   2910–3614  12–13 Grafik     перетаскивание Jana в смену 2/3 → 3/3, тост →
                               расслоение в пульт (П9) → «Obecność na żywo» → П11
   3615–4229  14 Zadania       «Nowe zadanie» → телефон Jana → приёмка 30 m² →
                               штамп «Praca odebrana · 360,00 zł»
   4230–4484  15 Nadgodziny    шкала дня 07:00–17:00, 8 h, ×1,5 → П16
   4485–4844  16 Eksport       «Ten miesiąc», итоги, «Eksport CSV» → файл;
                               окно складывается (П13)
   4845–5174  17 Nieobecność   три касания, «Nieobecność zgłoszona», конверт
   5175–5504  18 NFC           карта NFC, «Wejście zarejestrowane», виджет
   5505–5864  19–20 Dlaczego   шторка (П12) → счётчики 4 · 3 · ×1,5 → три причины
   5865–6194  21–22 Finał      «Pierwszy miesiąc prowadzimy razem.» → влёт в «o»
                               (П10) → знак, iapply.com.pl, «Umów rozmowę» */

export const HR_SCENES = schedule([
  { id: '01 Kartki', beats: 8, tail: 14, component: HookWords },
  { id: '02 Godziny', beats: 10, tail: 30, component: HookPhrase },
  { id: '03-04 Start', beats: START_BEATS, component: Start },
  { id: '05 Języki', beats: HOME_BEATS, tail: 32, component: Home },
  { id: '06-07 QR', beats: QR_BEATS, component: Qr },
  { id: '08 Blokada', beats: LOCK_BEATS, component: Lock },
  { id: '09-11 Giełda', beats: MARKET_BEATS, tail: 20, component: Market },
  { id: '12-13 Grafik', beats: SCHEDULE_BEATS, component: Schedule },
  { id: '14 Zadania', beats: TASKS_BEATS, tail: 16, component: Tasks },
  { id: '15 Nadgodziny', beats: OVERTIME_BEATS, component: Overtime },
  { id: '16 Eksport', beats: PAYROLL_BEATS, tail: 24, component: Payroll },
  { id: '17 Nieobecność', beats: ABSENCE_BEATS, tail: 30, component: Absence },
  /* Хвост 12: шторку-предмет (П12) рисует следующая сцена поверх этой. */
  { id: '18 NFC', beats: NFC_BEATS, tail: 12, component: Nfc },
  { id: '19-20 Dlaczego', beats: WHY_BEATS, component: Why },
  { id: '21-22 Finał', beats: FINALE_BEATS, component: Finale },
])

const last = HR_SCENES[HR_SCENES.length - 1]!
export const SAAS_HR_FRAMES = last.to + (last.tail ?? 0)

/** Кириллица главной работника (UA, RU) и эмодзи приветствия — в выборку
    шрифта: <FontGate> держит кадр, пока Inter не загрузит и эти знаки. */
const SAMPLE = `${FONT_SAMPLE} Доброго ранку Доброе утро Працівник Работник ґєії ЁёЫыЭэ`

/** lang — язык ролика: польский по умолчанию, английский — для портфолио
    (в плеере inputProps={{ lang: 'en' }}). Сцены и тайминг те же. */
export function SaasHR({ lang = 'pl' }: { lang?: Lang }) {
  return (
    <LangProvider value={lang}>
      <Accent value={IA.primary}>
        <Stage>
          <FontGate text={SAMPLE}>
            <Scenes plan={HR_SCENES} />
          </FontGate>
        </Stage>
      </Accent>
    </LangProvider>
  )
}
