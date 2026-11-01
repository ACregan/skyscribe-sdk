import type { Metadata } from "next";
import type { Article, Site } from "@skyscribe-sdk/core";
import {
  buildCanonicalUrl,
  buildSiteUrl,
  generateArticleJsonLd,
  generateSiteJsonLd,
} from "@skyscribe-sdk/core";

// Re-exported so consumers can render structured data themselves — Next's
// Metadata object has no field for a raw <script> tag, so the convention is
// for the page component to render
// <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
// using these.
export { generateArticleJsonLd, generateSiteJsonLd };

export function articleMetadata(article: Article, site: Site): Metadata {
  const canonicalUrl = buildCanonicalUrl(article, site);
  // SEO Settings (core ADR 0004) replace the title and description here;
  // the JSON-LD headline keeps the article's own title.
  const title = article.seo?.title ?? article.title;
  const description = article.seo?.description ?? article.description ?? undefined;
  return {
    title: `${title} — ${site.title}`,
    description,
    alternates: { canonical: canonicalUrl },
    ...(article.seo?.noindex ? { robots: { index: false } } : {}),
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      siteName: site.title,
      ...(article.coverImageUrl ? { images: [article.coverImageUrl] } : {}),
    },
    twitter: {
      card: article.coverImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(article.coverImageUrl ? { images: [article.coverImageUrl] } : {}),
    },
  };
}

export function siteMetadata(site: Site): Metadata {
  const siteUrl = buildSiteUrl(site);
  return {
    title: site.title,
    description: site.description ?? undefined,
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      title: site.title,
      description: site.description ?? undefined,
      url: siteUrl,
      siteName: site.title,
      ...(site.splashImageUrl ? { images: [site.splashImageUrl] } : {}),
    },
    twitter: {
      card: site.splashImageUrl ? "summary_large_image" : "summary",
      title: site.title,
      description: site.description ?? undefined,
      ...(site.splashImageUrl ? { images: [site.splashImageUrl] } : {}),
    },
  };
}
