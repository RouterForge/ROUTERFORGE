export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readMinutes: number;
  featured?: boolean;
  author: string;
}

export const SAMPLE_POSTS: BlogPostSummary[] = [
  {
    slug: 'introducing-routerforge',
    title: 'Introducing RouterForge — one API for every frontier model',
    excerpt:
      'Why we built a multi-model AI subscription platform with first-class adapter support, and what comes next.',
    category: 'Product',
    tags: ['announcement', 'product'],
    publishedAt: '2025-01-08',
    readMinutes: 5,
    featured: true,
    author: 'RouterForge Team',
  },
  {
    slug: 'smart-routing-presets',
    title: 'Smart routing presets: Fastest, Best Reasoning, Best Value',
    excerpt:
      'How we let you pick a routing strategy without locking you into a single model.',
    category: 'Engineering',
    tags: ['routing', 'engineering'],
    publishedAt: '2025-01-15',
    readMinutes: 7,
    author: 'Eng Team',
  },
  {
    slug: 'why-time-based-pricing',
    title: 'Why we chose time-based pricing over per-token billing',
    excerpt: 'Predictable bills make it easier to ship — for solo builders and big teams alike.',
    category: 'Pricing',
    tags: ['pricing', 'product'],
    publishedAt: '2025-01-22',
    readMinutes: 4,
    author: 'Product',
  },
  {
    slug: 'adapter-architecture',
    title: 'Inside our provider adapter architecture',
    excerpt: 'A look at how RouterForge integrates new model providers without rewrites.',
    category: 'Engineering',
    tags: ['architecture', 'engineering'],
    publishedAt: '2025-02-02',
    readMinutes: 9,
    author: 'Eng Team',
  },
  {
    slug: 'launching-in-16-languages',
    title: 'Launching in 16 languages on day one',
    excerpt:
      'Our notes on doing real internationalization, RTL support, and locale-aware billing.',
    category: 'Product',
    tags: ['i18n', 'product'],
    publishedAt: '2025-02-10',
    readMinutes: 6,
    author: 'RouterForge Team',
  },
];

export function getPost(slug: string): BlogPostSummary | undefined {
  return SAMPLE_POSTS.find((p) => p.slug === slug);
}

export function listCategories(): string[] {
  return Array.from(new Set(SAMPLE_POSTS.map((p) => p.category)));
}

export function listTags(): string[] {
  return Array.from(new Set(SAMPLE_POSTS.flatMap((p) => p.tags))).sort();
}
