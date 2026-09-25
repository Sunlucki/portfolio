import { motion } from 'framer-motion';
import type { CSSProperties, ElementType, ReactNode } from 'react';

type Tag = 'div' | 'nav' | 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'span';

type FadeInProps = {
  as?: Tag;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'aria-label'?: string;
};

// motion.create() builds a motion component per tag; cache so it is created once.
const cache = new Map<Tag, ElementType>();
const motionTag = (tag: Tag) => {
  if (!cache.has(tag)) cache.set(tag, motion.create(tag));
  return cache.get(tag)!;
};

export function FadeIn({ as = 'div', delay = 0, duration = 0.7, x = 0, y = 30, children, ...rest }: FadeInProps) {
  const Comp = motionTag(as);
  return (
    <Comp
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
