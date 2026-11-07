import { useState, useEffect } from "react";
import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";

export interface UseDocumentBySlugResult {
  /** The Document; its `uri` is what @skyscribe-sdk/social's buttons take. */
  document: StandardDocument | null;
  loading: boolean;
  error: Error | null;
}

// Looks the Document up by its human-readable slug (as in its URL) in the
// Publication at `publicationUrl`. useDocument takes the record key instead.
export function useDocumentBySlug(
  author: string,
  publicationUrl: string,
  documentSlug: string
): UseDocumentBySlugResult {
  const [document, setDocument] = useState<StandardDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setDocument(null);
    setError(null);

    fetchDocumentBySlug(author, publicationUrl, documentSlug, controller.signal)
      .then((data) => {
        setDocument(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => controller.abort();
  }, [author, publicationUrl, documentSlug]);

  return { document, loading, error };
}
