// A Document's SEO Settings (skyscribe-app ADR 0099, this repo's ADR 0004):
// `scribe.seo` on the site.standard.document record. Read defensively: the
// record is public data any app can write, so a value that isn't the right
// type or is over the limit is ignored, never truncated.

export const SEO_TITLE_MAX = 200;
export const SEO_DESCRIPTION_MAX = 500;

export interface DocumentSeo {
  /** Replaces the Document's title in <title>, og:title and twitter:title. */
  title?: string;
  /** Replaces the Document's description in the meta, OG and Twitter
   * descriptions. The visible subtitle is unchanged. */
  description?: string;
  /** Ask search engines to leave the Document out. It stays on the site
   * and in RSS. */
  noindex?: true;
}

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return undefined;
  return trimmed;
}

/** The valid parts of a record's `scribe.seo`, or undefined when none are. */
export function readDocumentSeo(raw: unknown): DocumentSeo | undefined {
  if (raw === null || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const seo: DocumentSeo = {};
  const title = text(r.title, SEO_TITLE_MAX);
  const description = text(r.description, SEO_DESCRIPTION_MAX);
  if (title) seo.title = title;
  if (description) seo.description = description;
  if (r.noindex === true) seo.noindex = true;
  return Object.keys(seo).length ? seo : undefined;
}
