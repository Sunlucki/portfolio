import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef, type CSSProperties } from 'react';

type AnimatedTextProps = { text: string; className?: string; style?: CSSProperties };

// Reveals the paragraph character by character (opacity 0.2 → 1) as it scrolls through the viewport.
export function AnimatedText({ text, className, style }: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.2'] });
  const chars = Array.from(text);

  return (
    <p ref={ref} className={className} style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {chars.map((char, i) => (
          <Char key={i} progress={scrollYProgress} range={[i / chars.length, (i + 1) / chars.length]}>
            {char}
          </Char>
        ))}
      </span>
    </p>
  );
}

function Char({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <span className="relative">
      <span className="invisible">{children}</span>
      <motion.span className="absolute left-0 top-0" style={{ opacity }}>
        {children}
      </motion.span>
    </span>
  );
}
