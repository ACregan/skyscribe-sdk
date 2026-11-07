import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchArticleBySlug } from "@skyscribe-sdk/core";
import type { ArticleResult } from "@skyscribe-sdk/core";

// Deprecated (ADR 0005): removed in the next major. Stays in composables/
// so its auto-import keeps working. `data` keeps the old `{ article, uri }`.

/** @deprecated Use `useScribeDocumentBySlug`, whose `data` is the Document
 * itself (it carries its own `uri`). */
export function useScribeArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string,
  options?: AsyncDataOptions<ArticleResult>
) {
  return useAsyncData<ArticleResult>(
    `scribe:article-by-slug:${author}:${publicationUrl}:${articleSlug}`,
    () => fetchArticleBySlug(author, publicationUrl, articleSlug),
    options
  );
}
