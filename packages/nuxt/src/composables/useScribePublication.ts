import { useAsyncData } from "#app";
import type { AsyncDataOptions } from "#app";
import { fetchPublication } from "@skyscribe-sdk/core";
import type { StandardPublication } from "@skyscribe-sdk/core";

export function useScribePublication(
  author: string,
  publicationUrl: string,
  options?: AsyncDataOptions<StandardPublication>
) {
  return useAsyncData<StandardPublication>(
    `scribe:publication:${author}:${publicationUrl}`,
    () => fetchPublication(author, publicationUrl),
    options
  );
}
