import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { getPost, SAMPLE_POSTS } from '@/lib/blog';
import { formatDate } from '@/lib/utils';

export async function generateStaticParams() {
  return SAMPLE_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article' },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="container-page max-w-3xl py-14">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← Blog
      </Link>
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Badge>{post.category}</Badge>
        {post.tags.map((t) => (
          <Badge key={t} variant="soft">
            #{t}
          </Badge>
        ))}
      </div>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
        {post.title}
      </h1>
      <div className="mt-3 text-sm text-muted-foreground">
        {post.author} · {formatDate(post.publishedAt, locale)} · {post.readMinutes} min read
      </div>
      <div
        aria-hidden
        className="my-8 h-56 rounded-2xl bg-gradient-to-br from-brand-500/30 via-fuchsia-500/20 to-amber-500/20"
      />
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-foreground/90 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3">
        <p className="text-lg">{post.excerpt}</p>
        <p>
          This is a placeholder body for the article shell. In a real deployment, blog posts
          come from your CMS (Notion, Sanity, MDX in repo, or the BlogPost model in this
          schema). The shell preserves SEO meta, hreflang, and the URL structure so swapping
          in real content is friction-free.
        </p>
        <h2>What's covered</h2>
        <p>
          Each post page includes a structured header, category & tag chips, an author byline,
          and a hero placeholder. RouterForge's i18n stack means you can translate posts per
          locale via the `BlogPost.locale` field.
        </p>
        <h2>Why it matters</h2>
        <p>
          Premium SaaS lives or dies on documentation and storytelling. Treat the blog as
          part of the product, not an afterthought.
        </p>
      </div>
    </article>
  );
}
