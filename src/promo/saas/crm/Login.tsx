import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Icon } from '../kit/draw'
import { useLang, useT } from '../kit/lang'
import { SPRINGS, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted, canvasOf, textWidth } from '../kit/painted'
import { Cursor, Ripple, cursorAt } from '../kit/pointer'
import { AppWindow } from '../kit/surfaces'
import { FONT, GLASS, INK, MUTED, SHADOW, useAccent, type Rect } from '../kit/theme'
import { Portal } from '../kit/transitions'
import { useCueList } from './common'
import { HOST, PAGE, WINDOW, scaled } from './layout'
import { LIGHT, LOGIN, LOGIN_CARD, LOGIN_PASSKEY, caption, crmLogin, crmLoginCard, tag, useCrmTwins } from './twins'

/* 03–04 · 01 Start · Вход по ключу (16 долей, 195–434). Бирюза из крючка
   оказывается страницей входа: она сжимается в окно браузера, на ней встаёт
   карточка «Logowanie do CRM». Карточка отрывается от страницы и выходит
   вперёд (П4), окно за ней отступает и светлеет — кадр остаётся светлым.
   Курсор нажимает «Zaloguj się kluczem», система спрашивает отпечаток — вход
   подтверждён. Карточка возвращается на место (П5), кнопка раскрывается
   порталом в пустую страницу — на ней соберётся пульт (П1).

   0–32     бирюза сжимается в окно, 2–14 — проступает сетка точек
   6–24     карточка входа встаёт на странице (pop)
   38–62    форма выходит вперёд ×2 (44% ширины кадра — читается), окно
            отступает и светлеет
   60–92    курсор идёт к кнопке, 92 — клик (м-клик): форма занята, на кнопке
            ключа «Czekamy na potwierdzenie…» со спиннером (состояния — у
            художника, drawLoginCard)
   98–184   лист подтверждения ~46% ширины: отпечаток прорисовывается (до 130),
            держится, 150 — галочка, держится, 176–184 — уходит вверх
   184      кнопка — «вход выполнен» (зелёная, галочка)
   70–186   выноска «Wchodzisz kluczem, nie hasłem.»
   196–216  форма возвращается в страницу (портал стартует до её посадки)
   210–234  кнопка порталом заливает страницу (П1) */

const LS = PAGE.width / LOGIN.width
/** Карточка входа на странице и кнопка ключа в карточке, px (раскладка
    художника: LOGIN_CARD, LOGIN_PASSKEY). */
const CARD: Rect = scaled(LOGIN_CARD, LS)
const PASSKEY: Rect = { x: (LOGIN_PASSKEY.x - LOGIN_CARD.x) * LS, y: (LOGIN_PASSKEY.y - LOGIN_CARD.y) * LS, width: LOGIN_PASSKEY.width * LS, height: LOGIN_PASSKEY.height * LS }

const CLICK = 92
const DONE = 184
const LIFT = 38
const BACK = 196
const PORTAL = 210
const SHEET = { at: 98, confirm: 150, leave: 176 }

/** Форма, вышедшая вперёд: центр в кадре и масштаб. */
const LIFTED = { x: 640, y: 540, scale: 2 }
const RECEDE = 0.94

/** Точка карточки (px страницы от угла карточки) → кадр, когда карточка впереди. */
const onLifted = (x: number, y: number): [number, number] => [LIFTED.x + (x - CARD.width / 2) * LIFTED.scale, LIFTED.y + (y - CARD.height / 2) * LIFTED.scale]

const CURSOR = (() => {
  const [bx, by] = onLifted(PASSKEY.x + PASSKEY.width * 0.62, PASSKEY.y + PASSKEY.height * 0.55)
  return [
    { at: 60, x: bx + 420, y: by + 120 },
    { at: 88, x: bx, y: by },
    { at: 112, x: bx + 70, y: by + 110 },
  ]
})()

/** Где курсор нажал: круг от клика остаётся на кнопке, курсор уходит. */
const CLICK_AT = cursorAt(CURSOR, CLICK)

export function Login() {
  const frame = useCurrentFrame()
  const accent = useAccent()
  const lang = useLang()
  const twins = useCrmTwins(() => ({
    page: canvasOf(crmLogin('empty')),
    card: { idle: canvasOf(crmLoginCard('idle')), waiting: canvasOf(crmLoginCard('waiting')), done: canvasOf(crmLoginCard('done')) },
  }))
  /* Состояние формы — как в продукте (LoginPage.tsx): ждём ключ — форма занята,
     кнопки приглушены, на кнопке ключа спиннер; после — вход подтверждён. */
  const state = frame >= DONE ? 'done' : frame >= CLICK ? 'waiting' : 'idle'

  /* Окно: страница сначала закрывает весь кадр (бирюза из крючка), затем
     сжимается на своё место. Масштаб — вокруг левого верхнего угла страницы. */
  const settle = glide(span(frame, 0, 32))
  const cover = 1920 / PAGE.width
  const scale = mix(cover, 1, settle)
  const shiftX = mix(-PAGE.x, 0, settle)
  const shiftY = mix(-60 - PAGE.y, 0, settle)
  const flat = 1 - easeOut(span(frame, 2, 12))

  /* Карточка впереди: выход тяжёлой пружиной, возврат — плавно. */
  const lift = spring(frame, LIFT, SPRINGS.heavy) * (1 - glide(span(frame, BACK, 20)))
  const recede = mix(1, RECEDE, lift)
  /* Где карточка лежит на странице — с учётом сжатия окна и отступа. */
  const restX = (PAGE.x + shiftX + (CARD.x + CARD.width / 2) * scale - 960) * recede + 960
  const restY = (PAGE.y + shiftY + (CARD.y + CARD.height / 2) * scale - 540) * recede + 540
  const cardScale = mix(scale * recede, LIFTED.scale, lift)
  const cardX = mix(restX, LIFTED.x, lift)
  const cardY = mix(restY, LIFTED.y, lift)
  const cardIn = spring(frame, 6, SPRINGS.pop)

  const portal = glide(span(frame, PORTAL, 24))
  const cursor = cursorAt(CURSOR, frame, [CLICK], 116)
  /* Точка выноски — на кнопке, где бы ни была форма; рамка — у формы впереди. */
  const cardFull = cardScale * mix(0.94, 1, Math.min(1, cardIn))
  const anchor: [number, number] = [cardX + (PASSKEY.x + PASSKEY.width * 0.86 - CARD.width / 2) * cardFull, cardY + (PASSKEY.y + PASSKEY.height / 2 - CARD.height / 2) * cardFull]
  const boxAt = onLifted(PASSKEY.x + PASSKEY.width * 0.86, PASSKEY.y + PASSKEY.height / 2)

  /* Звук: страница сжимается в окно; карточка встаёт и выходит вперёд; лист
     подтверждения, отпечаток рисуется, галочка — вход подтверждён, лист уходит;
     кнопка «вход выполнен»; карточка возвращается. Клик, выноска и портал
     звучат сами. */
  useCueList([
    [0, 'air', [960, 540], 0.45, 1],
    [6, 'popIn', [cardX, cardY], 0.6],
    [LIFT, 'whoosh', [cardX, cardY], 0.55, 0.7],
    [SHEET.at, 'popIn', [LIFTED.x, 330], 0.75],
    [SHEET.at + 4, 'pen', [LIFTED.x, 240], 0.4, 0.9],
    [SHEET.confirm + 1, 'success', [LIFTED.x, 240], 0.85],
    [SHEET.leave, 'popOut', [LIFTED.x, 300], 0.45],
    [DONE, 'tick', onLifted(PASSKEY.x + PASSKEY.width / 2, PASSKEY.y + PASSKEY.height / 2), 0.5],
    [BACK, 'whoosh', [cardX, cardY], 0.45, 0.7],
  ])

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${recede})` }}>
        <div style={{ position: 'absolute', left: WINDOW.x, top: WINDOW.y, transform: `translate(${shiftX}px, ${shiftY}px) scale(${scale})`, transformOrigin: `0px ${PAGE.y - WINDOW.y}px` }}>
          <AppWindow url={`${HOST}/login`} width={PAGE.width} height={PAGE.height} page={LIGHT.teal}>
            <Painted source={twins.page} style={{ inset: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: LIGHT.teal, opacity: flat }} />
            {/* Отступившее окно светлеет: кадр остаётся светлым, бирюза — фоном. */}
            <div style={{ position: 'absolute', inset: 0, background: '#f7f8fa', opacity: 0.55 * lift }} />
            <Portal from={{ ...PASSKEY, x: CARD.x + PASSKEY.x, y: CARD.y + PASSKEY.y }} to={{ x: 0, y: 0, width: PAGE.width, height: PAGE.height }} t={portal} color="#e6f4ef" toColor={LIGHT.bg} radius={[9, 0]} />
          </AppWindow>
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: cardX - CARD.width / 2,
          top: cardY - CARD.height / 2,
          width: CARD.width,
          height: CARD.height,
          opacity: Math.min(1, cardIn * 1.4) * (1 - easeIn(span(frame, PORTAL + 2, 6))),
          transform: `translateY(${(1 - Math.min(1, cardIn)) * 24}px) scale(${cardScale * mix(0.94, 1, Math.min(1, cardIn))})`,
          borderRadius: 14 * LS,
          boxShadow: lift > 0.02 ? SHADOW.lifted : '0 18px 48px rgba(10, 40, 46, 0.2)',
        }}
      >
        <Painted source={twins.card[state]} style={{ inset: 0 }} />
        {state === 'waiting' && <PasskeySpinner frame={frame} />}
      </div>
      <Ripple x={CLICK_AT.x} y={CLICK_AT.y} at={CLICK} />
      <Cursor x={cursor.x} y={cursor.y} press={cursor.press} opacity={cursor.opacity} />
      <PasskeySheet frame={frame} x={LIFTED.x} accent={accent} />
      <Callout anchor={anchor} box={{ x: boxAt[0] + 230, y: boxAt[1] - 190, width: lang === 'en' ? 510 : 560 }} tag={tag(3, lang)} title={caption(3, lang)} at={70} until={186} />
    </AbsoluteFill>
  )
}

/* Кнопку ключа рисует художник во всех трёх состояниях (drawLoginCard).
   Поверх — только вращение спиннера: у художника он застывший, а ждём ключ
   три секунды. Место и вид — как у spinnerGlyph: дуга 270° диаметром 0,76 от
   значка 22 px, слева от подписи «Czekamy na potwierdzenie…» (16 px, 600),
   текст и значок — на 50 % (кнопка в загрузке). */
function PasskeySpinner({ frame }: { frame: number }) {
  const t = useT()
  const label = textWidth(t('Czekamy na potwierdzenie…', 'Waiting for confirmation…'), 16, 600)
  const size = 22
  const iconX = LOGIN_CARD.width / 2 - (label + 30) / 2
  const cx = iconX + size / 2
  const cy = LOGIN_PASSKEY.y - LOGIN_CARD.y + 14 + size / 2
  const r = size * 0.38
  const stroke = size * 0.12
  const cover = r + stroke / 2 + 1
  return (
    <svg width={cover * 2 * LS} height={cover * 2 * LS} viewBox={`${-cover} ${-cover} ${cover * 2} ${cover * 2}`} style={{ position: 'absolute', left: (cx - cover) * LS, top: (cy - cover) * LS }}>
      <circle r={cover} fill={LIGHT.card} />
      <path
        d={`M 0 ${-r} A ${r} ${r} 0 1 1 ${-r} 0`}
        fill="none"
        stroke={LIGHT.text}
        strokeOpacity={0.5}
        strokeWidth={stroke}
        strokeLinecap="round"
        transform={`rotate(${(frame - CLICK) * 12})`}
      />
    </svg>
  )
}

/* Лист подтверждения системы (нейтральный, не продукт): стекло сверху кадра,
   отпечаток прорисовывается контуром, затем сменяется галочкой. Текст — только
   факты: учётная запись и домен, к которому привязан ключ. */
function PasskeySheet({ frame, x, accent }: { frame: number; x: number; accent: string }) {
  const enter = spring(frame, SHEET.at, SPRINGS.glide)
  const leave = easeIn(span(frame, SHEET.leave, 8))
  if (frame < SHEET.at || leave >= 1) return null
  const confirmed = easeInOut(span(frame, SHEET.confirm, 8))
  const width = 880
  return (
    <div
      style={{
        position: 'absolute',
        left: x - width / 2,
        top: mix(-560, 96, enter) - leave * 80,
        width,
        boxSizing: 'border-box',
        padding: '56px 60px 52px',
        borderRadius: 44,
        ...GLASS,
        background: 'rgba(255, 255, 255, 0.82)',
        opacity: 1 - leave,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: FONT,
      }}
    >
      <div style={{ position: 'relative', width: 176, height: 176 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - confirmed }}>
          <Icon name="fingerprintPattern" size={176} color={accent} stroke={1.3} stagger={0.5} p={easeOut(span(frame, SHEET.at + 4, 28))} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: confirmed }}>
          <Icon name="circleCheck" size={176} color={LIGHT.green} stroke={1.3} p={easeOut(span(frame, SHEET.confirm + 1, 16))} />
        </div>
      </div>
      <div style={{ marginTop: 34, fontSize: 46, fontWeight: 650, color: INK, letterSpacing: '-0.02em' }}>anna@simbia.eu</div>
      <div style={{ marginTop: 10, fontSize: 32, fontWeight: 500, color: MUTED }}>{HOST}</div>
    </div>
  )
}
