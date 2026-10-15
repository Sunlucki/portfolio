// Everything the CV page says, in one language: its own labels (ui) and the CV itself, item for item in the order of
// src/cv/data.ts (which stays the English facts, the source of the PDFs). The figures, names and links come from
// data.ts and are not translated; every text here is.
export type CvText = {
  meta: { title: string; description: string };
  ui: {
    cv: string; // the line over the name
    updated: string; // {date}
    nav: { summary: string; delivery: string; experience: string; projects: string; fit: string; skills: string };
    subs: { delivery: string; experience: string; projects: string; fit: string; skills: string };
    builtIn2026: string;
    howIDeliver: string;
    beforeEngineering: string;
    tools: string;
    aiSystem: string;
    present: string;
    oneMonth: string;
    howBuilt: string;
    showEvidence: string;
    whatShowsIt: string;
    openAll: string;
    closeAll: string;
    filterLabel: string;
    filterNote: string; // {n} {total} {skill}
    download: string; // the visual PDF (in English)
    ats: string; // the one-column PDF (in English)
    openToWork: string;
    toolsCount: string; // {n}
    education: string;
    languages: string;
    portraitAlt: string;
    alsoAs: string; // the footer: this CV also as {txt}, {json} and {pdf}
    plainText: string;
    jsonResume: string;
    onePdf: string;
    site: string; // back to the main page
    language: string; // the language menu's name
    sections: string; // the section bar's name
    projectScreens: string; // {name}: its screens
    promoPoster: string; // {name}: a frame of its promo
    play: string; // {name}: play its promo
    projectsLink: string; // the way to the projects on the landing
    folders: { llm: string; integrations: string; frontend: string; backend: string }; // the skills' folders beside the groups'
  };
  headline: string;
  focus: string;
  location: string;
  terms: string;
  languages: [string, string][]; // name, level
  summary: { lead: string; builtIntro: string; built: string[]; delivery: string; background: string };
  numbers: { value: string; label: string }[];
  sdlc: { title: string; text: string }[];
  tools: string;
  aiSystems: string[];
  fit: { ask: string; evidence: string }[];
  experience: { role: string; org: string; place?: string; text: string }[];
  skillTags: Record<'ai-sdlc' | 'llm' | 'architecture' | 'ts' | 'node' | 'pg' | 'react' | 'swift' | 'cicd' | 'security' | 'payments', string>;
  projects: { name: string; status: string; text: string; metrics?: string[]; points: string[] }[];
  alsoBuilt: string;
  skills: { group: string; items: string[] }[];
  education: { degree: string; field: string }[];
};
