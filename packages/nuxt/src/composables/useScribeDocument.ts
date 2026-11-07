import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchDocument } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";

// Fetches by record key (rkey): current Documents have opaque TID rkeys, so
// a human-readable slug only matches very old records. Use
// useScribeDocumentBySlug when you have the slug from a URL.
export function useScribeDocument(
  author: string,
  rkey: string,
  options?: AsyncDataOptions<StandardDocument>
) {
  return useAsyncData<StandardDocument>(
    `scribe:document:${author}:${rkey}`,
    () => fetchDocument(author, rkey),
    options
  );
}
