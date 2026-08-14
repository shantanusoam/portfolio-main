import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleReader from "@/components/archive/ArticleReader";
import { listArchiveArticles, getArchiveArticle } from "@/lib/archive/store";
import { noteCoverBySlug } from "@/lib/portfolio/evidence";

interface ArticlePageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const articles = await listArchiveArticles();
  return articles
    .filter((article) => !article.externalUrl)
    .map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const article = await getArchiveArticle(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} — Shantanu Soam`,
    description: article.dek,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.dek,
      images: [
        noteCoverBySlug[article.slug] ??
          "/proof-assets/notes/portfolio-product.webp",
      ],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const articles = await listArchiveArticles();
  const article = await getArchiveArticle(params.slug);
  if (!article || article.externalUrl) notFound();
  const internalArticles = articles.filter((item) => !item.externalUrl);
  const index = internalArticles.findIndex(
    (item) => item.slug === article.slug,
  );
  const previous = index > 0 ? internalArticles[index - 1] : undefined;
  const next =
    index < internalArticles.length - 1
      ? internalArticles[index + 1]
      : undefined;

  return <ArticleReader article={article} previous={previous} next={next} />;
}
