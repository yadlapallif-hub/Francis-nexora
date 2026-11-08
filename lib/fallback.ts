import type { SiteContent } from './types';

/**
 * Bundled default content — mirrors supabase/seed.sql.
 * The public site always renders even if the database is unreachable;
 * the Admin Studio edits the live database, so changes flow to the site.
 */
export const FALLBACK_CONTENT: SiteContent = {
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
    {
      title: 'Who I am',
      pillar: 'Identity',
      content:
        "I am Yadlapalli Francis — known as FRANCIS — an aspiring software engineer from Visakhapatnam, Andhra Pradesh, India. I'm pursuing B.Tech in Computer Science and Engineering at Raghu Engineering College after completing a Diploma in Computer Engineering.",
      display_order: 1,
      visible: true,
    },
    {
      title: 'What I do',
      pillar: 'Craft',
      content:
        'I build for the web and beyond: programming in Java, Python, C, C++ and JavaScript; exploring artificial intelligence and machine learning; and crafting digital products that are useful, fast and beautiful.',
      display_order: 2,
      visible: true,
    },
    {
      title: 'How I think',
      pillar: 'Mindset',
      content:
        'Think first, create with intention, build with discipline, innovate for impact. I believe great software is engineered — one clear system at a time.',
      display_order: 3,
      visible: true,
    },
  ],
  skills: [
    { name: 'Java', category: 'Programming Languages', level: 78, display_order: 1, visible: true },
    { name: 'Python', category: 'Programming Languages', level: 76, display_order: 2, visible: true },
    { name: 'C', category: 'Programming Languages', level: 74, display_order: 3, visible: true },
    { name: 'C++', category: 'Programming Languages', level: 72, display_order: 4, visible: true },
    { name: 'JavaScript', category: 'Programming Languages', level: 75, display_order: 5, visible: true },
    { name: 'TypeScript', category: 'Programming Languages', level: 68, display_order: 6, visible: true },
    { name: 'HTML5', category: 'Web Development', level: 84, display_order: 7, visible: true },
    { name: 'CSS3', category: 'Web Development', level: 82, display_order: 8, visible: true },
    { name: 'React', category: 'Web Development', level: 74, display_order: 9, visible: true },
    { name: 'Tailwind CSS', category: 'Web Development', level: 78, display_order: 10, visible: true },
    { name: 'Linux & FOSS', category: 'Tools & Platforms', level: 76, display_order: 11, visible: true },
    { name: 'Git & GitHub', category: 'Tools & Platforms', level: 75, display_order: 12, visible: true },
    { name: 'SQL & Databases', category: 'Tools & Platforms', level: 70, display_order: 13, visible: true },
    { name: 'Artificial Intelligence', category: 'Domains', level: 70, display_order: 14, visible: true },
    { name: 'Machine Learning', category: 'Domains', level: 64, display_order: 15, visible: true },
    { name: 'Web Development', category: 'Domains', level: 78, display_order: 16, visible: true },
    { name: 'Database Management', category: 'Domains', level: 70, display_order: 17, visible: true },
    { name: 'Cybersecurity Education', category: 'Domains', level: 60, display_order: 18, visible: true },
  ],
  education: [
    {
      degree: 'B.Tech',
      institution: 'Raghu Engineering College',
      field: 'Computer Science and Engineering',
      start_year: null,
      end_year: null,
      status: 'Pursuing',
      description: 'Undergraduate degree in Computer Science and Engineering.',
      display_order: 1,
      visible: true,
    },
    {
      degree: 'Diploma',
      institution: 'Diploma in Computer Engineering',
      field: 'Computer Engineering',
      start_year: null,
      end_year: null,
      status: 'Completed',
      description: 'Diploma in Computer Engineering — the foundation of my engineering journey.',
      display_order: 2,
      visible: true,
    },
  ],
  projects: [
    {
      title: 'NEXORA AGENT',
      slug: 'nexora-agent',
      tagline: 'An AI-powered agent platform, designed and built by Francis.',
      description:
        'NEXORA is an AI-powered agent platform and featured work of the FRANCIS studio — a premium web experience with AI agent conversations, memory, tasks and a private control studio. It demonstrates end-to-end product engineering: interface design, AI integration, data modelling and deployment.',
      technologies: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Vercel'],
      features: [
        'AI agent conversations with memory',
        'Private studio and admin control surface',
        'Structured knowledge documents',
        'Task and audit trail for the agent',
        'Deployed live on Vercel with a Supabase backend',
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
    { platform: 'email', label: 'Email', url: 'mailto:yadlapallif@gmail.com', display_order: 1, visible: true },
    { platform: 'github', label: 'GitHub', url: 'https://github.com/yadlapallif-hub', display_order: 2, visible: true },
    { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/itz__francis_566/', display_order: 3, visible: true },
    { platform: 'linkedin', label: 'LinkedIn', url: '', display_order: 4, visible: false },
    { platform: 'whatsapp', label: 'WhatsApp', url: '', display_order: 5, visible: false },
  ],
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
  theme: { accent: '#2563EB', mode: 'light' },
  maintenance: { enabled: false, message: 'FRANCIS is deploying an update — back shortly.' },
  ai: {
    enabled: true,
    welcomeMessage:
      "Hi — I'm FRANCIS AI, your intelligent digital assistant. Ask me anything: programming, science, research, writing, learning — or explore Francis and this platform. I can also read documents you upload (PDF, TXT, DOCX).",
    allowedUploads: ['pdf', 'txt', 'docx'],
  },
};
