import type { Metadata } from "next";
import type { StandardDocument, StandardPublication } from "@skyscribe-sdk/core";
import {
  buildCanonicalUrl,
  buildPublicationUrl,
  generateDocumentJsonLd,
  generatePublicationJsonLd,
  standardSiteLinks,
} from "@skyscribe-sdk/core";

// Re-exported so consumers can render structured data and the
// site.standard link tags themselves. Next's Metadata object has no field
// for a raw <script> or an arbitrary <link rel>, so the page renders
// <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
// and standardSiteLinks()'s tags as <link> elements (React 19 hoists them
// into the head).
export { generateDocumentJsonLd, generatePublicationJsonLd, standardSiteLinks };

export function documentMetadata(
  document: StandardDocument,
  publication: StandardPublication
): Metadata {
  const canonicalUrl = buildCanonicalUrl(document, publication);
  // SEO Settings (core ADR 0004) replace the title and description here;
  // the JSON-LD headline keeps the Document's own title.
  const title = document.seo?.title ?? document.title;
  const description = document.seo?.description ?? document.description ?? undefined;
  return {
    title: `${title} — ${publication.name}`,
    description,
    alternates: { canonical: canonicalUrl },
    ...(document.seo?.noindex ? { robots: { index: false } } : {}),
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      siteName: publication.name,
      ...(document.coverImageUrl ? { images: [document.coverImageUrl] } : {}),
    },
    twitter: {
      card: document.coverImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(document.coverImageUrl ? { images: [document.coverImageUrl] } : {}),
    },
  };
}

export function publicationMetadata(publication: StandardPublication): Metadata {
  const url = buildPublicationUrl(publication);
  const description = publication.description ?? undefined;
  return {
    title: publication.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: publication.name,
      description,
      url,
      siteName: publication.name,
      ...(publication.splashImageUrl ? { images: [publication.splashImageUrl] } : {}),
    },
    twitter: {
      card: publication.splashImageUrl ? "summary_large_image" : "summary",
      title: publication.name,
      description,
      ...(publication.splashImageUrl ? { images: [publication.splashImageUrl] } : {}),
    },
  };
}

// ── Deprecated names (ADR 0005): removed in the next major ──────────────

/** @deprecated Use `documentMetadata`. */
export const articleMetadata = documentMetadata;
/** @deprecated Use `publicationMetadata`. */
export const siteMetadata = publicationMetadata;
