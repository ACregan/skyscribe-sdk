import type { Signal } from "@angular/core";
import { fetchPublication } from "@skyscribe-sdk/core";
import type { StandardPublication } from "@skyscribe-sdk/core";
import { injectFetch } from "./inject-fetch.js";

export interface InjectPublicationResult {
  publication: Signal<StandardPublication | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

export function injectPublication(author: string, publicationUrl: string): InjectPublicationResult {
  const { value, loading, error } = injectFetch((signal) =>
    fetchPublication(author, publicationUrl, signal)
  );
  return { publication: value, loading, error };
}
