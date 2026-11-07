import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";

// Looks the Document up by its human-readable slug (as in its URL) in the
// Publication at `publicationUrl`. `data` holds the Document, which carries
// its own `uri`. useScribeDocument takes the record key instead.
export function useScribeDocumentBySlug(
  author: string,
  publicationUrl: string,
  documentSlug: string,
  options?: AsyncDataOptions<StandardDocument>
) {
  return useAsyncData<StandardDocument>(
    `scribe:document-by-slug:${author}:${publicationUrl}:${documentSlug}`,
    () => fetchDocumentBySlug(author, publicationUrl, documentSlug),
    options
  );
}
