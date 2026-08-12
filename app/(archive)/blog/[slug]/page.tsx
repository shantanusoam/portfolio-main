import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleReader from "@/components/archive/ArticleReader";
import { archiveArticles, getArticle } from "@/lib/archive/data";
import { noteCoverBySlug } from "@/lib/portfolio/evidence";

interface ArticlePageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return archiveArticles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }: ArticlePageProps): Metadata {
  const article = getArticle(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} — Shantanu Soam`,
    description: article.dek,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.dek,
      images: [noteCoverBySlug[article.slug] ?? "/proof-assets/notes/portfolio-product.webp"],
    },
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticle(params.slug);
  if (!article) notFound();
  const index = archiveArticles.findIndex((item) => item.slug === article.slug);

  return (
    <ArticleReader
      article={article}
      previous={index > 0 ? archiveArticles[index - 1] : undefined}
      next={
        index < archiveArticles.length - 1
          ? archiveArticles[index + 1]
          : undefined
      }
    />
  );
}
