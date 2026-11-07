import type { DocumentSeo } from "./seo.js";

// Names follow the site.standard spec where it has one (Publication,
// Document) and SkyScribe's term where it doesn't (Category): ADR 0005.

export interface DocumentContributor {
  did: string;
  role?: string;
  displayName?: string;
}

/** A snapshot of a Document cached inside its Publication's record, enough
 * to list Documents without fetching each one. */
export interface DocumentRef {
  uri: string;
  title: string;
  slug?: string;
  coverImageUrl: string | null;
  description?: string | null;
  tags?: string[];
  contributors?: DocumentContributor[];
  createdAt: string;
  publishedAt?: string;
  updatedAt?: string;
  /** The Document's canonical URL is another website's: it was imported
   * into SkyScribe and its author chose to keep the original as canonical.
   * Sitemaps leave it out (getSitemapEntries does). Absent means this
   * Publication's own URL is canonical. */
  canonicalElsewhere?: true;
  /** The Document's SEO Settings ask search engines to leave it out
   * (skyscribe-app ADR 0099). Sitemaps leave it out (getSitemapEntries
   * does); it still appears on the website and in RSS. */
  noindex?: true;
}

/** A named, ordered set of Documents within a Publication. A SkyScribe
 * extension: site.standard has no equivalent. */
export interface Category {
  slug: string;
  title: string;
  documents: DocumentRef[];
}

/** A `site.standard.publication` record, as the SDK returns it. */
export interface StandardPublication {
  /** The record's AT URI. */
  uri: string;
  /** The spec's `name`. */
  name: string;
  /** The bare domain its website lives on, e.g. "norobots.blog": no
   * protocol, no path. buildPublicationUrl() gives the full URL. */
  domain: string;
  /** The path its Documents live under, e.g. "blog"; "" when none. */
  basePath: string;
  description?: string;
  splashImageUrl?: string;
  logoImageUrl?: string;
  categories: Category[];
}

/** A `site.standard.document` record, as the SDK returns it. */
export interface StandardDocument {
  /** The record's AT URI. */
  uri: string;
  title: string;
  content: string;
  path: string;
  /** The spec's `site`: the owning Publication's AT URI once published. */
  site: string;
  canonicalUrl?: string;
  textContent?: string;
  coverImageUrl?: string;
  description?: string;
  tags?: string[];
  contributors?: DocumentContributor[];
  bskyPostRef?: { uri: string; cid: string };
  /** SEO Settings from the record's `scribe.seo`: only the valid parts,
   * absent when it has none. generateDocumentMeta applies them. */
  seo?: DocumentSeo;
  createdAt?: string;
  publishedAt: string;
  updatedAt: string;
}

// ── Deprecated names (ADR 0005): removed in the next major ──────────────

/** @deprecated Use `StandardPublication`. */
export type Site = StandardPublication;
/** @deprecated Use `Category`. */
export type SiteGroup = Category;
/** @deprecated Use `DocumentRef`. */
export type ArticleRef = DocumentRef;
/** @deprecated Use `StandardDocument`. */
export type Article = StandardDocument;
/** @deprecated Use `DocumentContributor`. */
export type ArticleContributor = DocumentContributor;
/** @deprecated `fetchDocumentBySlug` returns the `StandardDocument`, which
 * carries its own `uri`. Only the deprecated `fetchArticleBySlug` returns this. */
export interface ArticleResult {
  article: StandardDocument;
  uri: string;
}
