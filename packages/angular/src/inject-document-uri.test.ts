import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { injectDocumentUri } from "./inject-document-uri.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchDocumentBySlug: vi.fn(),
}));

import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
const mockFetchArticleBySlug = vi.mocked(fetchDocumentBySlug);

const DOCUMENT_URI = "at://did:plc:test/site.standard.document/3jxtctq7kqm2y";

beforeEach(() => mockFetchArticleBySlug.mockReset());
afterEach(() => TestBed.resetTestingModule());

describe("injectDocumentUri", () => {
  it("starts in loading state", () => {
    const { promise } = Promise.withResolvers<never>();
    mockFetchArticleBySlug.mockReturnValueOnce(promise);

    const result = TestBed.runInInjectionContext(() =>
      injectDocumentUri("did:plc:test", "example-com", "hello")
    );

    expect(result.loading()).toBe(true);
    expect(result.uri()).toBeNull();
    expect(result.error()).toBeNull();
  });

  it("sets uri on success", async () => {
    mockFetchArticleBySlug.mockResolvedValueOnce({ uri: DOCUMENT_URI } as never);

    const result = TestBed.runInInjectionContext(() =>
      injectDocumentUri("did:plc:test", "example-com", "hello")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.uri()).toBe(DOCUMENT_URI);
    expect(result.error()).toBeNull();
  });

  it("sets error on failure", async () => {
    mockFetchArticleBySlug.mockRejectedValueOnce(new Error("Network error"));

    const result = TestBed.runInInjectionContext(() =>
      injectDocumentUri("did:plc:test", "example-com", "hello")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.error()?.message).toBe("Network error");
    expect(result.uri()).toBeNull();
  });

  it("aborts on destroy", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<never>();
    mockFetchArticleBySlug.mockReturnValueOnce(promise);

    TestBed.runInInjectionContext(() =>
      injectDocumentUri("did:plc:test", "example-com", "hello")
    );
    TestBed.resetTestingModule();

    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});
