import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDocument } from "./useDocument.js";
import { useArticle } from "./deprecated.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchDocument: vi.fn(),
}));

import { fetchDocument } from "@skyscribe-sdk/core";
const mockFetchDocument = vi.mocked(fetchDocument);

const document = {
  uri: "at://did:plc:test/site.standard.document/hello-world",
  title: "Hello World",
  content: "<p>Hi</p>",
  path: "/hello-world",
  site: "https://example.com",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

beforeEach(() => mockFetchDocument.mockReset());

describe("useDocument", () => {
  it("starts in loading state", async () => {
    const { promise, resolve } = Promise.withResolvers<typeof document>();
    mockFetchDocument.mockReturnValueOnce(promise);
    const { result } = renderHook(() =>
      useDocument("did:plc:test", "hello-world")
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.document).toBeNull();
    expect(result.current.error).toBeNull();
    resolve(document);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets document data on success", async () => {
    mockFetchDocument.mockResolvedValueOnce(document);
    const { result } = renderHook(() =>
      useDocument("did:plc:test", "hello-world")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.document).toEqual(document);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure", async () => {
    mockFetchDocument.mockRejectedValueOnce(new Error("Not found"));
    const { result } = renderHook(() =>
      useDocument("did:plc:test", "missing-article")
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Not found");
    expect(result.current.document).toBeNull();
  });

  it("re-fetches when params change", async () => {
    mockFetchDocument.mockResolvedValue(document);
    const { result, rerender } = renderHook(
      ({ author, slug }: { author: string; slug: string }) =>
        useDocument(author, slug),
      { initialProps: { author: "did:plc:test", slug: "post-one" } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ author: "did:plc:test", slug: "post-two" });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchDocument).toHaveBeenCalledTimes(2);
  });

  it("aborts on unmount", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<typeof document>();
    mockFetchDocument.mockReturnValueOnce(promise);
    const { unmount } = renderHook(() =>
      useDocument("did:plc:test", "hello-world")
    );
    unmount();
    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});

describe("useArticle (deprecated)", () => {
  it("keeps the old { article } result key", async () => {
    mockFetchDocument.mockResolvedValueOnce(document);
    const { result } = renderHook(() => useArticle("did:plc:test", "hello-world"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.article).toEqual(document);
  });
});
