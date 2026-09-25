import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { FadeIn } from '../components/FadeIn';
import { LiveProjectButton } from '../components/Buttons';
import { PROJECTS, type Project } from '../content';

const RADIUS = 'rounded-[40px] sm:rounded-[50px] md:rounded-[60px]';

// Sticky cards that stack on top of each other; earlier cards shrink slightly as later ones arrive.
export function ProjectsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  return (
    <section
      id="projects"
      className={`relative z-10 -mt-10 bg-[#0C0C0C] px-4 pb-24 pt-20 sm:-mt-12 sm:px-6 md:-mt-14 md:px-10 md:pt-28 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px]`}
    >
      <FadeIn
        as="h2"
        y={40}
        className="hero-heading mb-10 text-center font-black uppercase leading-none tracking-tight md:mb-16"
        style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
      >
        Projects
      </FadeIn>
      <div ref={containerRef} className="relative">
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.name}
            project={project}
            index={i}
            progress={scrollYProgress}
            range={[i / PROJECTS.length, 1]}
            targetScale={1 - (PROJECTS.length - 1 - i) * 0.03}
          />
        ))}
      </div>
    </section>
  );
}

type CardProps = {
  project: Project;
  index: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
};

function ProjectCard({ project, index, progress, range, targetScale }: CardProps) {
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div className="sticky top-24 flex h-[85vh] items-start justify-center md:top-32">
      <motion.article
        style={{ scale, top: index * 28 }}
        className={`relative w-full max-w-6xl origin-top border-2 border-[#D7E2EA] bg-[#0C0C0C] p-4 sm:p-6 md:p-8 ${RADIUS}`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 px-2 sm:mb-6 md:mb-8">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <span className="hero-heading shrink-0 font-black leading-none" style={{ fontSize: 'clamp(3rem, 8vw, 110px)' }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <p className="text-[0.7rem] uppercase tracking-widest text-[#D7E2EA]/60 sm:text-sm">{project.category}</p>
              <h3 className="font-medium uppercase leading-tight text-[#D7E2EA]" style={{ fontSize: 'clamp(1.25rem, 2.6vw, 2.4rem)' }}>
                {project.name}
              </h3>
              <p className="mt-1 hidden max-w-xl text-sm font-light leading-snug text-[#D7E2EA]/70 sm:block md:text-base">
                {project.description}
              </p>
            </div>
          </div>
          {project.live ? (
            <LiveProjectButton href={project.live} />
          ) : (
            <span className="rounded-full border-2 border-[#D7E2EA]/30 px-8 py-3 text-sm uppercase tracking-widest text-[#D7E2EA]/50 sm:px-10 sm:py-3.5">
              Case study on request
            </span>
          )}
        </div>

        <div className="flex gap-3 sm:gap-4">
          <div className="flex w-[40%] flex-col gap-3 sm:gap-4">
            <img
              src={project.images[0]}
              alt={project.alts[0]}
              loading="lazy"
              className={`w-full object-cover object-top ${RADIUS}`}
              style={{ height: 'clamp(130px, 16vw, 230px)' }}
            />
            <img
              src={project.images[1]}
              alt={project.alts[1]}
              loading="lazy"
              className={`w-full object-cover object-top ${RADIUS}`}
              style={{ height: 'clamp(160px, 22vw, 340px)' }}
            />
          </div>
          <div className="w-[60%]">
            <img src={project.images[2]} alt={project.alts[2]} loading="lazy" className={`h-full w-full object-cover object-left-top ${RADIUS}`} />
          </div>
        </div>
      </motion.article>
    </div>
  );
}
