import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import {
  createPublicationLoader,
  createDocumentRouteLoader,
  createSiteLoader,
  createArticleRouteLoader,
  createWellKnownLoader,
} from "./loaders.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchPublication: vi.fn(),
  fetchDocumentBySlug: vi.fn(),
  fetchArticleBySlug: vi.fn(),
  resolvePublicationUri: vi.fn(),
}));

import { fetchPublication, fetchDocumentBySlug, fetchArticleBySlug, resolvePublicationUri } from "@skyscribe-sdk/core";
const mockFetchPublication = vi.mocked(fetchPublication);
const mockFetchDocumentBySlug = vi.mocked(fetchDocumentBySlug);
const mockFetchArticleBySlug = vi.mocked(fetchArticleBySlug);
const mockResolvePublicationUri = vi.mocked(resolvePublicationUri);

const makeArgs = (): LoaderFunctionArgs =>
  ({ request: new Request("https://example.com"), params: {}, context: {} }) as unknown as LoaderFunctionArgs;

const site = {
  uri: "at://did:plc:test/site.standard.publication/testpubkey",
  name: "Test Site",
  domain: "example.com",
  basePath: "blog",
  categories: [],
};

const article = {
  uri: "at://did:plc:test/site.standard.document/3jxtctq7kqm2y",
  title: "Hello",
  content: "<p>Hello</p>",
  path: "/essays/hello",
  site: "at://did:plc:test/site.standard.publication/example-com",
  canonicalUrl: "https://example.com/blog/essays/hello",
  publishedAt: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const documentUri = "at://did:plc:test/site.standard.document/3jxtctq7kqm2y";
const document = { ...article, uri: documentUri };

describe("createPublicationLoader", () => {
  it("returns a loader that fetches the Publication", async () => {
    mockFetchPublication.mockResolvedValueOnce(site);
    const loader = createPublicationLoader("did:plc:test", "example-com");
    const result = await loader(makeArgs());
    expect(result).toEqual(site);
    expect(mockFetchPublication).toHaveBeenCalledWith(
      "did:plc:test",
      "example-com",
      expect.any(AbortSignal)
    );
  });

  it("passes the request signal to fetchPublication", async () => {
    mockFetchPublication.mockResolvedValueOnce(site);
    const loader = createPublicationLoader("did:plc:test", "example-com");
    const args = makeArgs();
    await loader(args);
    expect(mockFetchPublication).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      args.request.signal
    );
  });
});

describe("createArticleRouteLoader (deprecated)", () => {
  it("reads the slug from route params and returns article with documentUri", async () => {
    mockFetchArticleBySlug.mockResolvedValueOnce({ article, uri: documentUri });
    const loader = createArticleRouteLoader("did:plc:test", "example-com");
    const args = { ...makeArgs(), params: { articleSlug: "hello" } } as unknown as LoaderFunctionArgs;
    const result = await loader(args);
    expect(result).toEqual({ ...article, documentUri });
    expect(mockFetchArticleBySlug).toHaveBeenCalledWith(
      "did:plc:test",
      "example-com",
      "hello",
      expect.any(AbortSignal)
    );
  });

  it("uses a custom param name when provided", async () => {
    mockFetchArticleBySlug.mockResolvedValueOnce({ article, uri: documentUri });
    const loader = createArticleRouteLoader("did:plc:test", "example-com", "slug");
    const args = { ...makeArgs(), params: { slug: "hello" } } as unknown as LoaderFunctionArgs;
    await loader(args);
    expect(mockFetchArticleBySlug).toHaveBeenCalledWith("did:plc:test", "example-com", "hello", expect.any(AbortSignal));
  });

  it("throws when the slug param is missing", async () => {
    const loader = createArticleRouteLoader("did:plc:test", "example-com");
    await expect(loader(makeArgs())).rejects.toThrow("Missing route param: articleSlug");
  });

  it("passes the request signal to fetchArticleBySlug", async () => {
    mockFetchArticleBySlug.mockResolvedValueOnce({ article, uri: documentUri });
    const loader = createArticleRouteLoader("did:plc:test", "example-com");
    const args = { ...makeArgs(), params: { articleSlug: "hello" } } as unknown as LoaderFunctionArgs;
    await loader(args);
    expect(mockFetchArticleBySlug).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      args.request.signal
    );
  });
});

describe("createDocumentRouteLoader", () => {
  it("reads params.documentSlug and returns the Document", async () => {
    mockFetchDocumentBySlug.mockResolvedValueOnce(document);
    const loader = createDocumentRouteLoader("did:plc:test", "example-com");
    const args = { ...makeArgs(), params: { documentSlug: "hello" } } as unknown as LoaderFunctionArgs;
    const result = await loader(args);
    expect(result).toEqual(document);
    expect(mockFetchDocumentBySlug).toHaveBeenCalledWith("did:plc:test", "example-com", "hello", args.request.signal);
  });

  it("does not read the old articleSlug param", async () => {
    const loader = createDocumentRouteLoader("did:plc:test", "example-com");
    const args = { ...makeArgs(), params: { articleSlug: "hello" } } as unknown as LoaderFunctionArgs;
    await expect(loader(args)).rejects.toThrow("Missing route param: documentSlug");
  });

  it("uses a custom param name when provided", async () => {
    mockFetchDocumentBySlug.mockResolvedValueOnce(document);
    const loader = createDocumentRouteLoader("did:plc:test", "example-com", "slug");
    const args = { ...makeArgs(), params: { slug: "hello" } } as unknown as LoaderFunctionArgs;
    await loader(args);
    expect(mockFetchDocumentBySlug).toHaveBeenCalledWith("did:plc:test", "example-com", "hello", expect.any(AbortSignal));
  });
});

describe("createSiteLoader (deprecated)", () => {
  it("fetches the Publication", async () => {
    mockFetchPublication.mockResolvedValueOnce(site);
    const result = await createSiteLoader("did:plc:test", "example-com")(makeArgs());
    expect(result).toEqual(site);
  });
});

describe("createWellKnownLoader", () => {
  it("returns a Response containing the publication AT URI", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce("at://did:plc:test/site.standard.publication/my-blog");
    const loader = createWellKnownLoader("did:plc:test", "my-blog");
    const response = await loader(makeArgs());
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe("at://did:plc:test/site.standard.publication/my-blog");
    expect(response.headers.get("Content-Type")).toBe("text/plain");
  });

  it("passes the request signal to resolvePublicationUri", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce("at://did:plc:test/site.standard.publication/my-blog");
    const loader = createWellKnownLoader("did:plc:test", "my-blog");
    const args = makeArgs();
    await loader(args);
    expect(mockResolvePublicationUri).toHaveBeenCalledWith("did:plc:test", "my-blog", args.request.signal);
  });
});

describe("dependency injection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("createPublicationLoader uses injected fetchPublication instead of the default", async () => {
    const injected = vi.fn().mockResolvedValueOnce(site);
    const loader = createPublicationLoader("did:plc:test", "example-com", { fetchPublication: injected });
    const result = await loader(makeArgs());
    expect(result).toEqual(site);
    expect(injected).toHaveBeenCalledWith("did:plc:test", "example-com", expect.any(AbortSignal));
    expect(mockFetchPublication).not.toHaveBeenCalled();
  });

  it("createDocumentRouteLoader uses injected fetchDocumentBySlug instead of the default", async () => {
    const injected = vi.fn().mockResolvedValueOnce(document);
    const loader = createDocumentRouteLoader("did:plc:test", "example-com", undefined, { fetchDocumentBySlug: injected });
    const args = { ...makeArgs(), params: { documentSlug: "hello" } } as unknown as LoaderFunctionArgs;
    expect(await loader(args)).toEqual(document);
    expect(mockFetchDocumentBySlug).not.toHaveBeenCalled();
  });

  it("createArticleRouteLoader uses injected fetchArticleBySlug instead of the default", async () => {
    const injected = vi.fn().mockResolvedValueOnce({ article, uri: documentUri });
    const loader = createArticleRouteLoader("did:plc:test", "example-com", "articleSlug", { fetchArticleBySlug: injected });
    const args = { ...makeArgs(), params: { articleSlug: "hello" } } as unknown as LoaderFunctionArgs;
    const result = await loader(args);
    expect(result).toEqual({ ...article, documentUri });
    expect(injected).toHaveBeenCalledWith("did:plc:test", "example-com", "hello", expect.any(AbortSignal));
    expect(mockFetchArticleBySlug).not.toHaveBeenCalled();
  });

  it("createWellKnownLoader uses injected resolvePublicationUri instead of the default", async () => {
    const injected = vi.fn().mockResolvedValueOnce("at://did:plc:test/site.standard.publication/my-blog");
    const loader = createWellKnownLoader("did:plc:test", "my-blog", { resolvePublicationUri: injected });
    const response = await loader(makeArgs());
    expect(await response.text()).toBe("at://did:plc:test/site.standard.publication/my-blog");
    expect(injected).toHaveBeenCalled();
    expect(mockResolvePublicationUri).not.toHaveBeenCalled();
  });
});
