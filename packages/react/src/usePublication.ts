import { useState, useEffect } from "react";
import { fetchPublication } from "@skyscribe-sdk/core";
import type { StandardPublication } from "@skyscribe-sdk/core";

export interface UsePublicationResult {
  publication: StandardPublication | null;
  loading: boolean;
  error: Error | null;
}

export function usePublication(author: string, publicationUrl: string): UsePublicationResult {
  const [publication, setPublication] = useState<StandardPublication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setPublication(null);
    setError(null);

    fetchPublication(author, publicationUrl, controller.signal)
      .then((data) => {
        setPublication(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => controller.abort();
  }, [author, publicationUrl]);

  return { publication, loading, error };
}
