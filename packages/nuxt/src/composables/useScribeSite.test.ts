import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchPublication: vi.fn(),
}));

vi.mock("#app", () => ({
  useAsyncData: vi.fn(),
}));

import { fetchPublication } from "@skyscribe-sdk/core";
import { useAsyncData } from "#app";
import { useScribeSite } from "./useScribeSite.js";

const mockFetchSite = vi.mocked(fetchPublication);
const mockUseAsyncData = vi.mocked(useAsyncData);

beforeEach(() => {
  vi.resetAllMocks();
  mockUseAsyncData.mockReturnValue({ data: null, pending: false, error: null } as any);
});

describe("useScribeSite (deprecated)", () => {
  it("generates the correct useAsyncData key", () => {
    useScribeSite("alice.bsky.social", "alice-bsky-social");
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      "scribe:site:alice.bsky.social:alice-bsky-social",
      expect.any(Function),
      undefined
    );
  });

  it("handler calls fetchPublication with correct args", async () => {
    const mockSite = { uri: "at://did:plc:test/site.standard.publication/testpubkey", name: "Test", domain: "test.com", basePath: "", categories: [] };
    mockFetchSite.mockResolvedValueOnce(mockSite);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUseAsyncData as any).mockImplementation((_key: any, handler: any) => {
      handler();
      return {};
    });
    useScribeSite("alice.bsky.social", "alice-bsky-social");
    expect(mockFetchSite).toHaveBeenCalledWith("alice.bsky.social", "alice-bsky-social");
  });

  it("passes options through to useAsyncData", () => {
    useScribeSite("alice.bsky.social", "alice-bsky-social", { lazy: true });
    expect(mockUseAsyncData).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      { lazy: true }
    );
  });

  it("returns the result of useAsyncData", () => {
    const mockReturn = { data: { title: "Test" }, pending: false, error: null } as unknown as any;
    mockUseAsyncData.mockReturnValueOnce(mockReturn);
    const result = useScribeSite("alice.bsky.social", "alice-bsky-social");
    expect(result).toBe(mockReturn);
  });
});
