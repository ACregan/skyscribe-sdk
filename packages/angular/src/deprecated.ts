// Deprecated names (ADR 0005): removed in the next major. Each keeps its
// old result keys, so upgrading the package alone breaks nothing.
import { computed } from "@angular/core";
import type { Signal } from "@angular/core";
import type { StandardDocument, StandardPublication } from "@skyscribe-sdk/core";
import { injectPublication } from "./inject-publication.js";
import { injectDocument } from "./inject-document.js";
import { injectDocumentBySlug } from "./inject-document-by-slug.js";

/** @deprecated Use `injectPublication`, which returns `{ publication }`. */
export function injectSite(
  author: string,
  publicationUrl: string
): { site: Signal<StandardPublication | null>; loading: Signal<boolean>; error: Signal<Error | null> } {
  const { publication, loading, error } = injectPublication(author, publicationUrl);
  return { site: publication, loading, error };
}

/** @deprecated Use `injectDocument`, which returns `{ document }`. */
export function injectArticle(
  author: string,
  rkey: string
): { article: Signal<StandardDocument | null>; loading: Signal<boolean>; error: Signal<Error | null> } {
  const { document, loading, error } = injectDocument(author, rkey);
  return { article: document, loading, error };
}

/** @deprecated Use `injectDocumentBySlug`, which returns `{ document }` (the
 * Document carries its own `uri`). */
export function injectArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string
): {
  article: Signal<StandardDocument | null>;
  uri: Signal<string | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
} {
  const { document, loading, error } = injectDocumentBySlug(author, publicationUrl, articleSlug);
  return { article: document, uri: computed(() => document()?.uri ?? null), loading, error };
}
