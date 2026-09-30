import { useT } from '../../kit/lang'
import { Brand, P, R, T } from '../twin'

/* Письмо «Konto B2B zatwierdzone» (server/src/services/email.ts,
   sendB2BAccountApproved): зелёная шапка со знаком и подзаголовком, заголовок,
   приветствие, абзац, кнопка-градиент «Otwórz panel B2B →», подпись. Письмо
   обрезано выше подвала с реквизитами. Знак — «HURTOWNIA DEMO». */

export const EMAIL = { w: 520, h: 600, cta: { x: 110, y: 392, w: 300, h: 56 } }

const GREEN = '#16a34a'
const GREEN2 = '#34c168'

export function ApprovalEmail({ press = 1 }: { press?: number }) {
  const { w, h } = EMAIL
  const t = useT()
  return (
    <g>
      <defs>
        <linearGradient id="b2b-mail-head" x1="0" y1="0" x2="1" y2="0.25">
          <stop offset="0" stopColor={GREEN} />
          <stop offset="1" stopColor={GREEN2} />
        </linearGradient>
        <clipPath id="b2b-mail-clip">
          <rect x={0} y={0} width={w} height={h} rx={22} />
        </clipPath>
      </defs>
      <R x={0} y={0} w={w} h={h} r={22} fill="#ffffff" />
      <g clipPath="url(#b2b-mail-clip)">
        <rect x={0} y={0} width={w} height={130} fill="url(#b2b-mail-head)" />
      </g>
      <Brand x={w / 2} y={70} s={24} first="#ffffff" second="#ffffff" a="middle" />
      <T x={w / 2} y={98} s={13} c="rgba(255,255,255,0.9)" a="middle">
        {t('Profesjonalne zaopatrzenie hurtowe', 'Professional Wholesale Supply')}
      </T>
      <T x={w / 2} y={188} s={24} w={700} c={GREEN} a="middle">
        {t('Konto B2B zatwierdzone', 'B2B account approved')}
      </T>
      <T x={30} y={236} s={16} c="#333333">
        {t('Cześć Anna,', 'Hi Anna,')}
      </T>
      <P x={30} y={272} s={16} c="#333333" width={w - 60} lh={26}>
        {t('Twoje konto kontrahenta B2B zostało zatwierdzone. Możesz zalogować się i korzystać z dedykowanych cen hurtowych.', 'Your B2B counterparty account has been approved. You can now sign in and access dedicated wholesale pricing.')}
      </P>
      <MailCta press={press} />
      <rect x={30} y={500} width={w - 60} height={1} fill="#eeeeee" />
      <T x={30} y={534} s={16} c="#555555">
        {t('Z poważaniem,', 'Best regards,')}
      </T>
      <T x={30} y={560} s={16} c="#555555">
        {t('Zespół Hurtownia Demo', 'The Hurtownia Demo Team')}
      </T>
    </g>
  )
}

/** Кнопка письма (градиент, тень в тон). press — нажатие. */
export function MailCta({ press = 1 }: { press?: number }) {
  const r = EMAIL.cta
  const t = useT()
  return (
    <g transform={`translate(${r.x + r.w / 2} ${r.y + r.h / 2}) scale(${press}) translate(${-(r.x + r.w / 2)} ${-(r.y + r.h / 2)})`}>
      <defs>
        <linearGradient id="b2b-mail-cta" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GREEN} />
          <stop offset="1" stopColor={GREEN2} />
        </linearGradient>
      </defs>
      <rect x={r.x} y={r.y + 4} width={r.w} height={r.h} rx={30} fill="rgba(22,163,74,0.18)" />
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={30} fill="url(#b2b-mail-cta)" />
      <T x={r.x + r.w / 2} y={r.y + r.h / 2 + 6} s={16} w={600} c="#ffffff" a="middle">
        {t('Otwórz panel B2B →', 'Open B2B panel →')}
      </T>
    </g>
  )
}

export const MAIL_GREEN = GREEN
