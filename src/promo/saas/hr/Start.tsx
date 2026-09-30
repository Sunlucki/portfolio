import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { Callout } from '../kit/callout'
import { Camera, HOME, fit, focus, follow, viewAt, type CameraKey } from '../kit/camera'
import { Scribble } from '../kit/draw'
import { useLang, useT } from '../kit/lang'
import { SPRINGS, clamp01, easeIn, easeInOut, easeOut, glide, mix, span, spring } from '../kit/motion'
import { Painted } from '../kit/painted'
import { Cursor, Ripple, Tap, cursorAt } from '../kit/pointer'
import { useSoundCue, useSoundCues, useSoundTrack } from '../kit/sound'
import { AppWindow, CHROME } from '../kit/surfaces'
import { SHADOW, tint, type Rect } from '../kit/theme'
import { Iris, Portal } from '../kit/transitions'
import { hookToggle } from './Hook'
import { Handset, HotToast, Paper, SCREEN, arcPoint, centerOf, keyFrames, pageRect, phonePt, phoneRect, type PageSpot, type PhoneSpot } from './parts'
import { DESK, IA, JAN, LOGIN_PT, USER_FORM, USER_FORM_SUBMIT, USER_ROW, WORKERS_ADD, caption, drawLogin, drawUserForm, drawUserRow, drawWorkerHome, drawWorkersPage, sheet, tag, useLive, useSheets, type LoginState, type UserFormState } from './twins'

/* 03–04 · 01 Start · Konto → logowanie (37 долей). Из переключателя крючка
   кругом раскрывается окно администратора «Zarządzanie pracownikami» (П3).
   Курсор нажимает «Dodaj użytkownika» — кнопка раскрывается в форму «Dodaj
   nowego użytkownika» (П1), форма выходит вперёд, окно за ней светлеет, камера
   подъезжает к форме. Поля заполняются (м-ввод), «Utwórz użytkownika» —
   галочка. Форма сжимается в строку Jana с «Pracownik», в таблице встаёт новая
   строка. Строка отрывается и летит дугой в телефон справа (П6) — камера
   следует за ней; строка ложится в поле Email входа iApply.pl (сайт в Safari),
   адрес впечатывается сам, пароль — точками, касание «Zaloguj się», тост
   «Witamy z powrotem!» крупно. Кнопка растёт в экран работника (П1).

   0–24     круг из переключателя открывает окно
   30–70    наезд к кнопке; 48 — обводка; 68 — клик
   70–92    кнопка раскрывается в форму (портал), окно светлеет; 84–110 — к форме
   112–216  ввод: Jan · Kowalski · e-mail · hasło · 31,50
   130–256  выноска «Konto zakłada firma, pracownik tylko się loguje.»
   240      клик «Utwórz użytkownika»; 242–252 галочка; держится до 282
   282–304  форма сжимается в строку, в таблице — новая строка (296–306)
   330–378  строка летит в телефон, камера за ней; телефон встаёт (heavy)
   380–404  e-mail впечатывается; 408–420 пароль
   432      касание «Zaloguj się»; 432–448 загрузка
   448–516  тост «Witamy z powrotem!» — наезд ×3,4, держится
   516–540  отъезд к телефону целиком; 526–544 кнопка растёт в экран (П1)
   544–555  главная работника — с неё начинается следующая сцена */

export const START_BEATS = 37

const PAGE: PageSpot = { x: 240, y: 112, k: 1 }
const PHONE: PhoneSpot = { x: 2300, y: 114, scale: 1 }
const ADD = pageRect(PAGE, WORKERS_ADD)
const FORM: Rect = { x: PAGE.x + (DESK.width - USER_FORM.width) / 2, y: PAGE.y + (DESK.height - USER_FORM.height) / 2, width: USER_FORM.width, height: USER_FORM.height }
const SUBMIT: Rect = { x: FORM.x + USER_FORM_SUBMIT.x, y: FORM.y + USER_FORM_SUBMIT.y, width: USER_FORM_SUBMIT.width, height: USER_FORM_SUBMIT.height }
/** Строка Jana над первой строкой таблицы (таблица — с y 294 страницы). */
const ROW_REST: Rect = { x: PAGE.x + 288, y: PAGE.y + 291, width: USER_ROW.width, height: USER_ROW.height }
const TABLE_ROW: Rect = { x: PAGE.x + 281, y: PAGE.y + 294, width: 1134, height: 58 }
const EMAIL = phoneRect(PHONE, LOGIN_PT.email)
const BUTTON = phoneRect(PHONE, LOGIN_PT.button)
const LOGIN_CARD = phoneRect(PHONE, { x: 16, y: 300, width: 361, height: 330 })
const TOAST_W = 222
const TOAST: Rect = { x: PHONE.x + (SCREEN.width / 2 - TOAST_W / 2) * PHONE.scale, y: PHONE.y + 64 * PHONE.scale, width: TOAST_W * PHONE.scale, height: 50 * PHONE.scale }
const PHONE_CENTER = centerOf(phoneRect(PHONE, { x: 0, y: 0, ...SCREEN }))

const E = {
  click: 68,
  portal: 70,
  submit: 240,
  collapse: 282,
  fly: 330,
  flyDur: 48,
  email: 380,
  pass: 408,
  tap: 432,
  toast: 448,
  back: 516,
  grow: 526,
}

const FLY_FROM = centerOf(ROW_REST)
const FLY_TO = centerOf(EMAIL)

function rowAt(frame: number) {
  const t = glide(span(frame, E.fly, E.flyDur))
  const [x, y] = arcPoint(FLY_FROM, FLY_TO, t, 170)
  return { x, y, t, scale: mix(1.04, EMAIL.width / USER_ROW.width, t) }
}

const CAMERA: CameraKey[] = [
  { at: 0, ...HOME },
  { at: 28, dur: 42, ...fit({ x: PAGE.x + 640, y: PAGE.y + 40, width: 800, height: 420 }, { max: 1.32 }) },
  { at: 84, dur: 26, ...focus(FORM, { fill: 0.46, shift: [-300, 0] }) },
  { at: E.collapse, dur: 30, ...fit({ x: PAGE.x + 256, y: PAGE.y + 70, width: 1184, height: 430 }, { max: 1.45 }) },
  { at: E.fly - 4, dur: 16, follow: follow((f) => [rowAt(f).x, rowAt(f).y], { zoom: (f) => mix(1.3, 0.92, Math.sin(Math.PI * rowAt(f).t)), lag: 6 }) },
  { at: E.fly + E.flyDur + 2, dur: 24, ...focus(LOGIN_CARD, { fill: 0.4 }) },
  { at: E.toast - 2, dur: 20, ...focus(TOAST, { fill: 0.5 }) },
  { at: E.back, dur: 26, x: PHONE_CENTER[0], y: PHONE_CENTER[1], zoom: 1 },
]

/** Где лежит последний вид сцены: следующая сцена (главная) начинается с него. */
export const START_END_VIEW = { x: PHONE_CENTER[0], y: PHONE_CENTER[1], zoom: 1 }

const typed = (text: string, frame: number, start: number, speed: number) => (frame < start ? '' : text.slice(0, Math.min(text.length, Math.floor((frame - start) / speed) + 1)))
const dots = (frame: number, start: number, speed: number, count = 8) => (frame < start ? 0 : Math.min(count, Math.floor((frame - start) / speed) + 1))
const blink = (frame: number) => Math.floor(frame / 15) % 2 === 0

function formState(f: number): UserFormState {
  const focusOn: UserFormState['focus'] = f < 104 ? null : f < 122 ? 'first' : f < 144 ? 'last' : f < 186 ? 'email' : f < 204 ? 'password' : f < 220 ? 'rate' : null
  const typing = (f >= 112 && f < 118) || (f >= 124 && f < 140) || (f >= 146 && f < 182) || (f >= 188 && f < 200) || (f >= 206 && f < 216)
  return {
    first: typed(JAN.first, f, 112, 2),
    last: typed(JAN.last, f, 124, 2),
    email: typed(JAN.email, f, 146, 1.5),
    password: dots(f, 188, 1.5),
    rate: typed(JAN.rate, f, 206, 2),
    focus: focusOn,
    pressed: f >= E.submit - 2 && f < E.submit + 3,
    done: clamp01((f - (E.submit + 2)) / 10),
    caret: typing || blink(f),
  }
}

function loginState(f: number): LoginState {
  const typing = (f >= E.email && f < E.email + JAN.email.length) || (f >= E.pass && f < E.pass + 12)
  return {
    email: typed(JAN.email, f, E.email, 1),
    password: dots(f, E.pass, 1.5),
    focus: f < E.fly + E.flyDur ? null : f < E.pass - 2 ? 'email' : f < E.tap ? 'password' : null,
    pressed: f >= E.tap - 2 && f < E.tap + 2,
    loading: f >= E.tap && f < E.toast,
    toast: false,
    caret: typing || blink(f),
  }
}

const CURSOR_ADD = [
  { at: 34, x: ADD.x + 330, y: ADD.y + 400 },
  { at: 64, x: ADD.x + ADD.width * 0.62, y: ADD.y + ADD.height * 0.58 },
  { at: 90, x: ADD.x + 240, y: ADD.y + 430 },
]
const CURSOR_SUBMIT = [
  { at: 218, x: SUBMIT.x + 300, y: SUBMIT.y + 170 },
  { at: E.submit - 4, x: SUBMIT.x + SUBMIT.width * 0.56, y: SUBMIT.y + SUBMIT.height * 0.58 },
  { at: 268, x: SUBMIT.x + 260, y: SUBMIT.y + 190 },
]
const CLICK_ADD = cursorAt(CURSOR_ADD, E.click)
const CLICK_SUBMIT = cursorAt(CURSOR_SUBMIT, E.submit)

/* Кадры клавиш печати — те же старты и скорости, что у formState и loginState. */
const FIRST_KEYS = keyFrames(112, JAN.first.length, 2)
const LAST_KEYS = keyFrames(124, JAN.last.length, 2)
const EMAIL_KEYS = keyFrames(146, JAN.email.length, 1.5)
const PASSWORD_KEYS = keyFrames(188, 8, 1.5)
const RATE_KEYS = keyFrames(206, JAN.rate.length, 2)
const LOGIN_EMAIL_KEYS = keyFrames(E.email, JAN.email.length, 1)
const LOGIN_PASSWORD_KEYS = keyFrames(E.pass, 8, 1.5)

export function Start() {
  const frame = useCurrentFrame()
  const lang = useLang()
  const t = useT()
  const twins = useSheets(() => ({
    before: sheet(DESK.width, DESK.height, 2, (c) => drawWorkersPage(c, false)),
    after: sheet(DESK.width, DESK.height, 2, (c) => drawWorkersPage(c, true)),
    row: sheet(USER_ROW.width, USER_ROW.height, 3, drawUserRow),
    home: sheet(SCREEN.width, SCREEN.height, 3, (c) => drawWorkerHome(c, 'PL', '06:06')),
  }))
  const formNow = formState(frame)
  const form = useLive(USER_FORM.width, USER_FORM.height, 3, (c) => drawUserForm(c, formNow), JSON.stringify(formNow))
  const loginNow = loginState(frame)
  const login = useLive(SCREEN.width, SCREEN.height, 3.4, (c) => drawLogin(c, loginNow), JSON.stringify(loginNow))

  const camera = viewAt(CAMERA, frame)
  const iris = glide(span(frame, 0, 24))
  const portal = glide(span(frame, E.portal, 20))
  const lift = spring(frame, E.portal + 8, SPRINGS.heavy) * (1 - glide(span(frame, E.collapse, 22)))
  const collapse = easeInOut(span(frame, E.collapse, 22))
  const swap = easeOut(span(frame, 296, 10))
  const fresh = Math.sin(Math.PI * clamp01(span(frame, 300, 40)))
  const rise = spring(frame, E.fly - 12, SPRINGS.heavy)
  const row = rowAt(frame)
  const grow = glide(span(frame, E.grow, 18))

  /* Форма: от портала до сжатия в строку — один блок, его прямоугольник едет от
     формы к строке; форма гаснет, строка проявляется. */
  const box: Rect = {
    x: mix(FORM.x, ROW_REST.x, collapse),
    y: mix(FORM.y, ROW_REST.y, collapse),
    width: mix(FORM.width, ROW_REST.width, collapse),
    height: mix(FORM.height, ROW_REST.height, collapse),
  }
  const formShown = frame >= E.portal + 18 && frame < E.fly
  const formOpacity = easeOut(span(frame, E.portal + 18, 6)) * (1 - easeIn(span(frame, E.collapse, 7)))
  const rowOpacity = easeOut(span(frame, E.collapse + 10, 10))
  /* Окно администратора уходит, когда строка улетела: в конце сцены в кадре
     только телефон — так стык со следующей сценой чистый. */
  const windowOut = easeInOut(span(frame, E.fly + E.flyDur, 24))

  const cursorAdd = cursorAt(CURSOR_ADD, frame, [E.click], 84)
  const cursorSubmit = cursorAt(CURSOR_SUBMIT, frame, [E.submit], 262)
  const [ax, ay] = camera.project(cursorAdd.x, cursorAdd.y)
  const [sx, sy] = camera.project(cursorSubmit.x, cursorSubmit.y)
  const [rax, ray] = camera.project(CLICK_ADD.x, CLICK_ADD.y)
  const [rsx, rsy] = camera.project(CLICK_SUBMIT.x, CLICK_SUBMIT.y)

  /* Выноска: точка — на роли «Pracownik» в форме, рамка — справа от формы. */
  const anchor = camera.project(FORM.x + 24 + 194 * 0.78, FORM.y + 338 + 21)
  const boxX = camera.project(FORM.x + FORM.width, 0)[0] + 70

  /* Звук: поля формы печатаются (каждое — со своего места), «Utwórz
     użytkownika» — успех; форма сжимается в строку, в таблице встаёт строка
     Jana; строка летит в телефон, телефон встаёт; строка садится в поле Email,
     адрес и пароль впечатываются. Клики, касание, портал и тост — у приёмов. */
  const at = (x: number, y: number) => {
    const [px, py] = camera.project(x, y)
    return { x: px, y: py }
  }
  useSoundCues('key', FIRST_KEYS, at(FORM.x + 121, FORM.y + 89))
  useSoundCues('key', LAST_KEYS, at(FORM.x + 327, FORM.y + 89))
  useSoundCues('key', EMAIL_KEYS, at(FORM.x + 224, FORM.y + 143))
  useSoundCues('key', PASSWORD_KEYS, at(FORM.x + 224, FORM.y + 197))
  useSoundCues('key', RATE_KEYS, at(FORM.x + 224, FORM.y + 305))
  useSoundCue('success', E.submit + 4, at(SUBMIT.x + SUBMIT.width / 2, SUBMIT.y + SUBMIT.height / 2), { gain: 0.85 })
  useSoundCue('air', E.collapse, at(...centerOf(FORM)), { gain: 0.4, seconds: 0.5 })
  useSoundCue('popIn', 296, at(...centerOf(TABLE_ROW)), { gain: 0.5 })
  useSoundCue('whoosh', E.fly - 12, at(PHONE_CENTER[0], PHONE_CENTER[1] + (1 - rise) * 620), { gain: 0.45, seconds: 0.6 })
  useSoundTrack('hr2d-row-fly', 'whoosh', frame >= E.fly && frame <= E.fly + E.flyDur, at(row.x, row.y), { gain: 0.6 })
  useSoundCue('thump', E.fly + E.flyDur, at(...centerOf(EMAIL)), { gain: 0.45 })
  useSoundCues('key', LOGIN_EMAIL_KEYS, at(...centerOf(EMAIL)))
  useSoundCues('key', LOGIN_PASSWORD_KEYS, at(EMAIL.x + EMAIL.width / 2, EMAIL.y + EMAIL.height / 2 + 56))

  return (
    <AbsoluteFill>
      <Iris at={hookToggle(lang)} t={iris} start={30}>
        <Paper opacity={1 - easeOut(span(frame, 28, 14))} />
        <Camera view={camera}>
          <AppWindow url="iapply.com.pl/admin/workers" width={DESK.width} height={DESK.height} style={{ left: PAGE.x, top: PAGE.y - CHROME, opacity: 1 - windowOut }}>
            <Painted source={twins.before} style={{ inset: 0, opacity: 1 - swap }} />
            <Painted source={twins.after} style={{ inset: 0, opacity: swap }} />
            <div style={{ position: 'absolute', left: TABLE_ROW.x - PAGE.x, top: TABLE_ROW.y - PAGE.y, width: TABLE_ROW.width, height: TABLE_ROW.height, background: tint(IA.primary, 0.14 * fresh) }} />
            {/* Окно за формой светлеет: кадр остаётся светлым (как вход CRM). */}
            <div style={{ position: 'absolute', inset: 0, background: '#f7f8fa', opacity: 0.62 * Math.max(lift, frame < E.collapse ? easeOut(span(frame, E.portal, 14)) : 0) }} />
          </AppWindow>
          <Scribble rect={ADD} p={easeOut(span(frame, 46, 16)) * (1 - easeIn(span(frame, E.portal + 4, 8)))} pad={[14, 9]} seed={2} width={2.6} />
          {frame < E.portal + 21 && <Portal from={ADD} to={FORM} t={portal} color={IA.primary} toColor="#ffffff" radius={[8, 16]} />}
          {formShown && (
            <div
              style={{
                position: 'absolute',
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
                borderRadius: mix(16, 12, collapse),
                background: '#ffffff',
                overflow: 'hidden',
                boxShadow: SHADOW.lifted,
                transform: `scale(${1 + 0.02 * lift})`,
              }}
            >
              <div style={{ position: 'absolute', left: (box.width - FORM.width) / 2, top: (box.height - FORM.height) / 2, width: FORM.width, height: FORM.height, opacity: formOpacity }}>
                <Painted source={form} style={{ inset: 0 }} />
              </div>
              <div style={{ position: 'absolute', left: (box.width - ROW_REST.width) / 2, top: (box.height - ROW_REST.height) / 2, width: ROW_REST.width, height: ROW_REST.height, opacity: rowOpacity }}>
                <Painted source={twins.row} style={{ inset: 0 }} />
              </div>
            </div>
          )}
          {frame >= E.fly && frame < E.fly + E.flyDur + 8 && (
            <div
              style={{
                position: 'absolute',
                left: row.x - USER_ROW.width / 2,
                top: row.y - USER_ROW.height / 2,
                width: USER_ROW.width,
                height: USER_ROW.height,
                borderRadius: 12,
                transform: `scale(${row.scale})`,
                boxShadow: SHADOW.lifted,
                opacity: 1 - easeIn(span(frame, E.fly + E.flyDur - 2, 8)),
              }}
            >
              <Painted source={twins.row} style={{ inset: 0 }} />
            </div>
          )}
          <Handset spot={PHONE} style={{ transform: `translateY(${(1 - rise) * 620}px)`, opacity: frame < E.fly - 12 ? 0 : 1 }}>
            <Painted source={login} style={{ inset: 0 }} />
            {grow > 0 && <Portal from={{ ...LOGIN_PT.button }} to={{ x: 0, y: 0, ...SCREEN }} t={grow} color={IA.primary} toColor={IA.gray50} radius={[8, 0]} />}
            <Painted source={twins.home} style={{ inset: 0, opacity: easeOut(span(frame, E.grow + 10, 8)) }} />
            <HotToast x={SCREEN.width / 2} y={64} at={E.toast} until={E.grow + 4} label={t('Witamy z powrotem!', 'Welcome back!')} />
          </Handset>
          <Tap x={BUTTON.x + BUTTON.width / 2} y={BUTTON.y + BUTTON.height / 2} at={E.tap} scale={PHONE.scale} />
          {/* Каретка поля e-mail на телефоне: строка Jana «вливается» в поле. */}
          {frame >= E.fly + E.flyDur - 4 && frame < E.email + 4 && (
            <div style={{ position: 'absolute', left: EMAIL.x - 3, top: EMAIL.y - 3, width: EMAIL.width + 6, height: EMAIL.height + 6, borderRadius: 11, boxShadow: `0 0 0 ${3 * (1 - span(frame, E.fly + E.flyDur, 10))}px ${tint(IA.primary, 0.35)}` }} />
          )}
        </Camera>
        <Callout anchor={anchor} box={{ x: boxX, y: anchor[1] - 210, width: 560 }} tag={tag(3, lang)} title={caption(3, lang)} at={130} until={256} />
        <Ripple x={rax} y={ray} at={E.click} />
        <Ripple x={rsx} y={rsy} at={E.submit} />
        <Cursor x={ax} y={ay} press={cursorAdd.press} opacity={cursorAdd.opacity} />
        <Cursor x={sx} y={sy} press={cursorSubmit.press} opacity={cursorSubmit.opacity} />
      </Iris>
    </AbsoluteFill>
  )
}

/** Точка телефона сцены → точка кадра в её последнем виде (для стыка со следующей). */
export const startPhonePt = (x: number, y: number) => phonePt(PHONE, x, y)
