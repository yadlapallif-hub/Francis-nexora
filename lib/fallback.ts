import type { PortfolioData } from './types';

/**
 * Bundled default content — every value comes from the brief supplied by the
 * site owner (no invented qualifications). Used when Supabase is unreachable
 * so the platform always renders; live data always wins when available.
 */
export const FALLBACK_DATA: PortfolioData = {
  source: 'fallback',
  profile: {
    id: 'francis',
    full_name: 'Yadlapalli Francis',
    display_name: 'FRANCIS',
    title: 'Aspiring Software Engineer',
    education: 'B.Tech Computer Science and Engineering',
    college: 'Raghu Engineering College',
    location: 'Visakhapatnam, Andhra Pradesh, India',
    previous_education: 'Diploma in Computer Engineering',
    email: 'yadlapallif@gmail.com',
    instagram_url: 'https://www.instagram.com/itz__francis_566/',
    github_url: 'https://github.com/yadlapallif-hub',
    linkedin_url: '',
    whatsapp_url: '',
    resume_url: '',
    tagline: 'THINK. CREATE. BUILD. INNOVATE.',
    intro:
      "I'm Francis, an aspiring software engineer passionate about programming, technology, artificial intelligence, innovative digital products, and creating meaningful digital experiences.",
    avatar_url: '/images/francis-portrait.jpg',
  },
  about: [
    { id: 'fallback-about-1', title: 'Who I am', pillar: 'Identity', content: "I am Yadlapalli Francis — known as FRANCIS — an aspiring software engineer from Visakhapatnam, Andhra Pradesh, India. I'm pursuing B.Tech in Computer Science and Engineering at Raghu Engineering College after completing a Diploma in Computer Engineering.", display_order: 1, visible: true },
    { id: 'fallback-about-2', title: 'What I do', pillar: 'Craft', content: 'I build for the web and beyond: programming in Java, Python, C, C++ and JavaScript; exploring artificial intelligence and machine learning; and crafting digital products that are useful, fast and beautiful.', display_order: 2, visible: true },
    { id: 'fallback-about-3', title: 'How I think', pillar: 'Mindset', content: 'Think first, create with intention, build with discipline, innovate for impact. I believe great software is engineered — one clear system at a time.', display_order: 3, visible: true },
  ],
  skills: [
    { id: 'sk-1', name: 'Java', category: 'Programming Languages', level: 78, display_order: 1, visible: true },
    { id: 'sk-2', name: 'Python', category: 'Programming Languages', level: 76, display_order: 2, visible: true },
    { id: 'sk-3', name: 'C', category: 'Programming Languages', level: 74, display_order: 3, visible: true },
    { id: 'sk-4', name: 'C++', category: 'Programming Languages', level: 72, display_order: 4, visible: true },
    { id: 'sk-5', name: 'JavaScript', category: 'Programming Languages', level: 75, display_order: 5, visible: true },
    { id: 'sk-6', name: 'TypeScript', category: 'Programming Languages', level: 68, display_order: 6, visible: true },
    { id: 'sk-7', name: 'HTML5', category: 'Web Development', level: 84, display_order: 7, visible: true },
    { id: 'sk-8', name: 'CSS3', category: 'Web Development', level: 82, display_order: 8, visible: true },
    { id: 'sk-9', name: 'React', category: 'Web Development', level: 74, display_order: 9, visible: true },
    { id: 'sk-10', name: 'Tailwind CSS', category: 'Web Development', level: 78, display_order: 10, visible: true },
    { id: 'sk-11', name: 'Linux & FOSS', category: 'Tools & Platforms', level: 76, display_order: 11, visible: true },
    { id: 'sk-12', name: 'Git & GitHub', category: 'Tools & Platforms', level: 75, display_order: 12, visible: true },
    { id: 'sk-13', name: 'SQL & Databases', category: 'Tools & Platforms', level: 70, display_order: 13, visible: true },
    { id: 'sk-14', name: 'Artificial Intelligence', category: 'Domains', level: 70, display_order: 14, visible: true },
    { id: 'sk-15', name: 'Machine Learning', category: 'Domains', level: 64, display_order: 15, visible: true },
    { id: 'sk-16', name: 'Web Development', category: 'Domains', level: 78, display_order: 16, visible: true },
    { id: 'sk-17', name: 'Database Management', category: 'Domains', level: 70, display_order: 17, visible: true },
    { id: 'sk-18', name: 'Cybersecurity Education', category: 'Domains', level: 60, display_order: 18, visible: true },
  ],
  education: [
    { id: 'ed-1', degree: 'B.Tech', institution: 'Raghu Engineering College', field: 'Computer Science and Engineering', start_year: null, end_year: null, status: 'Pursuing', description: 'Undergraduate degree in Computer Science and Engineering.', display_order: 1, visible: true },
    { id: 'ed-2', degree: 'Diploma', institution: 'Diploma in Computer Engineering', field: 'Computer Engineering', start_year: null, end_year: null, status: 'Completed', description: 'Diploma in Computer Engineering — the foundation of my engineering journey.', display_order: 2, visible: true },
  ],
  projects: [
    {
      id: 'proj-nexora',
      title: 'NEXORA AGENT',
      slug: 'nexora-agent',
      tagline: 'An AI-powered agent platform, designed and built by Francis.',
      description:
        'NEXORA is an AI-powered agent platform and featured work of the FRANCIS studio — a premium web experience with an AI studio, agent conversations, memory, tasks and a private control surface. It demonstrates end-to-end product engineering: interface design, AI integration, data modelling and deployment.',
      technologies: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Vercel'],
      features: [
        'AI agent conversations with memory',
        'Private studio & admin control surface',
        'Structured knowledge documents',
        'Task and audit trail for the agent',
        'Deployed live on Vercel with Supabase backend',
      ],
      live_url: 'https://nexora-agent-site.vercel.app/?studio-check=db3087c',
      github_url: 'https://github.com/yadlapallif-hub',
      image_url: '/images/nexora-visual.jpg',
      featured: true,
      display_order: 1,
      visible: true,
    },
  ],
  experience: [],
  achievements: [],
  gallery: [],
  socials: [
    { id: 'so-1', platform: 'email', label: 'Email', url: 'mailto:yadlapallif@gmail.com', display_order: 1, visible: true },
    { id: 'so-2', platform: 'github', label: 'GitHub', url: 'https://github.com/yadlapallif-hub', display_order: 2, visible: true },
    { id: 'so-3', platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/itz__francis_566/', display_order: 3, visible: true },
    { id: 'so-4', platform: 'linkedin', label: 'LinkedIn', url: '', display_order: 4, visible: false },
    { id: 'so-5', platform: 'whatsapp', label: 'WhatsApp', url: '', display_order: 5, visible: false },
  ],
  settings: {
    theme: { accent: '#2563EB', mode: 'light' },
    homepage: {
      heroEyebrow: 'PORTFOLIO · AI WORKSPACE · STUDIO',
      headline: ['THINK.', 'CREATE.', 'BUILD.', 'INNOVATE.'],
      subline:
        "I'm Francis, an aspiring software engineer passionate about programming, technology, artificial intelligence, innovative digital products, and creating meaningful digital experiences.",
      ctaPrimary: 'Explore the work',
      ctaSecondary: 'Ask FRANCIS AI',
      scenes: { about: true, skills: true, education: true, projects: true, experience: true, contact: true },
    },
    seo: {
      title: 'FRANCIS — Yadlapalli Francis | Aspiring Software Engineer & AI Builder',
      description:
        'Yadlapalli Francis (FRANCIS) — aspiring software engineer from Visakhapatnam, India. Cinematic developer portfolio, general-purpose FRANCIS AI assistant, and live project showcase including NEXORA AGENT.',
      keywords:
        'Yadlapalli Francis, Francis, FRANCIS, aspiring software engineer, Raghu Engineering College, B.Tech CSE, NEXORA AGENT, portfolio, AI assistant',
    },
  },
};
