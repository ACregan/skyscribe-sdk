import { useState, useEffect } from "react";
import { fetchDocument } from "@skyscribe-sdk/core";
import type { StandardDocument } from "@skyscribe-sdk/core";

export interface UseDocumentResult {
  document: StandardDocument | null;
  loading: boolean;
  error: Error | null;
}

// Fetches by record key (rkey): current Documents have opaque TID rkeys, so
// a human-readable slug only matches very old records. Use useDocumentBySlug
// when you have the slug from a URL.
export function useDocument(author: string, rkey: string): UseDocumentResult {
  const [document, setDocument] = useState<StandardDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setDocument(null);
    setError(null);

    fetchDocument(author, rkey, controller.signal)
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
  }, [author, rkey]);

  return { document, loading, error };
}
