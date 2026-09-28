import TechText from '../vendor/react-bits/TechText';
import { FadeIn } from './FadeIn';

type SectionTitleProps = { text: string; light?: boolean; className?: string };

// Section heading drawn by Tech Text — the letters react to the cursor. The real text stays in the h2.
export function SectionTitle({ text, light = false, className = '' }: SectionTitleProps) {
  return (
    <FadeIn y={40} className={className}>
      <h2 className="sr-only">{text}</h2>
      <div aria-hidden style={{ height: 'clamp(4rem, 14vw, 190px)' }}>
        <TechText
          text={text.toUpperCase()}
          fontFamily="Kanit"
          fontWeight={900}
          fontSize={300}
          color={light ? '#0C0C0C' : '#BBCCD7'}
          accentColor={light ? '#1261D6' : '#7FB0FF'}
        />
      </div>
    </FadeIn>
  );
}
