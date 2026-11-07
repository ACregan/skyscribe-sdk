import type { Signal } from "@angular/core";
import { fetchDocument } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";
import { injectFetch } from "./inject-fetch.js";

export interface InjectDocumentResult {
  document: Signal<StandardDocument | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

// Fetches by record key (rkey). Use injectDocumentBySlug when you have the
// human-readable slug from a URL.
export function injectDocument(author: string, rkey: string): InjectDocumentResult {
  const { value, loading, error } = injectFetch((signal) => fetchDocument(author, rkey, signal));
  return { document: value, loading, error };
}
