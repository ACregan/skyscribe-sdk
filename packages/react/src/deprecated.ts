// Deprecated names (ADR 0005): removed in the next major. Each keeps its
// old result keys, so upgrading the package alone breaks nothing.
import type { StandardDocument, StandardPublication } from "@skyscribe-sdk/core";
import { usePublication } from "./usePublication.js";
import { useDocument } from "./useDocument.js";
import { useDocumentBySlug } from "./useDocumentBySlug.js";

/** @deprecated Use `usePublication`, which returns `{ publication }`. */
export function useSite(
  author: string,
  publicationUrl: string
): { site: StandardPublication | null; loading: boolean; error: Error | null } {
  const { publication, loading, error } = usePublication(author, publicationUrl);
  return { site: publication, loading, error };
}

/** @deprecated Use `useDocument`, which returns `{ document }`. */
export function useArticle(
  author: string,
  rkey: string
): { article: StandardDocument | null; loading: boolean; error: Error | null } {
  const { document, loading, error } = useDocument(author, rkey);
  return { article: document, loading, error };
}

/** @deprecated Use `UseDocumentBySlugResult`. */
export interface UseArticleBySlugResult {
  article: StandardDocument | null;
  /** The article's AT URI, for @skyscribe-sdk/social's buttons. */
  uri: string | null;
  loading: boolean;
  error: Error | null;
}

/** @deprecated Use `useDocumentBySlug`, which returns `{ document }` (the
 * Document carries its own `uri`). */
export function useArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string
): UseArticleBySlugResult {
  const { document, loading, error } = useDocumentBySlug(author, publicationUrl, articleSlug);
  return { article: document, uri: document?.uri ?? null, loading, error };
}
