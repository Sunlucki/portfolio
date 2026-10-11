import '@fontsource-variable/inter';
import { Composition } from 'remotion';
import { SAAS_B2B_FRAMES, SaasB2B } from '../../../src/promo/saas/b2b/SaasB2B';
import { SAAS_CRM_FRAMES, SaasCRM } from '../../../src/promo/saas/crm/SaasCRM';
import { SAAS_HR_FRAMES, SaasHR } from '../../../src/promo/saas/hr/SaasHR';
import { SAAS_TAXI_FRAMES, SaasTAXI } from '../../../src/promo/saas/taxi/SaasTAXI';

// as the site's players show them: 1920 × 1080 at 30 fps, in English
const PROMOS = [
  ['crm', SaasCRM, SAAS_CRM_FRAMES],
  ['b2b', SaasB2B, SAAS_B2B_FRAMES],
  ['hr', SaasHR, SAAS_HR_FRAMES],
  ['taxi', SaasTAXI, SAAS_TAXI_FRAMES],
] as const;

export const Root = () => (
  <>
    {PROMOS.map(([id, component, frames]) => (
      <Composition key={id} id={id} component={component} durationInFrames={frames} fps={30} width={1920} height={1080} defaultProps={{ lang: 'en' as const }} />
    ))}
  </>
);
