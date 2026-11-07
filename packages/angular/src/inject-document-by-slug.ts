import type { Signal } from "@angular/core";
import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";
import { injectFetch } from "./inject-fetch.js";

export interface InjectDocumentBySlugResult {
  /** The Document; it carries its own `uri`. */
  document: Signal<StandardDocument | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

// Looks the Document up by its human-readable slug (as in its URL) in the
// Publication at `publicationUrl`. injectDocument takes the record key instead.
export function injectDocumentBySlug(
  author: string,
  publicationUrl: string,
  documentSlug: string
): InjectDocumentBySlugResult {
  const { value, loading, error } = injectFetch((signal) =>
    fetchDocumentBySlug(author, publicationUrl, documentSlug, signal)
  );
  return { document: value, loading, error };
}
