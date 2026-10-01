import { useEffect, useRef, useState } from 'react';
import { CatEgg } from '../components/CatEgg';
import { FadeIn } from '../components/FadeIn';
import { SectionTitle } from '../components/SectionTitle';
import FolderFloat, { type FolderFloatTrigger } from '../vendor/react-bits/FolderFloat';
import { STACK } from '../content';
import { fill, t } from '../i18n';

// Hoodie-blue folders; the notes inside are the tools.
const FOLDER = {
  folderColor: '#0e2a66',
  frontColor: '#1a56c4',
  paperColor: '#e9f1ff',
  itemColor: '#eef4ff',
  itemTextColor: '#0b1426',
  labelColor: '#f2f7ff',
  closeOnSelect: false,
} as const;

const useMedia = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);
  return matches;
};

/**
 * The tech stack as React Bits Folder Float folders: each opens on hover (tap on touch screens) and
 * its tools spring out as notes that can be dragged around. Wide screens get a 4 × 2 shelf with room
 * above every row for the notes; narrow ones a swipeable row whose middle folder opens by itself.
 */
export function StackSection() {
  const wide = useMedia('(min-width: 1024px)');
  const hover = useMedia('(hover: hover) and (pointer: fine)');
  const trigger: FolderFloatTrigger = hover ? 'hover' : 'click';
  const hint = hover
    ? t.stack.hover
    : wide
      ? t.stack.tap
      : t.stack.swipe;

  return (
    // (on phones it comes up over the numbers' stage as its last number goes: its lower half is empty by then)
    <section id="stack" className="relative -mt-[45svh] px-5 pb-20 pt-24 sm:px-8 md:mt-0 md:px-10 md:pb-28 md:pt-32">
      <SectionTitle text={t.stack.title} className="mx-auto max-w-6xl" />
      <FadeIn
        as="p"
        delay={0.1}
        className="mx-auto mt-2 max-w-[520px] text-center font-light leading-relaxed text-[#D7E2EA]/70"
        style={{ fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)' }}
      >
        {t.stack.intro} {hint}
      </FadeIn>
      {wide ? <Shelf trigger={trigger} /> : <Carousel trigger={trigger} />}
      <CatEgg />
      <ul className="sr-only">
        {STACK.map((folder) => (
          <li key={folder.name}>
            {folder.name}: {folder.items.join(', ')}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Shelf({ trigger }: { trigger: FolderFloatTrigger }) {
  return (
    <div className="mx-auto grid w-fit grid-cols-4 gap-x-8">
      {STACK.map((folder, i) => (
        <FadeIn key={folder.name} delay={(i % 4) * 0.08} className="flex justify-center pt-[210px]">
          <FolderFloat
            {...FOLDER}
            trigger={trigger}
            label={folder.name}
            sublabel={fill(t.stack.tools, { n: folder.items.length })}
            items={folder.items}
            width={160}
            height={118}
            spread={170}
          />
        </FadeIn>
      ))}
    </div>
  );
}

function Carousel({ trigger }: { trigger: FolderFloatTrigger }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const open = useRef(STACK.map(() => false));
  const [centred, setCentred] = useState(0);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const slides = [...root.children];
    const middle = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setCentred(slides.indexOf(entry.target))),
      { root, rootMargin: '0px -49% 0px -49%' },
    );
    slides.forEach((slide) => middle.observe(slide));
    const visible = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.6 });
    visible.observe(root);
    return () => {
      middle.disconnect();
      visible.disconnect();
    };
  }, []);

  // Once the row is on screen, open the folder in the middle and close the rest (through the folder's
  // own button, so it animates exactly as a tap would).
  useEffect(() => {
    [...(scrollerRef.current?.children ?? [])].forEach((slide, i) => {
      if ((onScreen && i === centred) !== open.current[i]) {
        slide.querySelector<HTMLButtonElement>('.folder-float__trigger')?.click();
      }
    });
  }, [centred, onScreen]);

  return (
    <div
      ref={scrollerRef}
      className="-mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[calc(50%-90px)] pb-4 pt-[250px] [scrollbar-width:none] sm:-mx-8 md:-mx-10 [&::-webkit-scrollbar]:hidden"
    >
      {STACK.map((folder, i) => (
        <div key={folder.name} className="shrink-0 snap-center">
          <FolderFloat
            {...FOLDER}
            trigger={trigger}
            label={folder.name}
            sublabel={fill(t.stack.tools, { n: folder.items.length })}
            items={folder.items}
            width={180}
            height={132}
            spread={150}
            onOpenChange={(value) => (open.current[i] = value)}
          />
        </div>
      ))}
    </div>
  );
}
