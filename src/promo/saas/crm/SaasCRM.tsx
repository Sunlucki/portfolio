import { LangProvider, type Lang } from '../kit/lang'
import { FontGate } from '../kit/painted'
import { Scenes, schedule } from '../kit/scenes'
import { Stage } from '../kit/surfaces'
import { Accent } from '../kit/theme'
import { Candidate } from './Candidate'
import { FollowupAxis, MAIL_SCENE_BEATS, MailLink, UNSUB_BEATS, Unsubscribe } from './Contact'
import { EXPENSE_BEATS, ExpenseJpk, InvoiceWizard, KsefSend } from './Documents'
import { FinalMark, FinalPhrase, MODULES_BEATS, REASONS_BEATS, WhyModules, WhyReasons } from './Finale'
import { HANDOFF_BEATS, MobileHandoff, MobileSame } from './Mobile'
import { HookPhrase, HookWords } from './Hook'
import { LeadLayers, LeadScoring } from './LeadCard'
import { KanbanDrag, OfferSend } from './Pipeline'
import { PriorityCall, PriorityFan } from './Priorities'
import { Login } from './Login'
import { Pulpit } from './Pulpit'
import { LIGHT } from './twins'

/* SIMBIA CRM · v4 «SaaS 2D» (владелец 28.09): светлые 2D-сцены с 3D-переходами
   элементов, без пролёта камеры. Сценарий — раскадровка v2
   (storyboard/01-CRM.md), станции и подписи — как в 3D (packages/oner/src/paths/
   crm.ts). Темп — по отзывам владельца 28.09: в фокусе — содержимое продукта,
   крупно и читаемо; всплывающие окна — на 50–70% ширины кадра и столько, чтобы
   их прочли; когда предмет летит с экрана на экран, камера следует за ним;
   длительность не ограничена — каждому действию столько, сколько ему нужно.

   Сцены (долями по 15 кадров, склейки на долях), кадры:
   0–89       01 Крючок      «Arkusz. Skrzynka. Notatki.» — зачёркивание
   90–194     02 Крючок      «Jeden system. Od leada do JPK.» + переключатель
   195–434    03–04 Start    вход по ключу: форма и лист отпечатка крупно
   435–659    05 Pulpit      пульт собирается стопкой слоёв, «Na dziś»
   660–1094   06 Leady       кандидат из реестров → «Dodaj do leadów» → «Leady»
   1095–1334  07 Leady       строка → карточка лида, «Scoring» и из чего он
   1335–1574  08 Leady       карточка расслаивается; «Dobry moment na telefon»
   1575–1844  09 Sprzedaż    веер «Wymagają uwagi», советы движка
   1845–2159  10 Sprzedaż    «Jak poszła rozmowa?» → запись в истории
   2160–2459  11 Sprzedaż    канбан: лид в «Spotkanie» (камера за карточкой)
   2460–2789  12 Sprzedaż    оферта «Szkic» → «Wysłana», самолётик
   2790–3194  13 Kontakt     «Poczta»: ветка к лиду, письмо в «Korespondencja»
   3195–3614  14 Kontakt     ось follow-up 0 → 180, ответ клиента её останавливает
   3615–3944  15 Kontakt     «Wypisz się jednym kliknięciem», штамп
   3945–4349  16 Dokumenty   мастер фактуры: NIP → данные из Białej listy
   4350–4769  17 Dokumenty   KSeF: «Przyjęto», QR
   4770–5234  18 Dokumenty   расход из PDF, цепочка до JPK_V7M
   5235–5534  19 Mobile      тот же CRM в телефоне (касания без курсора)
   5535–5774  20 Mobile      карточка лида с ноутбука в телефон
   5775–5984  21 Dlaczego    19 modułów (счётчик функций), «Jedna baza.»
   5985–6224  22 Dlaczego    три причины
   6225–6389  23 Finał       «Pokażemy go na żywo.» — нырок в «o»
   6390–6689  24 Finał       знак SIMBIA, crm.simbia.eu, «Umów demo» */

export const CRM_SCENES = schedule([
  { id: '01 Hook', beats: 6, tail: 14, component: HookWords },
  { id: '02 Jeden system', beats: 7, tail: 4, component: HookPhrase },
  { id: '03 Login', beats: 16, tail: 2, component: Login },
  { id: '05 Pulpit', beats: 15, tail: 30, component: Pulpit },
  { id: '06 Kandydat', beats: 29, component: Candidate },
  { id: '07 Scoring', beats: 16, component: LeadScoring },
  { id: '08 Karta leada', beats: 16, component: LeadLayers },
  { id: '09 Priorytety', beats: 18, component: PriorityFan },
  { id: '10 Telefon', beats: 21, tail: 24, component: PriorityCall },
  { id: '11 Kanban', beats: 20, component: KanbanDrag },
  { id: '12 Oferta', beats: 22, component: OfferSend },
  { id: '13 Poczta', beats: MAIL_SCENE_BEATS, component: MailLink },
  { id: '14 Follow-up', beats: 28, component: FollowupAxis },
  { id: '15 Wypis', beats: UNSUB_BEATS, component: Unsubscribe },
  { id: '16 Faktura', beats: 27, component: InvoiceWizard },
  { id: '17 KSeF', beats: 28, component: KsefSend },
  { id: '18 Koszt i JPK', beats: EXPENSE_BEATS, tail: 24, component: ExpenseJpk },
  { id: '19 Telefon', beats: 20, component: MobileSame },
  { id: '20 Na biurku i w kieszeni', beats: HANDOFF_BEATS, component: MobileHandoff },
  { id: '21 19 modułów', beats: MODULES_BEATS, component: WhyModules },
  { id: '22 Trzy powody', beats: REASONS_BEATS, component: WhyReasons },
  { id: '23 Pokażemy go na żywo', beats: 11, component: FinalPhrase },
  { id: '24 SIMBIA CRM', beats: 20, component: FinalMark },
])

/** Длина ролика — по сценам: длительность не ограничена (владелец 28.09). */
export const SAAS_CRM_FRAMES = CRM_SCENES[CRM_SCENES.length - 1]!.to

/** lang — язык ролика: польский по умолчанию, английский — для портфолио
    (в плеере inputProps={{ lang: 'en' }}). Сцены и тайминг те же. */
export function SaasCRM({ lang = 'pl' }: { lang?: Lang }) {
  return (
    <LangProvider value={lang}>
      <Accent value={LIGHT.teal}>
        <Stage>
          <FontGate>
            <Scenes plan={CRM_SCENES} />
          </FontGate>
        </Stage>
      </Accent>
    </LangProvider>
  )
}
