import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchDocument: vi.fn(),
}));

vi.mock("#app", () => ({
  useAsyncData: vi.fn(),
}));

import { fetchDocument } from "@skyscribe-sdk/core";
import { useAsyncData } from "#app";
import { useScribeArticle } from "./useScribeArticle.js";

const mockFetchArticle = vi.mocked(fetchDocument);
const mockUseAsyncData = vi.mocked(useAsyncData);

beforeEach(() => {
  vi.resetAllMocks();
  mockUseAsyncData.mockReturnValue({ data: null, pending: false, error: null } as any);
});

describe("useScribeArticle (deprecated)", () => {
  it("generates the correct useAsyncData key", () => {
    useScribeArticle("alice.bsky.social", "hello");
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      "scribe:article:alice.bsky.social:hello",
      expect.any(Function),
      undefined
    );
  });

  it("handler calls fetchDocument with correct args", async () => {
    mockFetchArticle.mockResolvedValueOnce({ uri: "at://did:plc:x/site.standard.document/hello", title: "Hello", content: "", path: "/hello", site: "https://example.com", publishedAt: "2024-01-01T00:00:00Z", createdAt: "", updatedAt: "" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUseAsyncData as any).mockImplementation((_key: any, handler: any) => {
      handler();
      return {};
    });
    useScribeArticle("alice.bsky.social", "hello");
    expect(mockFetchArticle).toHaveBeenCalledWith("alice.bsky.social", "hello");
  });

  it("passes options through to useAsyncData", () => {
    useScribeArticle("alice.bsky.social", "hello", { lazy: true });
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { lazy: true }
    );
  });

  it("returns the result of useAsyncData", () => {
    const mockReturn = { data: { title: "Hello" }, pending: false, error: null } as unknown as any;
    mockUseAsyncData.mockReturnValueOnce(mockReturn);
    const result = useScribeArticle("alice.bsky.social", "hello");
    expect(result).toBe(mockReturn);
  });
});
