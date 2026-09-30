import { useRef, type PointerEvent } from 'react';

type ScatterTextProps = { text: string; className?: string; letterClassName?: string };

const still = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A heading whose letters scatter from the cursor and bounce back (after React Bits Pro's Text Scatter): a
// letter the pointer sweeps over flies off along the sweep, turning, and a second later springs back into
// place. A tap knocks a letter too. The real text stays in the h2; the letters are for show.
export function ScatterText({ text, className = '', letterClassName = '' }: ScatterTextProps) {
  const box = useRef<HTMLDivElement>(null);
  const last = useRef({ x: 0, y: 0, t: 0 });

  const knock = (letter: HTMLElement, vx: number, vy: number) => {
    if (letter.dataset.flying) return;
    const speed = Math.hypot(vx, vy);
    // along the sweep, further the faster; a tap (no sweep) pops it up
    const [ux, uy] = speed > 1 ? [vx / speed, vy / speed] : [0, -1];
    const reach = Math.min(170, 40 + speed * 0.09);
    const dx = ux * reach + (Math.random() - 0.5) * 30;
    const dy = uy * reach + (Math.random() - 0.5) * 30;
    const turn = (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 60);
    const away = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${turn.toFixed(0)}deg)`;
    letter.dataset.flying = '1';
    const flight = letter.animate(
      [
        { transform: 'none', easing: 'cubic-bezier(0.15, 0.8, 0.3, 1)' },
        { transform: away, offset: 0.14 },
        { transform: away, offset: 0.33, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
        { transform: 'none' },
      ],
      { duration: 3000 },
    );
    flight.onfinish = flight.oncancel = () => delete letter.dataset.flying;
  };

  const onPointer = (e: PointerEvent<HTMLDivElement>) => {
    const el = box.current;
    if (!el || still) return;
    const now = performance.now();
    const prev = last.current;
    const dt = Math.max(8, now - prev.t) / 1000;
    const fresh = e.type === 'pointerdown' || now - prev.t > 120;
    const [vx, vy] = fresh ? [0, 0] : [(e.clientX - prev.x) / dt, (e.clientY - prev.y) / dt];
    const [fromX, fromY] = fresh ? [e.clientX, e.clientY] : [prev.x, prev.y];
    last.current = { x: e.clientX, y: e.clientY, t: now };
    // every letter the pointer passed over since the last event, found where it rests (its layout box)
    const origin = el.getBoundingClientRect();
    for (const letter of el.querySelectorAll<HTMLElement>('[data-letter]')) {
      const left = origin.left + letter.offsetLeft;
      const top = origin.top + letter.offsetTop;
      for (let s = 0; s <= 4; s++) {
        const x = fromX + ((e.clientX - fromX) * s) / 4;
        const y = fromY + ((e.clientY - fromY) * s) / 4;
        if (x >= left && x <= left + letter.offsetWidth && y >= top && y <= top + letter.offsetHeight) {
          knock(letter, vx, vy);
          break;
        }
      }
    }
  };

  return (
    <>
      <h2 className="sr-only">{text}</h2>
      <div ref={box} aria-hidden className={`relative select-none ${className}`} onPointerMove={onPointer} onPointerDown={onPointer}>
        {text.split(' ').map((word, w) => (
          <span key={w}>
            {w > 0 && ' '}
            <span className="inline-block whitespace-nowrap">
              {[...word].map((char, i) => (
                <span key={i} data-letter className={`inline-block ${letterClassName}`}>
                  {char}
                </span>
              ))}
            </span>
          </span>
        ))}
      </div>
    </>
  );
}
