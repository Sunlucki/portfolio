import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ComponentType, CSSProperties, ReactNode } from 'react';

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

// motion.create() builds a motion component per tag; cache so it is created once. Typed as a div's motion
// component: a plain ElementType collapses to `never` props once @react-three/fiber adds its JSX elements.
type MotionTag = ComponentType<HTMLMotionProps<'div'>>;
const cache = new Map<Tag, MotionTag>();
const motionTag = (tag: Tag) => {
  if (!cache.has(tag)) cache.set(tag, motion.create(tag) as MotionTag);
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
