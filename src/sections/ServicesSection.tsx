import { FadeIn } from '../components/FadeIn';
import { SERVICES } from '../content';

export function ServicesSection() {
  return (
    <section
      id="services"
      className="rounded-t-[40px] bg-white px-5 py-20 text-[#0C0C0C] sm:rounded-t-[50px] sm:px-8 sm:py-24 md:rounded-t-[60px] md:px-10 md:py-32"
    >
      <FadeIn
        as="h2"
        y={40}
        className="mb-16 text-center font-black uppercase leading-none tracking-tight text-[#0C0C0C] sm:mb-20 md:mb-28"
        style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
      >
        Services
      </FadeIn>
      <ul className="mx-auto max-w-5xl">
        {SERVICES.map((service, i) => (
          <FadeIn
            as="li"
            key={service.name}
            delay={i * 0.1}
            className="flex items-start gap-5 py-8 sm:gap-8 sm:py-10 md:gap-12 md:py-12 [&:not(:first-child)]:border-t"
            style={{ borderColor: 'rgba(12, 12, 12, 0.15)' }}
          >
            <span className="shrink-0 font-black leading-none text-[#0C0C0C]" style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex flex-col gap-2 pt-1 md:gap-3 md:pt-3">
              <h3 className="font-medium uppercase" style={{ fontSize: 'clamp(1rem, 2.2vw, 2.1rem)' }}>
                {service.name}
              </h3>
              <p className="max-w-2xl font-light leading-relaxed opacity-60" style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.25rem)' }}>
                {service.description}
              </p>
            </div>
          </FadeIn>
        ))}
      </ul>
    </section>
  );
}
