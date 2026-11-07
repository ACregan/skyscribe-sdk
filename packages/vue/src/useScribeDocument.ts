import { ref, onUnmounted } from "vue";
import type { Ref } from "vue";
import { fetchDocument } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";

export interface UseScribeDocumentResult {
  document: Ref<StandardDocument | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

// Fetches by record key (rkey): current Documents have opaque TID rkeys, so
// a human-readable slug only matches very old records. Use
// useScribeDocumentBySlug when you have the slug from a URL.
export function useScribeDocument(
  author: string,
  rkey: string
): UseScribeDocumentResult {
  const document = ref<StandardDocument | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const controller = new AbortController();

  fetchDocument(author, rkey, controller.signal)
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
