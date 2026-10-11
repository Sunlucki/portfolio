// The promos' chapters for the CV page: the site's own (src/content.ts, labels from src/i18n/en.ts), each at its
// scene's first frame in src/promo/saas (30 fps). Re-derive them if a promo's schedule changes.
export const PROMO_CHAPTERS = {
  crm: { frames: 6690, chapters: [['Dashboard', 435], ['Lead scoring', 1095], ['Priorities', 1575], ['Kanban', 2160], ['Offer', 2460], ['Follow-up', 3195], ['Invoice & KSeF', 3945], ['Mobile', 5535]] },
  b2b: { frames: 7725, chapters: [['Sign-up', 300], ['Approval', 1320], ['Store', 2175], ['Your price', 2955], ['Quick order', 3840], ['Trade credit', 4695], ['Shipping', 5325], ['Sales channels', 5685]] },
  hr: { frames: 6195, chapters: [['Start', 270], ['QR check-in', 1095], ['Shift market', 2145], ['Schedule', 2910], ['Tasks', 3615], ['Overtime', 4230], ['Absence', 4845], ['NFC', 5175]] },
  taxi: { frames: 5265, chapters: [['Candidate', 255], ['Sign-up', 975], ['Documents', 1635], ['Contract', 2490], ['Car', 3075], ['Fleet', 3555], ['Driver app', 4245]] },
};
