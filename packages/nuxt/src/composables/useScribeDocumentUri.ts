import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchDocumentBySlug } from "@skyscribe-sdk/core";

export function useScribeDocumentUri(
  author: string,
  publicationUrl: string,
  documentSlug: string,
  options?: AsyncDataOptions<string>
) {
  return useAsyncData<string>(
    `scribe:document-uri:${author}:${publicationUrl}:${documentSlug}`,
    () => fetchDocumentBySlug(author, publicationUrl, documentSlug).then(({ uri }) => uri),
    options
  );
}
