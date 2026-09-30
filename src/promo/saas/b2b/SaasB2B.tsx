import { LangProvider, type Lang } from '../kit/lang'
import { FontGate } from '../kit/painted'
import { Scenes, schedule } from '../kit/scenes'
import { Stage } from '../kit/surfaces'
import { Accent } from '../kit/theme'
import { ORANGE } from './data'
import { HookChannels, HookPhrase } from './Hook'
import { RegisterNip } from './RegisterNip'
import { RegisterSteps } from './RegisterSteps'
import { SUCCESS_FRAMES, Success } from './Success'
import { APPROVAL_FRAMES, Approval } from './Approval'
import { AGE_FRAMES, AgeGate } from './AgeGate'
import { SHOP_FRAMES, Shop } from './Shop'
import { PRODUCT_FRAMES, Product } from './Product'
import { OWN_PRICE_FRAMES, OwnPrice } from './OwnPrice'
import { QUOTE_FRAMES, Quote } from './Quote'
import { QUICK_FRAMES, QuickOrder } from './QuickOrder'
import { CHECKOUT_FRAMES, Checkout } from './Checkout'
import { CREDIT_FRAMES, Credit } from './Credit'
import { MAPPING_FRAMES, Mapping } from './Mapping'
import { INPOST_FRAMES, InPost } from './InPost'
import { CHANNELS_FRAMES, Channels } from './Channels'
import { MOBILE_FRAMES, Mobile } from './Mobile'
import { REASONS_FRAMES, WHY_FRAMES, WhyCounters, WhyReasons } from './Why'
import { FINAL_FRAMES, FINAL_LINE_FRAMES, FinalHeadline, FinalSign } from './Final'

/* Портал B2B · v4 «SaaS 2D» (владелец 28.09): светлые 2D-сцены с 3D-переходами
   элементов, без пролёта камеры. Сценарий — раскадровка v2
   (storyboard/03-B2B.md), станции и подписи — packages/oner/src/paths/b2b.ts.
   Движок нейтральный: «HURTOWNIA DEMO», упаковка, NIP учебный, ни конопли, ни
   CBD, ни марки магазина. Экраны — свои SVG-двойники в светлой палитре движка
   (twin.tsx): у художников B2B пока только тёмная тема. Темп — по отзывам
   владельца 28.09: всплывающие окна крупно и столько, чтобы их прочли; предмет
   летит с экрана на экран — камера за ним; длительность не ограничена.

   Сцены (кадры ролика, 7725 = 4:17,5):
   0–165      01 Крючок «Zamówienie przez» — барабан каналов, зачёркивание
   165–300    02 «Hurt zamawia sam.» — путь NIP → cena → koszyk → InPost, круг
   300–750    03–04 Rejestracja: NIP → Biała lista MF (камера за бусиной) → поля
   750–990    04 плита фирмы переворачивается и улетает; шаги 3–4; диск
   990–1320   05 успех и тетрис; уход каруселью
   1320–1830  06–07 заявка влетает в «Kontrahenci B2B», «Zatwierdź», тост;
              бусина к письму «Konto B2B zatwierdzone», кнопка → витрина (П1)
   1830–2175  08 окно 18+ → карточка настроек, вкл → выкл → вкл, «opcjonalnie»
   2175–2610  09 «Sklep»: баннер, «Marża ↓», перестройка строк; нырок в картон
   2610–2955  10 товар: 10 и 50 шт., пороги, чипы; ячейки выходят к зрителю
   2955–3450  11 переворот в редактор «Zniżki», «Cena stała 7.90», тост;
              обратно — «Twoja cena»
   3450–3840  12 «Wyceny» колодой: оферта, экономия, «Akceptuj», тост
   3840–4275  13 «Szybkie zamówienie» кругом: лист таблицы → вставка → «Wynik»,
              тост, корзина раскрывается в кадр
   4275–4695  14 «Kasa»: B2B, InPost Kurier, «Kredyt kupiecki» приподнят
   4695–5025  15 блок летит и переворачивается в «Kredyty»; «Przekroczony limit»
   5025–5325  16 маппинг статусов в BaseLinker (карусель)
   5325–5685  17 окно заказа, «Gabaryt B», «Utwórz przesyłkę», этикетка A6
   5685–5940  18 «Magazyn» и шесть каналов, остатки по линиям
   5940–7050  19–20 iPhone покупателя (касания) → бусина → бот продавца
   7050–7440  21–22 «7 · 6 · 2» и три причины
   7440–7725  23–24 «Omówmy Twoją hurtownię.» → из «o» знак SIMBIA, simbia.eu,
              «Umów rozmowę» */

export const B2B_SCENES = schedule([
  { id: '01 Hook', beats: 11, tail: 14, component: HookChannels },
  { id: '02 Hurt zamawia sam', beats: 9, component: HookPhrase },
  { id: '03-04 Rejestracja NIP', beats: 30, component: RegisterNip },
  { id: '04 Rejestracja kroki', beats: 16, component: RegisterSteps },
  { id: '05 Sukces i tetris', beats: SUCCESS_FRAMES / 15, tail: 30, component: Success },
  { id: '06-07 Weryfikacja i mail', beats: Math.ceil(APPROVAL_FRAMES / 15), component: Approval },
  { id: '08 Bramka 18+', beats: AGE_FRAMES / 15, component: AgeGate },
  { id: '09 Sklep', beats: SHOP_FRAMES / 15, component: Shop },
  { id: '10 Progi ilościowe', beats: PRODUCT_FRAMES / 15, component: Product },
  { id: '11 Twoja cena', beats: OWN_PRICE_FRAMES / 15, component: OwnPrice },
  { id: '12 Wyceny', beats: QUOTE_FRAMES / 15, tail: 26, component: Quote },
  { id: '13 Szybkie zamówienie', beats: QUICK_FRAMES / 15, component: QuickOrder },
  { id: '14 Kasa', beats: CHECKOUT_FRAMES / 15, component: Checkout },
  { id: '15 Kredyty', beats: CREDIT_FRAMES / 15, tail: 30, component: Credit },
  { id: '16 Mapowanie statusów', beats: MAPPING_FRAMES / 15, component: Mapping },
  { id: '17 InPost', beats: INPOST_FRAMES / 15, component: InPost },
  { id: '18 Kanały sprzedaży', beats: CHANNELS_FRAMES / 15, tail: 18, component: Channels },
  { id: '19-20 Mobile', beats: MOBILE_FRAMES / 15, component: Mobile },
  { id: '21 Dlaczego 7 6 2', beats: WHY_FRAMES / 15, tail: 8, component: WhyCounters },
  { id: '22 Trzy powody', beats: REASONS_FRAMES / 15, tail: 8, component: WhyReasons },
  { id: '23 Omówmy', beats: FINAL_LINE_FRAMES / 15, tail: 28, component: FinalHeadline },
  { id: '24 SIMBIA', beats: FINAL_FRAMES / 15, component: FinalSign },
])

export const SAAS_B2B_FRAMES = B2B_SCENES[B2B_SCENES.length - 1]!.to

/** lang — язык ролика: польский по умолчанию, английский — для портфолио
    (в плеере inputProps={{ lang: 'en' }}). Сцены и тайминг те же. */
export function SaasB2B({ lang = 'pl' }: { lang?: Lang }) {
  return (
    <LangProvider value={lang}>
      <Accent value={ORANGE}>
        <Stage>
          <FontGate>
            <Scenes plan={B2B_SCENES} />
          </FontGate>
        </Stage>
      </Accent>
    </LangProvider>
  )
}
