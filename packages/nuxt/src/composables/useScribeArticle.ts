import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchDocument } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";

// Deprecated (ADR 0005): removed in the next major. Stays in composables/
// so its auto-import keeps working.

/** @deprecated Use `useScribeDocument`. */
export function useScribeArticle(
  author: string,
  rkey: string,
  options?: AsyncDataOptions<StandardDocument>
) {
  return useAsyncData<StandardDocument>(
    `scribe:article:${author}:${rkey}`,
    () => fetchDocument(author, rkey),
    options
  );
}
