import { AnimatedText } from '../components/AnimatedText';
import { ContactButton } from '../components/Buttons';
import { CountUp } from '../components/CountUp';
import { DepthImage } from '../components/DepthImage';
import { SectionTitle } from '../components/SectionTitle';
import { ABOUT_TEXT, STATS } from '../content';
import { PORTRAIT, handoff } from '../three/aboutStage';

// The sides feather into the page and the hoodie fades out at the bottom, into the text that follows.
const { side, bottom } = PORTRAIT.feather;
const FEATHER = `linear-gradient(to right, transparent, #000 ${side * 100}%, #000 ${100 - side * 100}%, transparent), linear-gradient(to bottom, #000 ${bottom * 100}%, transparent)`;

export function AboutSection() {
  return (
    // Slides over the end of the manifesto, whose particles assemble the portrait on the stage (ManifestoSection).
    <section
      id="about"
      className="relative isolate overflow-hidden px-5 py-24 sm:px-8 md:px-10 md:py-32"
      style={{ marginTop: 'calc(-1 * var(--handoff, 0px))' }}
    >
      <SectionTitle text="About me" className="mx-auto max-w-6xl" />

      {/* The portrait, full width. It is pulled up under the title, whose letters sit on the photo's dark top,
          so the head (its crown 16% down the photo) starts just below them; phones get a taller crop. */}
      <div
        data-about-stage
        className="relative -z-10 -mx-5 mt-[calc(8px_-_20vw)] aspect-[4/5] sm:-mx-8 sm:mt-[calc(8px_-_10.67vw)] sm:aspect-[3/2] md:-mx-10"
        style={{ maskImage: FEATHER, maskComposite: 'intersect', WebkitMaskImage: FEATHER, WebkitMaskComposite: 'source-in', opacity: 'var(--reveal, 1)' }}
      >
        <img
          src={PORTRAIT.image}
          alt="Bogdan Nenadović, a low-angle portrait in a hoodie"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${PORTRAIT.focus[0] * 100}% ${PORTRAIT.focus[1] * 100}%` }}
        />
        <DepthImage
          image={PORTRAIT.image}
          depthMap={PORTRAIT.depth}
          specularMap={PORTRAIT.specular}
          focus={PORTRAIT.focus}
          hold={handoff}
          background="#0C0C0C"
          className="absolute inset-0"
        />
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center gap-10 text-center sm:mt-12">
        <AnimatedText
          text={ABOUT_TEXT}
          className="max-w-[640px] font-medium leading-relaxed text-[#D7E2EA]"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
        />
        <ul className="grid w-full max-w-[640px] grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {STATS.map((s) => (
            <li key={s.label} className="flex flex-col items-center text-center">
              <span className="hero-heading text-4xl font-black leading-none md:text-5xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </span>
              <span className="mt-2 text-xs uppercase leading-snug tracking-wider text-[#D7E2EA]/60">{s.label}</span>
            </li>
          ))}
        </ul>
        <ContactButton />
      </div>
    </section>
  );
}
