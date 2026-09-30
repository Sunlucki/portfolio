/* Набор приёмов v4 «SaaS 2D» — для роликов CRM, iApply, B2B и TAXI BOSS.
   Светлая сцена, 2D-кадры интерфейса, 3D-переходы элементов (CSS 3D), наезды
   камеры на место действия — без пролёта по миру. Витрина — композиция SaasKit
   (kit/Demo.tsx), полный пример — ролик CRM (src/saas/crm).

   ПРАВИЛА ВЛАДЕЛЬЦА (для всего, что строится на наборе)
   - Наш текст — простой текст: без бейджей и пилюль. Единственная рамка вокруг
     нашего текста — выноска <Callout>. Без длинных тире: запятая, двоеточие,
     точка. Текст внутри интерфейса — как в коде продукта.
   - Скругления везде, без острых углов. Счётчик (<Counter>) — только для
     функций продукта («19 modułów»), не для демо-цифр.
   - Телефон — без курсора: только <Tap> и <Swipe>.
   - Двойники экранов — по коду и словарю продукта, имена вымышленные.
   - Liquid Glass: матовое стекло, светлые кромки, мягкие тени; ни неона, ни
     насыщенных ореолов.
   - Темп и фокус (отзывы 28.09): в центре кадра — содержимое продукта, крупно
     и читаемо, фон вторичен. Сцена функции — 4–6 с и больше, длительность
     ролика не ограничена: каждому действию столько, сколько нужно. Ключевое
     действие — при стоящей камере ≥ 1,5 с. Всплывающее окно (диалог, тост,
     меню, уведомление, форма) — наездом focus() на 50–70% ширины кадра и не
     меньше readFrames(его текст). Предмет летит с экрана на экран — камера
     следует за ним (follow()).

   КАК СОБРАТЬ РОЛИК
     <Accent value={акцент продукта}>
       <Stage>                      фон: бумага, сетка точек, мягкие пятна
         <FontGate>                 держит кадр, пока Inter не загружен
           <Scenes plan={schedule([{ id, beats, tail, component }, …])} />
   Сцена — компонент; внутри useCurrentFrame() — кадр сцены, 0 стоит на доле.
   Следующая сцена ложится поверх предыдущей, та ещё tail кадров доигрывает
   уход под ней: 3D-переход делят две сцены, склейка остаётся на сетке.

   Мир и камера. Сцена раскладывает интерфейс в координатах кадра 1920 × 1080
   (мир; можно и шире — соседний экран справа) и кладёт его в
   <Camera view={viewAt(keys, frame)}>. Ключи камеры (по возрастанию at) —
   { at, dur, x, y, zoom } или готовые fit(rect, { max, shift }), focus(rect,
   { fill }), cover(rect), HOME, а для летящего предмета —
   { at, dur, follow: follow(position, { zoom, lag }) }. Выноски и курсор — вне
   камеры, в координатах кадра: точку мира переводит view.project(x, y),
   поэтому они не растут на наезде. Всплывающие окна продукта (тост, диалог) —
   в мире, на своём месте в интерфейсе: к ним едет камера.

   motion.ts     FPS 30, BEAT 15, BAR 60, beats(n); span(f, start, len) → 0…1;
                 easeIn/Out/InOut, glide (без перелёта); spring(f, start, SPRINGS.pop
                 | snap | glide | heavy) — pop даёт перелёт ~10%; presence();
                 readFrames(text) — сколько держать текст; noise()
   theme.ts      W, H, FONT, INK, MUTED, DIM, PAPER, CARD, LINE, SHADOW.{window,card,
                 lifted}, GLASS (стекло), Accent/useAccent, tint(hex, a), Rect, Point
   surfaces.tsx  <Stage>, <AppWindow url width height clip page> (строка CHROME = 46),
                 <Phone scale time dark statusBar> (экран 393 × 852 pt, IPHONE),
                 <Laptop width> (экран 16:10, LAPTOP_RATIO), <Label caps>
   camera.tsx    viewAt(keys, frame) → { transform, project }, <Camera view>, fit,
                 focus (всплывающее окно на долю кадра), follow (за летящим
                 предметом), cover (нырок), HOME
   painted.tsx   <FontGate>, canvasOf(texture), <Painted source crop ratio style> —
                 холст двойника из packages/oner в DOM (crop — в логических px
                 художника, ratio — его плотность: ratioOf(canvas, ширина));
                 textWidth(text, size, weight, em)
   scenes.tsx    schedule(specs, start), <Scenes plan>
   text.tsx      <Headline text at size mode=rise|focus underline strike exit>,
                 <Typing text at speed>, <Counter from to at digits>, <Marker>
   draw.tsx      <Icon name size p stagger> (lucide, прорисовка), <DrawPath d p>,
                 <Connector from to p frame flowing> (линия-связь с бусинами),
                 <Scribble rect p kind=circle|underline pad=[x, y]> (обводка —
                 скруглённый овал вокруг элемента), flowCurve, bezierPoint,
                 <QrCode x y size at> (QR-узор, модули по спирали; не читается),
                 <PaperPlane x y size angle fold> (письмо ушло)
   pointer.tsx   cursorAt(keys, frame, clicks, hide) → <Cursor x y press opacity>,
                 <Ripple x y at>; всё сразу — <CursorPath keys clicks hide view>
                 (ключи в мире, круги кликов на месте нажатия); телефон:
                 <Tap x y at scale>, <Swipe from to at>
   callout.tsx   <Callout anchor box={{ x, y, width }} tag="05 · 01 Start" title
                 at until> — рамку ставить сбоку от точки
   ui.tsx        <Toggle at on>, <Toast x y at title description tone>,
                 <IosNotification x y at app title body>, <PopIn rect at until
                 origin radius background> (диалог, меню, лист — встаёт из точки),
                 <Stamp rect at text icon color> + impact(frame, at) (м-печать)
   chart.tsx     <Bar rect value at>, <LineDraw points at dur>
   transitions   <Flip angle front back axis> (П15), <Swing t> (карусель, −1…1),
                 <Deck t> (колода П8, −1…1), <LayerStack t> + <Layer depth scale>
                 (стопка слоёв), <Lift from to t> (м-отрыв П4 / возврат П5),
                 <Portal from to t color toColor> (П1), <Iris at t color | children>
                 (П3), <Sweep t> (шторка-предмет П12: корпус телефона проносится
                 у камеры, склейка под ним — половина t в каждой сцене)
   lang.tsx      язык ролика: Lang = 'pl' | 'en', LangProvider (ставит Saas<X> по
                 пропу lang), useLang(), useT() → t(pl, en), pick(lang, pl, en).
                 Польский — по умолчанию; тайминг считать по польскому тексту
   mark.tsx      <SimbiaMark width at draw> — знак SIMBIA для финалов: контур
                 бесконечности прорисовывается, в нём проявляется знак ALUMINIUM
   theme.ts      … lerpRect(a, b, t), grow(rect, scale)
   icons.ts      ICONS — узлы lucide; новые иконки — копией из
                 node_modules/lucide-react/dist/esm/icons/*.mjs (не импортировать
                 lucide-react: вторая копия React)

   Двойники экранов (packages/oner/src/motion/*.ts) рисуются на холсте: звать
   художников в useMemo внутри <FontGate>, тему переключать их setXxxTheme
   прямо перед рисованием (пример — src/saas/crm/twins.ts). Холст 1× при
   наезде мягчеет выше своего размера: у плиток и строк художники дают 2×. */

export * from './callout'
export * from './camera'
export * from './chart'
export * from './draw'
export * from './icons'
export * from './lang'
export * from './mark'
export * from './motion'
export * from './painted'
export * from './pointer'
export * from './scenes'
export * from './surfaces'
export * from './text'
export * from './theme'
export * from './transitions'
export * from './ui'
