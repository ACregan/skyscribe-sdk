import { describe, it, expect, vi, beforeEach } from "vitest";
import { createScribeSite, createWellKnownHandler } from "./create-scribe-site.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchSite: vi.fn(),
  fetchArticleBySlug: vi.fn(),
  resolvePublicationUri: vi.fn(),
}));

import { fetchSite, fetchArticleBySlug, resolvePublicationUri } from "@skyscribe-sdk/core";
const mockFetchSite = vi.mocked(fetchSite);
const mockFetchArticleBySlug = vi.mocked(fetchArticleBySlug);
const mockResolvePublicationUri = vi.mocked(resolvePublicationUri);

const mockSite = {
  uri: "at://did:plc:abc/site.standard.publication/alicepubkey",
  title: "Alice's Blog",
  url: "alice.bsky.social",
  urlPrefix: "blog",
  description: "Thoughts from Alice",
  splashImageUrl: "https://example.com/splash.jpg",
  groups: [
    {
      slug: "tech",
      title: "Tech",
      articles: [
        {
          uri: "at://did:plc:abc/site.standard.document/hello",
          title: "Hello World",
          slug: "hello",
          description: "My first post",
          splashImageUrl: "https://example.com/hello.jpg",
          createdAt: "2024-01-01T00:00:00Z",
          publishedAt: "2024-01-01T12:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/site.standard.document/second",
          title: "Second Post",
          slug: "second",
          description: null,
          splashImageUrl: null,
          createdAt: "2024-02-01T00:00:00Z",
          publishedAt: "2024-02-01T12:00:00Z",
        },
      ],
    },
    {
      slug: "life",
      title: "Life",
      articles: [
        {
          uri: "at://did:plc:abc/site.standard.document/travel",
          title: "Travel Notes",
          slug: "travel",
          description: "A trip",
          splashImageUrl: null,
          createdAt: "2024-03-01T00:00:00Z",
          publishedAt: "2024-03-01T12:00:00Z",
        },
      ],
    },
  ],
  ungroupedArticles: [],
};

beforeEach(() => {
  mockFetchSite.mockResolvedValue(mockSite);
  mockFetchArticleBySlug.mockResolvedValue({ article: {} as never, uri: "" });
});

describe("createScribeSite", () => {
  describe("generateGroupParams", () => {
    it("returns one entry per group", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const params = await scribe.generateGroupParams();
      expect(params).toEqual([{ groupSlug: "tech" }, { groupSlug: "life" }]);
    });

    it("calls fetchSite with the correct author and publicationUrl", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      await scribe.generateGroupParams();
      expect(mockFetchSite).toHaveBeenCalledWith("alice.bsky.social", "https://alice.bsky.social");
    });
  });

  describe("generateArticleParams", () => {
    it("returns flat list of all article slugs across all groups", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const params = await scribe.generateArticleParams();
      expect(params).toEqual([
        { articleSlug: "hello" },
        { articleSlug: "second" },
        { articleSlug: "travel" },
      ]);
    });
  });

  describe("generateGroupArticleParams", () => {
    it("returns groupSlug + articleSlug pairs for all articles", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const params = await scribe.generateGroupArticleParams();
      expect(params).toEqual([
        { groupSlug: "tech", articleSlug: "hello" },
        { groupSlug: "tech", articleSlug: "second" },
        { groupSlug: "life", articleSlug: "travel" },
      ]);
    });
  });

  describe("generateSiteMetadata", () => {
    it("returns title and description from site", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateSiteMetadata();
      expect(meta.title).toBe("Alice's Blog");
      expect(meta.description).toBe("Thoughts from Alice");
    });

    it("includes openGraph with image when splashImageUrl is present", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateSiteMetadata();
      expect(meta.openGraph).toMatchObject({
        title: "Alice's Blog",
        images: ["https://example.com/splash.jpg"],
      });
    });

    it("omits openGraph images when splashImageUrl is absent", async () => {
      mockFetchSite.mockResolvedValueOnce({ ...mockSite, splashImageUrl: undefined });
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateSiteMetadata();
      expect((meta.openGraph as Record<string, unknown>)?.images).toBeUndefined();
    });
  });

  describe("generateGroupMetadata", () => {
    it("composes title as group.title — site.title", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateGroupMetadata("tech");
      expect(meta.title).toBe("Tech — Alice's Blog");
    });

    it("falls back to site title when group is not found", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateGroupMetadata("unknown");
      expect(meta.title).toBe("Alice's Blog");
    });
  });

  describe("generateArticleMetadata", () => {
    it("composes title as article.title — site.title", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateArticleMetadata("hello");
      expect(meta.title).toBe("Hello World — Alice's Blog");
    });

    it("includes description as description", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateArticleMetadata("hello");
      expect(meta.description).toBe("My first post");
    });

    it("includes openGraph image from splashImageUrl", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateArticleMetadata("hello");
      expect(meta.openGraph).toMatchObject({
        images: ["https://example.com/hello.jpg"],
      });
    });

    it("omits description when synopsis is null", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateArticleMetadata("second");
      expect(meta.description).toBeUndefined();
    });

    it("uses the article's SEO Settings when it has them", async () => {
      mockFetchArticleBySlug.mockResolvedValueOnce({
        article: { seo: { title: "Hi", description: "Short", noindex: true } } as never,
        uri: "",
      });
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateArticleMetadata("hello");
      expect(meta.title).toBe("Hi — Alice's Blog");
      expect(meta.description).toBe("Short");
      expect(meta.robots).toEqual({ index: false });
    });

    it("falls back to the snapshot when the article fetch fails", async () => {
      mockFetchArticleBySlug.mockRejectedValueOnce(new Error("PDS down"));
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateArticleMetadata("hello");
      expect(meta.title).toBe("Hello World — Alice's Blog");
      expect(meta.robots).toBeUndefined();
    });

    it("falls back to site title when article is not found", async () => {
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const meta = await scribe.generateArticleMetadata("nonexistent");
      expect(meta.title).toBe("Alice's Blog");
    });
  });

  describe("getDocumentUri", () => {
    it("returns the AT URI for a document", async () => {
      const documentUri = "at://did:plc:abc/site.standard.document/3jxtctq7kqm2y";
      mockFetchArticleBySlug.mockResolvedValueOnce({ article: {} as never, uri: documentUri });
      const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
      const uri = await scribe.getDocumentUri("hello");
      expect(uri).toBe(documentUri);
      expect(mockFetchArticleBySlug).toHaveBeenCalledWith("alice.bsky.social", "https://alice.bsky.social", "hello");
    });
  });
});

describe("createWellKnownHandler", () => {
  it("returns a handler that responds with the publication AT URI", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce("at://did:plc:abc/site.standard.publication/3jxtctq7kqm2y");
    const handler = createWellKnownHandler("alice.bsky.social", "https://alice.bsky.social");
    const response = await handler(new Request("https://example.com/.well-known/site.standard.publication"));
    expect(response).toBeInstanceOf(Response);
    expect(await response.text()).toBe("at://did:plc:abc/site.standard.publication/3jxtctq7kqm2y");
    expect(response.headers.get("Content-Type")).toBe("text/plain");
  });

  it("passes the request signal to resolvePublicationUri", async () => {
    mockResolvePublicationUri.mockResolvedValueOnce("at://did:plc:abc/site.standard.publication/3jxtctq7kqm2y");
    const handler = createWellKnownHandler("alice.bsky.social", "https://alice.bsky.social");
    const request = new Request("https://example.com/.well-known/site.standard.publication");
    await handler(request);
    expect(mockResolvePublicationUri).toHaveBeenCalledWith("alice.bsky.social", "https://alice.bsky.social", request.signal);
  });
});
