import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchDocumentBySlug: vi.fn(),
}));

vi.mock("#app", () => ({
  useAsyncData: vi.fn(),
}));

import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
import { useAsyncData } from "#app";
import { useScribeDocumentBySlug } from "./useScribeDocumentBySlug.js";

const mockFetch = vi.mocked(fetchDocumentBySlug);
const mockUseAsyncData = vi.mocked(useAsyncData);

beforeEach(() => {
  vi.resetAllMocks();
  mockUseAsyncData.mockReturnValue({ data: null, pending: false, error: null } as any);
});

describe("useScribeDocumentBySlug", () => {
  it("keys useAsyncData by author, site URL and slug", () => {
    useScribeDocumentBySlug("alice.bsky.social", "https://example.com", "hello");
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      "scribe:document-by-slug:alice.bsky.social:https://example.com:hello",
      expect.any(Function),
      undefined
    );
  });

  it("handler looks the article up by slug", async () => {
    const result = { uri: "at://did:plc:x/site.standard.document/3mp47vvkh342n" } as never;
    mockFetch.mockResolvedValueOnce(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUseAsyncData as any).mockImplementation((_key: any, handler: any) => {
      handler();
      return {};
    });
    useScribeDocumentBySlug("alice.bsky.social", "https://example.com", "hello");
    expect(mockFetch).toHaveBeenCalledWith("alice.bsky.social", "https://example.com", "hello");
  });

  it("passes options through to useAsyncData", () => {
    const options = { lazy: true };
    useScribeDocumentBySlug("alice.bsky.social", "https://example.com", "hello", options);
    expect(mockUseAsyncData).toHaveBeenCalledWith(expect.any(String), expect.any(Function), options);
  });
});
