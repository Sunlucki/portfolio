import { ArrowUpRight, Mail } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';
import { SectionTitle } from '../components/SectionTitle';
import { Magnet } from '../components/Magnet';
import { ContactButton } from '../components/Buttons';
import { PERSON } from '../content';

const LINKS = [
  { label: 'LinkedIn', href: PERSON.linkedin },
  { label: 'GitHub', href: PERSON.github },
];

export function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden px-5 pb-10 pt-24 sm:px-8 md:px-10 md:pt-32">
      <img
        src="/about/pointer.webp"
        alt=""
        aria-hidden
        loading="lazy"
        className="pointer-events-none absolute -right-6 top-10 w-[120px] opacity-80 sm:w-[160px] md:right-[6%] md:w-[200px]"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
        <SectionTitle text="Let’s talk" className="w-full" />
        <FadeIn
          as="p"
          delay={0.15}
          className="max-w-[640px] font-light leading-relaxed text-[#D7E2EA]"
          style={{ fontSize: 'clamp(1rem, 1.8vw, 1.3rem)' }}
        >
          Open to remote product and design-engineering roles and B2B contracts. Based in {PERSON.location} — working with
          teams across Europe and the US.
        </FadeIn>
        <FadeIn delay={0.3}>
          <Magnet padding={100}>
            <ContactButton label="Email me" href={`mailto:${PERSON.email}`} />
          </Magnet>
        </FadeIn>
        <FadeIn delay={0.4} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm uppercase tracking-widest text-[#D7E2EA] md:text-base">
          <a href={`mailto:${PERSON.email}`} className="inline-flex items-center gap-2 transition-opacity hover:opacity-70">
            <Mail aria-hidden className="h-4 w-4" />
            {PERSON.email}
          </a>
          {LINKS.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition-opacity hover:opacity-70">
              {link.label}
              <ArrowUpRight aria-hidden className="h-4 w-4" />
            </a>
          ))}
        </FadeIn>
      </div>

      <footer className="relative mx-auto mt-24 max-w-6xl border-t border-[#D7E2EA]/15 pt-6 text-xs uppercase tracking-wider text-[#D7E2EA]/50">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {PERSON.name}
          </span>
          <span>B2B contracts via SIMBIA sp. z o.o.</span>
        </div>
        <p className="mt-4 text-center text-[0.65rem] normal-case tracking-normal text-[#D7E2EA]/35 sm:text-left [&_a]:underline-offset-2 hover:[&_a]:underline">
          3D model “<a href="https://sketchfab.com/3d-models/iphone-17-pro-max-87fc1df741384124a8ce0226d2b2058d">iPhone 17 Pro Max</a>” by{' '}
          <a href="https://sketchfab.com/MG990">MajdyModels</a>, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, recoloured.
          Micro Slats, Tech Text and Folder Float from <a href="https://reactbits.dev">React Bits</a>.
        </p>
      </footer>
    </section>
  );
}
