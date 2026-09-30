import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// A stretch of the text shown in its own colours, a letter each, and wrapped by `render` (say, in a button), which
// is told once the reveal has filled it all in (`filled`).
type Highlight = { text: string; colors: string[]; render: (letters: ReactNode, filled: boolean) => ReactNode };
type AnimatedTextProps = { text: string; className?: string; style?: CSSProperties; highlight?: Highlight };

// Reveals the paragraph character by character (opacity 0.2 → 1) as it scrolls through the viewport. The
// characters shown are marked data-char, for whatever wants to move them.
export function AnimatedText({ text, className, style, highlight }: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.2'] });
  const chars = Array.from(text);
  const letters = (from: number, to: number, colors?: string[]) =>
    chars.slice(from, to).map((char, k) => (
      <Char key={from + k} progress={scrollYProgress} range={[(from + k) / chars.length, (from + k + 1) / chars.length]} color={colors?.[k]}>
        {char}
      </Char>
    ));
  const found = highlight ? text.indexOf(highlight.text) : -1;
  const at = found < 0 ? -1 : Array.from(text.slice(0, found)).length; // in characters, as `chars` counts
  const end = at + (highlight ? Array.from(highlight.text).length : 0);
  // the highlight filled in: the reveal past its last letter
  const [filled, setFilled] = useState(false);
  useMotionValueEvent(scrollYProgress, 'change', (value) => setFilled(value >= end / chars.length));
  useEffect(() => setFilled(scrollYProgress.get() >= end / chars.length), [scrollYProgress, end, chars.length]);

  return (
    <p ref={ref} className={className} style={style}>
      {highlight && at >= 0 ? (
        // read as text, the highlight as whatever it is rendered into
        <>
          <span className="sr-only">{chars.slice(0, at).join('')}</span>
          <span aria-hidden>{letters(0, at)}</span>
          {highlight.render(<span aria-hidden>{letters(at, end, highlight.colors)}</span>, filled)}
          <span className="sr-only">{chars.slice(end).join('')}</span>
          <span aria-hidden>{letters(end, chars.length)}</span>
        </>
      ) : (
        <>
          <span className="sr-only">{text}</span>
          <span aria-hidden>{letters(0, chars.length)}</span>
        </>
      )}
    </p>
  );
}

function Char({ children, progress, range, color }: { children: string; progress: MotionValue<number>; range: [number, number]; color?: string }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <span className="relative">
      <span className="invisible">{children}</span>
      <motion.span data-char className="absolute left-0 top-0" style={{ opacity, color }}>
        {children}
      </motion.span>
    </span>
  );
}
