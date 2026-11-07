import { inject, DestroyRef, signal } from "@angular/core";
import type { Signal } from "@angular/core";
import { fetchDocumentBySlug } from "@skyscribe-sdk/core";

interface InjectDocumentUriResult {
  uri: Signal<string | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

export function injectDocumentUri(
  author: string,
  publicationUrl: string,
  documentSlug: string
): InjectDocumentUriResult {
  const uri = signal<string | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  const destroyRef = inject(DestroyRef);
  const controller = new AbortController();

  fetchDocumentBySlug(author, publicationUrl, documentSlug, controller.signal)
    .then(({ uri: documentUri }) => {
      uri.set(documentUri);
      loading.set(false);
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.set(err instanceof Error ? err : new Error(String(err)));
      loading.set(false);
    });

  destroyRef.onDestroy(() => controller.abort());

  return {
    uri: uri as Signal<string | null>,
    loading: loading as Signal<boolean>,
    error: error as Signal<Error | null>,
  };
}
