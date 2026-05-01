import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SAMPLE_POSTS, listCategories, listTags } from '@/lib/blog';
import { formatDate } from '@/lib/utils';

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'blog' });

  const featured = SAMPLE_POSTS.find((p) => p.featured);
  const rest = SAMPLE_POSTS.filter((p) => !p.featured);
  const categories = listCategories();
  const tags = listTags();

  return (
    <div className="container-page max-w-6xl py-14">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {featured && (
        <Link href={`/blog/${featured.slug}` as any} className="block mt-12 group">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 sm:p-10">
                <Badge variant="gradient">{t('featured')}</Badge>
                <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
                <div className="mt-4 text-xs text-muted-foreground">
                  {featured.author} · {formatDate(featured.publishedAt, locale)} ·{' '}
                  {featured.readMinutes} min
                </div>
              </div>
              <div className="hidden md:block bg-gradient-to-br from-brand-500/30 to-fuchsia-500/30" />
            </div>
          </Card>
        </Link>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}` as any} className="group">
              <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {p.category}
                </div>
                <h3 className="mt-2 font-semibold group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                <div className="mt-4 text-xs text-muted-foreground">
                  {formatDate(p.publishedAt, locale)} · {p.readMinutes} min
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <aside className="space-y-6">
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {t('categories')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              {t('tags')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="soft">
                  #{tag}
                </Badge>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
