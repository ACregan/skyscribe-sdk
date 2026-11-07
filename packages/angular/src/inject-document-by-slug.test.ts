import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { DestroyRef } from "@angular/core";
import { injectDocumentBySlug } from "./inject-document-by-slug.js";
import { injectArticleBySlug } from "./deprecated.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchDocumentBySlug: vi.fn(),
}));

import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
const mockFetch = vi.mocked(fetchDocumentBySlug);

const article = {
  uri: "at://did:plc:test/site.standard.document/3mp47vvkh342n",
  title: "Test Article",
  content: "<p>Hello</p>",
  path: "/blog/essays/test-article",
  site: "at://did:plc:test/site.standard.publication/3mp4nd46xwr2h",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
const uri = article.uri;

beforeEach(() => mockFetch.mockReset());
afterEach(() => TestBed.resetTestingModule());

describe("injectDocumentBySlug", () => {
  it("starts in loading state", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    const result = TestBed.runInInjectionContext(() =>
      injectDocumentBySlug("did:plc:test", "https://example.com", "test-article")
    );
    expect(result.loading()).toBe(true);
    expect(result.document()).toBeNull();
  });

  it("sets the article and its AT URI on success", async () => {
    mockFetch.mockResolvedValueOnce(article);
    const result = TestBed.runInInjectionContext(() =>
      injectDocumentBySlug("did:plc:test", "https://example.com", "test-article")
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.loading()).toBe(false);
    expect(result.document()).toEqual(article);
    expect(result.document()?.uri).toBe(uri);
    expect(mockFetch).toHaveBeenCalledWith(
      "did:plc:test",
      "https://example.com",
      "test-article",
      expect.any(AbortSignal)
    );
  });

  it("sets error on failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Article not found: x"));
    const result = TestBed.runInInjectionContext(() =>
      injectDocumentBySlug("did:plc:test", "https://example.com", "x")
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.loading()).toBe(false);
    expect(result.error()?.message).toBe("Article not found: x");
  });

  it("aborts when the injection context is destroyed", () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    TestBed.runInInjectionContext(() => {
      injectDocumentBySlug("did:plc:test", "https://example.com", "x");
      return TestBed.inject(DestroyRef);
    });
    const signal = mockFetch.mock.calls[0][3] as AbortSignal;
    TestBed.resetTestingModule();
    expect(signal.aborted).toBe(true);
  });
});

describe("injectArticleBySlug (deprecated)", () => {
  it("keeps the old { article, uri } result keys", async () => {
    mockFetch.mockResolvedValueOnce(article);
    const result = TestBed.runInInjectionContext(() =>
      injectArticleBySlug("did:plc:test", "https://example.com", "test-article")
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.article()).toEqual(article);
    expect(result.uri()).toBe(uri);
  });
});
