import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDocumentBySlug } from "./useDocumentBySlug.js";
import { useArticleBySlug } from "./deprecated.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchDocumentBySlug: vi.fn(),
}));

import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
const mockFetch = vi.mocked(fetchDocumentBySlug);

const document = {
  uri: "at://did:plc:test/site.standard.document/3mp47vvkh342n",
  title: "Hello World",
  content: "<p>Hi</p>",
  path: "/blog/essays/hello-world",
  site: "at://did:plc:test/site.standard.publication/3mp4nd46xwr2h",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
const uri = document.uri;

beforeEach(() => mockFetch.mockReset());

describe("useDocumentBySlug", () => {
  it("looks the article up by slug and returns it with its AT URI", async () => {
    mockFetch.mockResolvedValueOnce(document);
    const { result } = renderHook(() =>
      useDocumentBySlug("did:plc:test", "https://example.com", "hello-world")
    );
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.document).toEqual(document);
    expect(result.current.document?.uri).toBe(uri);
    expect(mockFetch).toHaveBeenCalledWith(
      "did:plc:test",
      "https://example.com",
      "hello-world",
      expect.any(AbortSignal)
    );
  });

  it("sets error on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Document not found: missing"));
    const { result } = renderHook(() =>
      useDocumentBySlug("did:plc:test", "https://example.com", "missing")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Document not found: missing");
    expect(result.current.document).toBeNull();
  });

  it("re-fetches and aborts the previous request when the slug changes", async () => {
    mockFetch.mockResolvedValue(document);
    const { result, rerender } = renderHook(
      ({ slug }: { slug: string }) =>
        useDocumentBySlug("did:plc:test", "https://example.com", slug),
      { initialProps: { slug: "post-one" } }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstSignal = mockFetch.mock.calls[0][3] as AbortSignal;

    rerender({ slug: "post-two" });
    expect(firstSignal.aborted).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenLastCalledWith(
      "did:plc:test",
      "https://example.com",
      "post-two",
      expect.any(AbortSignal)
    );
  });

  it("ignores AbortError", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    mockFetch.mockRejectedValueOnce(abortError);
    const { result } = renderHook(() =>
      useDocumentBySlug("did:plc:test", "https://example.com", "x")
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.error).toBeNull();
  });
});

describe("useArticleBySlug (deprecated)", () => {
  it("keeps the old { article, uri } result keys", async () => {
    mockFetch.mockResolvedValueOnce(document);
    const { result } = renderHook(() =>
      useArticleBySlug("did:plc:test", "https://example.com", "hello-world")
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.article).toEqual(document);
    expect(result.current.uri).toBe(uri);
  });
});
