import { AnimatedText } from '../components/AnimatedText';
import { ContactButton } from '../components/Buttons';
import { CountUp } from '../components/CountUp';
import { FadeIn } from '../components/FadeIn';
import { ABOUT_TEXT, STATS } from '../content';

// Iridescent 3D objects from Bogdan's own brand kit, one per corner.
const DECOR = [
  { src: '/about/star.webp', delay: 0.1, x: -80, className: 'top-[3%] -left-[2%] w-[84px] sm:top-[4%] sm:left-[2%] sm:w-[160px] md:left-[4%] md:w-[210px]' },
  { src: '/about/rocket.webp', delay: 0.25, x: -80, className: 'bottom-[4%] left-[1%] w-[76px] sm:bottom-[8%] sm:left-[6%] sm:w-[140px] md:left-[10%] md:w-[180px]' },
  { src: '/about/mask.webp', delay: 0.15, x: 80, className: 'top-[3%] -right-[2%] w-[84px] sm:top-[4%] sm:right-[2%] sm:w-[160px] md:right-[4%] md:w-[210px]' },
  { src: '/about/sphere.webp', delay: 0.3, x: 80, className: 'bottom-[4%] right-[1%] w-[90px] sm:bottom-[8%] sm:right-[6%] sm:w-[170px] md:right-[10%] md:w-[220px]' },
];

export function AboutSection() {
  return (
    <section id="about" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-28 sm:px-8 sm:py-20 md:px-10">
      {DECOR.map((d) => (
        <FadeIn key={d.src} delay={d.delay} x={d.x} y={0} duration={0.9} className={`pointer-events-none absolute ${d.className}`}>
          <img src={d.src} alt="" aria-hidden loading="lazy" className="h-auto w-full" />
        </FadeIn>
      ))}

      <div className="relative z-10 flex flex-col items-center gap-16 sm:gap-20 md:gap-24">
        <div className="flex flex-col items-center gap-10 sm:gap-14 md:gap-16">
          <FadeIn
            as="h2"
            y={40}
            className="hero-heading text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            About me
          </FadeIn>
          <AnimatedText
            text={ABOUT_TEXT}
            className="max-w-[560px] text-center font-medium leading-relaxed text-[#D7E2EA]"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          />
          <ul className="grid w-full max-w-[760px] grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <li key={s.label} className="flex flex-col items-center text-center">
                <span className="hero-heading text-4xl font-black leading-none md:text-5xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </span>
                <span className="mt-2 text-[0.7rem] uppercase leading-snug tracking-wider text-[#D7E2EA]/60 md:text-xs">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <ContactButton />
      </div>
    </section>
  );
}
