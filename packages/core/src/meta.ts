import type { StandardDocument, StandardPublication } from "./types.js";

// A plain, JSON-serializable object — matches the shape consuming frameworks'
// own JSON-LD types expect (e.g. React Router's LdJsonObject) without this
// package depending on any framework's types directly.
export type JsonLdObject = {
  [key: string]: string | number | boolean | null | JsonLdObject | JsonLdObject[];
};

export type ScribeMetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: "link"; rel: string; href: string }
  | { "script:ld+json": JsonLdObject };

/** A `<link>` tag, as the meta helpers describe one. */
export type StandardSiteLink = { tagName: "link"; rel: string; href: string };

export function buildCanonicalUrl(
  document: StandardDocument,
  publication: StandardPublication
): string {
  if (document.canonicalUrl) return document.canonicalUrl;
  const base = `https://${publication.domain.replace(/\/$/, "")}`;
  const path = document.path.startsWith("/") ? document.path : `/${document.path}`;
  // Publishing writes `path` with the base path already in it
  // ("/blog/essays/my-post"), so only add the base path when it's missing.
  // Prepending it unconditionally produced "/blog/blog/essays/my-post".
  const prefix = publication.basePath ? `/${publication.basePath}` : "";
  const hasPrefix = prefix !== "" && (path === prefix || path.startsWith(`${prefix}/`));
  return `${base}${hasPrefix ? "" : prefix}${path}`;
}

export function buildPublicationUrl(publication: StandardPublication): string {
  return `https://${publication.domain}${publication.basePath ? `/${publication.basePath}` : ""}`;
}

/** The `<link rel="site.standard.publication">` tag (and, given a Document,
 * `<link rel="site.standard.document">`) that tell other apps which records
 * a page shows. Bluesky needs them, server-rendered, to draw its
 * Standard.site link card. The meta helpers include them already; use this
 * on pages that don't use the meta helpers (Category pages, custom heads). */
export function standardSiteLinks(
  publication: StandardPublication,
  document?: StandardDocument
): StandardSiteLink[] {
  const links: StandardSiteLink[] = [
    { tagName: "link", rel: "site.standard.publication", href: publication.uri },
  ];
  if (document) {
    links.push({ tagName: "link", rel: "site.standard.document", href: document.uri });
  }
  return links;
}

// Standalone so frameworks whose metadata API has no room for a raw
// <script> tag (e.g. Next.js's Metadata object) can still get the
// structured-data payload and render it themselves.
export function generateDocumentJsonLd(
  document: StandardDocument,
  publication: StandardPublication
): JsonLdObject {
  const canonicalUrl = buildCanonicalUrl(document, publication);
  const authorName = document.contributors?.[0]?.displayName ?? publication.name;

  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: document.title,
    datePublished: document.publishedAt,
    dateModified: document.updatedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: publication.name,
      ...(publication.logoImageUrl
        ? { logo: { "@type": "ImageObject", url: publication.logoImageUrl } }
        : {}),
    },
  };
  if (document.description) jsonLd.description = document.description;
  if (document.coverImageUrl) jsonLd.image = document.coverImageUrl;
  if (document.tags?.length) jsonLd.keywords = document.tags.join(", ");
  return jsonLd;
}

export function generatePublicationJsonLd(publication: StandardPublication): JsonLdObject {
  const jsonLd: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: publication.name,
    url: buildPublicationUrl(publication),
  };
  if (publication.description) jsonLd.description = publication.description;
  return jsonLd;
}

export function generateDocumentMeta(
  document: StandardDocument,
  publication: StandardPublication
): ScribeMetaTag[] {
  const canonicalUrl = buildCanonicalUrl(document, publication);
  // SEO Settings (ADR 0004) replace the title and description in the head
  // only: the JSON-LD headline keeps the Document's own title.
  const title = document.seo?.title ?? document.title;
  const description = document.seo?.description ?? document.description;

  const tags: ScribeMetaTag[] = [
    { title: `${title} — ${publication.name}` },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
    ...standardSiteLinks(publication, document),
    { property: "og:type", content: "article" },
    { property: "og:title", content: title },
    { property: "og:url", content: canonicalUrl },
    { property: "og:site_name", content: publication.name },
    { name: "twitter:title", content: title },
    {
      name: "twitter:card",
      content: document.coverImageUrl ? "summary_large_image" : "summary",
    },
  ];

  if (description) {
    tags.push({ name: "description", content: description });
    tags.push({ property: "og:description", content: description });
    tags.push({ name: "twitter:description", content: description });
  }

  if (document.seo?.noindex) {
    tags.push({ name: "robots", content: "noindex" });
  }

  if (document.coverImageUrl) {
    tags.push({ property: "og:image", content: document.coverImageUrl });
    tags.push({ name: "twitter:image", content: document.coverImageUrl });
  }

  tags.push({ "script:ld+json": generateDocumentJsonLd(document, publication) });

  return tags;
}

export function generatePublicationMeta(publication: StandardPublication): ScribeMetaTag[] {
  const url = buildPublicationUrl(publication);
  const tags: ScribeMetaTag[] = [
    { title: publication.name },
    { tagName: "link", rel: "canonical", href: url },
    ...standardSiteLinks(publication),
    { property: "og:type", content: "website" },
    { property: "og:title", content: publication.name },
    { property: "og:url", content: url },
    { property: "og:site_name", content: publication.name },
    { name: "twitter:title", content: publication.name },
    {
      name: "twitter:card",
      content: publication.splashImageUrl ? "summary_large_image" : "summary",
    },
  ];

  if (publication.description) {
    tags.push({ name: "description", content: publication.description });
    tags.push({ property: "og:description", content: publication.description });
    tags.push({ name: "twitter:description", content: publication.description });
  }

  if (publication.splashImageUrl) {
    tags.push({ property: "og:image", content: publication.splashImageUrl });
    tags.push({ name: "twitter:image", content: publication.splashImageUrl });
  }

  tags.push({ "script:ld+json": generatePublicationJsonLd(publication) });

  return tags;
}

// ── Deprecated names (ADR 0005): removed in the next major ──────────────

/** @deprecated Use `buildPublicationUrl`. */
export const buildSiteUrl = buildPublicationUrl;
/** @deprecated Use `generateDocumentJsonLd`. */
export const generateArticleJsonLd = generateDocumentJsonLd;
/** @deprecated Use `generatePublicationJsonLd`. */
export const generateSiteJsonLd = generatePublicationJsonLd;
/** @deprecated Use `generateDocumentMeta`. */
export const generateArticleMeta = generateDocumentMeta;
/** @deprecated Use `generatePublicationMeta`. */
export const generateSiteMeta = generatePublicationMeta;
