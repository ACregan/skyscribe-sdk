import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePublication } from "./usePublication.js";
import { useSite } from "./deprecated.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchPublication: vi.fn(),
}));

import { fetchPublication } from "@skyscribe-sdk/core";
const mockFetchPublication = vi.mocked(fetchPublication);

const publication = {
  uri: "at://did:plc:test/site.standard.publication/testpubkey",
  name: "Test Site",
  domain: "example.com",
  basePath: "blog",
  categories: [],
};

beforeEach(() => mockFetchPublication.mockReset());

describe("usePublication", () => {
  it("starts in loading state", async () => {
    const { promise, resolve } = Promise.withResolvers<typeof publication>();
    mockFetchPublication.mockReturnValueOnce(promise);
    const { result } = renderHook(() => usePublication("did:plc:test", "example-com"));
    expect(result.current.loading).toBe(true);
    expect(result.current.publication).toBeNull();
    expect(result.current.error).toBeNull();
    resolve(publication);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets publication data on success", async () => {
    mockFetchPublication.mockResolvedValueOnce(publication);
    const { result } = renderHook(() => usePublication("did:plc:test", "example-com"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.publication).toEqual(publication);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure", async () => {
    mockFetchPublication.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => usePublication("did:plc:test", "example-com"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("Network error");
    expect(result.current.publication).toBeNull();
  });

  it("re-fetches when params change", async () => {
    mockFetchPublication.mockResolvedValue(publication);
    const { result, rerender } = renderHook(
      ({ author, slug }: { author: string; slug: string }) =>
        usePublication(author, slug),
      { initialProps: { author: "did:plc:test", slug: "site-one" } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ author: "did:plc:test", slug: "site-two" });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchPublication).toHaveBeenCalledTimes(2);
  });

  it("aborts on unmount", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<typeof publication>();
    mockFetchPublication.mockReturnValueOnce(promise);
    const { unmount } = renderHook(() => usePublication("did:plc:test", "example-com"));
    unmount();
    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});

describe("useSite (deprecated)", () => {
  it("keeps the old { site } result key", async () => {
    mockFetchPublication.mockResolvedValueOnce(publication);
    const { result } = renderHook(() => useSite("did:plc:test", "example-com"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.site).toEqual(publication);
  });
});
