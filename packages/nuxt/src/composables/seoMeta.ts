import type { Article, Site } from "@skyscribe-sdk/core";
import { buildCanonicalUrl, buildSiteUrl } from "@skyscribe-sdk/core";

export function articleSeoMeta(article: Article, site: Site) {
  const canonicalUrl = buildCanonicalUrl(article, site);
  // SEO Settings (core ADR 0004) replace the title and description here.
  const title = article.seo?.title ?? article.title;
  const description = article.seo?.description ?? article.description ?? undefined;
  return {
    title: `${title} — ${site.title}`,
    ogType: "article" as const,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl,
    ogSiteName: site.title,
    ogImage: article.coverImageUrl ?? undefined,
    twitterCard: (article.coverImageUrl
      ? "summary_large_image"
      : "summary") as "summary_large_image" | "summary",
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: article.coverImageUrl ?? undefined,
    ...(article.seo?.noindex ? { robots: "noindex" } : {}),
  };
}

export function siteSeoMeta(site: Site) {
  const siteUrl = buildSiteUrl(site);
  return {
    title: site.title,
    ogType: "website" as const,
    ogTitle: site.title,
    ogDescription: site.description ?? undefined,
    ogUrl: siteUrl,
    ogSiteName: site.title,
    ogImage: site.splashImageUrl ?? undefined,
    twitterCard: (site.splashImageUrl
      ? "summary_large_image"
      : "summary") as "summary_large_image" | "summary",
    twitterTitle: site.title,
    twitterDescription: site.description ?? undefined,
    twitterImage: site.splashImageUrl ?? undefined,
  };
}
