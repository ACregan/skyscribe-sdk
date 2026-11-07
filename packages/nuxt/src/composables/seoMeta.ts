import type { StandardDocument, StandardPublication } from "@skyscribe-sdk/core";
import { buildCanonicalUrl, buildPublicationUrl } from "@skyscribe-sdk/core";

export function documentSeoMeta(document: StandardDocument, publication: StandardPublication) {
  const canonicalUrl = buildCanonicalUrl(document, publication);
  // SEO Settings (core ADR 0004) replace the title and description here.
  const title = document.seo?.title ?? document.title;
  const description = document.seo?.description ?? document.description ?? undefined;
  return {
    title: `${title} — ${publication.name}`,
    ogType: "article" as const,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl,
    ogSiteName: publication.name,
    ogImage: document.coverImageUrl ?? undefined,
    twitterCard: (document.coverImageUrl
      ? "summary_large_image"
      : "summary") as "summary_large_image" | "summary",
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: document.coverImageUrl ?? undefined,
    ...(document.seo?.noindex ? { robots: "noindex" } : {}),
  };
}

export function publicationSeoMeta(publication: StandardPublication) {
  const url = buildPublicationUrl(publication);
  return {
    title: publication.name,
    ogType: "website" as const,
    ogTitle: publication.name,
    ogDescription: publication.description ?? undefined,
    ogUrl: url,
    ogSiteName: publication.name,
    ogImage: publication.splashImageUrl ?? undefined,
    twitterCard: (publication.splashImageUrl
      ? "summary_large_image"
      : "summary") as "summary_large_image" | "summary",
    twitterTitle: publication.name,
    twitterDescription: publication.description ?? undefined,
    twitterImage: publication.splashImageUrl ?? undefined,
  };
}

/** @deprecated Use `documentSeoMeta`. */
export const articleSeoMeta = documentSeoMeta;
/** @deprecated Use `publicationSeoMeta`. */
export const siteSeoMeta = publicationSeoMeta;
