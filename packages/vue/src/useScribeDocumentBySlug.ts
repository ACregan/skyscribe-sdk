import { ref, onUnmounted } from "vue";
import type { Ref } from "vue";
import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";

export interface UseScribeDocumentBySlugResult {
  document: Ref<StandardDocument | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

// Looks the Document up by its human-readable slug (as in its URL) in the
// Publication at publicationUrl. The Document carries its own uri.
// useScribeDocument takes the record key instead.
export function useScribeDocumentBySlug(
  author: string,
  publicationUrl: string,
  documentSlug: string
): UseScribeDocumentBySlugResult {
  const document = ref<StandardDocument | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const controller = new AbortController();

  fetchDocumentBySlug(author, publicationUrl, documentSlug, controller.signal)
    .then((data) => {
      document.value = data;
      loading.value = false;
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.value = err instanceof Error ? err : new Error(String(err));
      loading.value = false;
    });

  onUnmounted(() => controller.abort());

  return { document, loading, error };
}
