// Deprecated names (ADR 0005): removed in the next major. Each keeps its
// old result keys, so upgrading the package alone breaks nothing.
import { computed } from "vue";
import type { Ref } from "vue";
import type { StandardDocument, StandardPublication } from "@skyscribe-sdk/core";
import { useScribePublication } from "./useScribePublication.js";
import { useScribeDocument } from "./useScribeDocument.js";
import { useScribeDocumentBySlug } from "./useScribeDocumentBySlug.js";

/** @deprecated Use `UseScribePublicationResult`. */
export interface UseScribeSiteResult {
  site: Ref<StandardPublication | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

/** @deprecated Use `useScribePublication`, which returns `{ publication }`. */
export function useScribeSite(author: string, publicationUrl: string): UseScribeSiteResult {
  const { publication, loading, error } = useScribePublication(author, publicationUrl);
  return { site: publication, loading, error };
}

/** @deprecated Use `UseScribeDocumentResult`. */
export interface UseScribeArticleResult {
  article: Ref<StandardDocument | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

/** @deprecated Use `useScribeDocument`, which returns `{ document }`. */
export function useScribeArticle(author: string, rkey: string): UseScribeArticleResult {
  const { document, loading, error } = useScribeDocument(author, rkey);
  return { article: document, loading, error };
}

/** @deprecated Use `UseScribeDocumentBySlugResult`. */
export interface UseScribeArticleBySlugResult {
  article: Ref<StandardDocument | null>;
  /** The article's AT URI. */
  uri: Readonly<Ref<string | null>>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

/** @deprecated Use `useScribeDocumentBySlug`, which returns `{ document }`
 * (the Document carries its own `uri`). */
export function useScribeArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string
): UseScribeArticleBySlugResult {
  const { document, loading, error } = useScribeDocumentBySlug(author, publicationUrl, articleSlug);
  return { article: document, uri: computed(() => document.value?.uri ?? null), loading, error };
}
