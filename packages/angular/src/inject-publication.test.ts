import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { injectPublication } from "./inject-publication.js";
import { injectSite } from "./deprecated.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchPublication: vi.fn(),
}));

import { fetchPublication } from "@skyscribe-sdk/core";
const mockFetchSite = vi.mocked(fetchPublication);

const site = {
  uri: "at://did:plc:test/site.standard.publication/testpubkey",
  name: "Test Site",
  domain: "example.com",
  basePath: "blog",
  categories: [],
};

beforeEach(() => mockFetchSite.mockReset());
afterEach(() => TestBed.resetTestingModule());

describe("injectPublication", () => {
  it("starts in loading state", () => {
    const { promise } = Promise.withResolvers<typeof site>();
    mockFetchSite.mockReturnValueOnce(promise);

    const result = TestBed.runInInjectionContext(() =>
      injectPublication("did:plc:test", "example-com")
    );

    expect(result.loading()).toBe(true);
    expect(result.publication()).toBeNull();
    expect(result.error()).toBeNull();
  });

  it("sets site data on success", async () => {
    mockFetchSite.mockResolvedValueOnce(site);

    const result = TestBed.runInInjectionContext(() =>
      injectPublication("did:plc:test", "example-com")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.publication()).toEqual(site);
    expect(result.error()).toBeNull();
  });

  it("sets error on failure", async () => {
    mockFetchSite.mockRejectedValueOnce(new Error("Network error"));

    const result = TestBed.runInInjectionContext(() =>
      injectPublication("did:plc:test", "example-com")
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.loading()).toBe(false);
    expect(result.error()?.message).toBe("Network error");
    expect(result.publication()).toBeNull();
  });

  it("aborts on destroy", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { promise, reject } = Promise.withResolvers<typeof site>();
    mockFetchSite.mockReturnValueOnce(promise);

    TestBed.runInInjectionContext(() =>
      injectPublication("did:plc:test", "example-com")
    );
    TestBed.resetTestingModule();

    expect(abortSpy).toHaveBeenCalled();
    reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    abortSpy.mockRestore();
  });
});

describe("injectSite (deprecated)", () => {
  it("keeps the old { site } result key", async () => {
    mockFetchSite.mockResolvedValueOnce(site);
    const result = TestBed.runInInjectionContext(() => injectSite("did:plc:test", "example-com"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.site()).toEqual(site);
  });
});
