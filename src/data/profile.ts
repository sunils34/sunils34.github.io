export const profile = {
  name: 'Sunil Sadasivan',
  shortName: 'Sunil',
  title: 'Engineer, founder, and civic technologist',
  description:
    'Sunil Sadasivan is VP of Engineering at NGP VAN and founder of Pingdex. He builds technology and teams for campaigns, movements, and mission-driven organizations.',
  location: 'Washington, D.C.',
  email: 'sunil@libralabs.dev',
  social: {
    github: 'https://github.com/sunil-sadasivan',
    linkedin: 'https://www.linkedin.com/in/sunilsadasivan',
    medium: 'https://medium.com/@sunils34',
    x: 'https://x.com/sunils34',
  },
};

export const currentWork = [
  {
    eyebrow: 'VP of Engineering · NGP VAN',
    title: 'Building the next generation of progressive technology.',
    body: 'I lead engineering at the technology platform behind Democratic campaigns and progressive organizations—from school board races to the presidency.',
    href: 'https://www.ngpvan.com/',
    link: 'Visit NGP VAN',
    accent: 'blue',
  },
  {
    eyebrow: 'Founder · Pingdex',
    title: 'Making political fundraising more human.',
    body: 'I founded Pingdex to give campaigns a focused, modern call-time workspace—connecting donor data, conversations, follow-ups, and fundraising outcomes.',
    href: 'https://pingdex.app/',
    link: 'Visit Pingdex',
    accent: 'coral',
  },
] as const;

export const journey = [
  {
    when: 'Now',
    title: 'NGP VAN + Pingdex',
    body: 'Leading engineering at the backbone of Democratic campaign technology while continuing to build Pingdex.',
  },
  {
    when: 'Campaign tech',
    title: 'Cory Booker for President',
    body: 'Served as Deputy CTO, helping a national presidential campaign turn data and software into organizing power.',
  },
  {
    when: 'Public interest tech',
    title: 'Nava PBC',
    body: 'Helped modernize federal services at the Department of Veterans Affairs and moved deeper into civic technology.',
  },
  {
    when: 'Founder chapter',
    title: 'Matter',
    body: 'Co-founded a company focused on helping teams become more diverse, inclusive, and effective.',
  },
  {
    when: 'Scale-up chapter',
    title: 'Buffer',
    body: 'Joined as an Android contractor and became founding CTO, growing products, systems, and an engineering organization through global scale.',
  },
  {
    when: 'Early chapters',
    title: 'Kno + Fancite',
    body: 'Built software across the stack, learned from a first startup, and developed the craft and resilience that shaped everything after.',
  },
] as const;
