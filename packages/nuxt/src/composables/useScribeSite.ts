import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchPublication } from "@skyscribe-sdk/core";
import type { StandardPublication } from "@skyscribe-sdk/core";

// Deprecated (ADR 0005): removed in the next major. Stays in composables/
// so its auto-import keeps working.

/** @deprecated Use `useScribePublication`. */
export function useScribeSite(
  author: string,
  publicationUrl: string,
  options?: AsyncDataOptions<StandardPublication>
) {
  return useAsyncData<StandardPublication>(
    `scribe:site:${author}:${publicationUrl}`,
    () => fetchPublication(author, publicationUrl),
    options
  );
}
