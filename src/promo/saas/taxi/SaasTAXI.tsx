import { LangProvider, type Lang } from '../kit/lang'
import { FontGate } from '../kit/painted'
import { Scenes, schedule } from '../kit/scenes'
import { Stage } from '../kit/surfaces'
import { Accent } from '../kit/theme'
import { HookBoard, HookPhrase } from './Hook'
import { KANDYDAT_BEATS, Kandydat } from './Kandydat'
import { AUTO_BEATS, Auto } from './Auto'
import { DOKUMENTY_BEATS, Dokumenty } from './Dokumenty'
import { FLOTA_BEATS, Flota } from './Flota'
import { MOBILE_BEATS, Mobile } from './Mobile'
import { DLACZEGO_BEATS, Dlaczego } from './Dlaczego'
import { FINAL_BEATS, Final } from './Final'
import { REJESTRACJA_BEATS, Rejestracja } from './Rejestracja'
import { UMOWA_BEATS, Umowa } from './Umowa'
import { ACCENT } from './twins'

/* TAXI BOSS · v4 «SaaS 2D» (владелец 28.09): светлая сцена, экраны продукта
   тёмные, как настоящий интерфейс (у TAXI BOSS только тёмная тема), наш текст
   и декор — светлые, золото — акцент. Сценарий — раскадровка v2
   (storyboard/04-TAXI.md), подписи станций — packages/oner/src/paths/taxi.ts,
   двойники — художники packages/oner/src/motion/taxi.ts.

   Темп — по отзывам владельца 28.09: в фокусе — содержимое продукта, крупно;
   всплывающие окна — наездом на 50–70% ширины кадра и столько, чтобы их
   прочли; предмет летит с экрана на экран — камера следует за ним. Мир:
   телефон водителя по центру, окно панели владельца слева (как обочины дороги
   в 3D); главы склеиваются встык в одном и том же состоянии.

   Сцены (долями по 15 кадров, склейки на долях; всего 5265 кадров = 2:55,5):
   0–104       01 Крючок A     «Ogłoszenia. Telefony. Teczki.» — табло, зачёркивание
   105–254     02 Крючок B     «Kierowcy przychodzą sami.» + путь кандидата
   255–974     03–05 Kandydat  калькулятор → результат → строка в «Leady»
   975–1634    06–08 Rejestracja  веер форм → регистрация → Telegram и ключ
   1635–2489   09–11 Dokumenty  снимки документов → проверка с причиной → «Zatwierdzony»
   2490–3074   12–13 Umowa     связь → договор из шаблона → подпись пальцем
   3075–3554   14 Auto         переворот → «Przypisz samochód» → машина в кабинете
   3555–4244   15–17 Flota     сроки машин → проверка в 9:00 → история сервиса
   4245–4694   18–19 Mobile    приложение водителя → семь языков лендинга
   4695–4979   20–21 Dlaczego  счётчики функций 7 · 3 · 4 → три причины
   4980–5264   22–23 Finał     «Porozmawiajmy o Twojej flocie.» → нырок в «o» → знак
   Хвосты (tail) — только там, где переход делят две сцены: Swing после
   «Leady», пролёт телефона мимо камеры (П12) и уход причин под финал. */

export const TAXI_SCENES = schedule([
  { id: '01 Hook', beats: 7, tail: 18, component: HookBoard },
  { id: '02 Kierowcy', beats: 10, tail: 2, component: HookPhrase },
  { id: '03 Kandydat', beats: KANDYDAT_BEATS, tail: 26, component: Kandydat },
  { id: '06 Rejestracja', beats: REJESTRACJA_BEATS, component: Rejestracja },
  { id: '09 Dokumenty', beats: DOKUMENTY_BEATS, component: Dokumenty },
  { id: '12 Umowa', beats: UMOWA_BEATS, component: Umowa },
  { id: '14 Auto', beats: AUTO_BEATS, component: Auto },
  { id: '15 Flota', beats: FLOTA_BEATS, component: Flota },
  { id: '18 Mobile', beats: MOBILE_BEATS, tail: 16, component: Mobile },
  { id: '20 Dlaczego', beats: DLACZEGO_BEATS, tail: 10, component: Dlaczego },
  { id: '22 Finał', beats: FINAL_BEATS, component: Final },
])

const last = TAXI_SCENES[TAXI_SCENES.length - 1]!
export const SAAS_TAXI_FRAMES = last.to

/** lang — язык ролика: польский по умолчанию, английский — для портфолио
    (в плеере inputProps={{ lang: 'en' }}). Сцены и тайминг те же. */
export function SaasTAXI({ lang = 'pl' }: { lang?: Lang }) {
  return (
    <LangProvider value={lang}>
      <Accent value={ACCENT}>
        <Stage>
          <FontGate>
            <Scenes plan={TAXI_SCENES} />
          </FontGate>
        </Stage>
      </Accent>
    </LangProvider>
  )
}
