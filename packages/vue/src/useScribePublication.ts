import { ref, onUnmounted } from "vue";
import type { Ref } from "vue";
import { fetchPublication } from "@skyscribe-sdk/core";
import type { StandardPublication } from "@skyscribe-sdk/core";

export interface UseScribePublicationResult {
  publication: Ref<StandardPublication | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
}

export function useScribePublication(
  author: string,
  publicationUrl: string
): UseScribePublicationResult {
  const publication = ref<StandardPublication | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const controller = new AbortController();

  fetchPublication(author, publicationUrl, controller.signal)
    .then((data) => {
      publication.value = data;
      loading.value = false;
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      error.value = err instanceof Error ? err : new Error(String(err));
      loading.value = false;
    });

  onUnmounted(() => controller.abort());

  return { publication, loading, error };
}
