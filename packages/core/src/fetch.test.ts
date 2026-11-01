import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchSite, fetchArticle, fetchArticleBySlug, resolvePublicationUri, _clearAllCaches } from "./fetch.js";
import { resolveIdentifier } from "./resolve.js";

vi.mock("./resolve.js", () => ({
  resolveIdentifier: vi.fn(async () => "did:plc:testuser"),
  resolvePds: vi.fn(async () => "https://pds.example.com"),
  _clearCaches: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  _clearAllCaches();
});

const makeListResponse = (
  records: Array<{ uri: string; value: object }>
) => ({
  ok: true,
  json: async () => ({ records }),
});

const makeScribeRecord = (overrides: object = {}) => ({
  uri: "at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y",
  value: {
    url: "https://example.com",
    name: "Test Site",
    scribe: {
      domain: "example.com",
      basePath: "blog",
      title: "Test Site",
      groups: [],
      ungroupedArticles: [],
      ...overrides,
    },
  },
});

describe("fetchSite", () => {
  it("fetches via listRecords and filters by url field", async () => {
    mockFetch.mockResolvedValueOnce(makeListResponse([makeScribeRecord()]));

    const result = await fetchSite("did:plc:testuser", "https://example.com");
    expect(result.title).toBe("Test Site");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("listRecords"),
      }),
      expect.any(Object)
    );
  });

  it("fetches from site.standard.publication collection", async () => {
    mockFetch.mockResolvedValueOnce(makeListResponse([makeScribeRecord()]));

    await fetchSite("did:plc:testuser", "https://example.com");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("site.standard.publication"),
      }),
      expect.any(Object)
    );
  });

  it("reads description from top-level publication field", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3abc",
        value: {
          url: "https://example.com",
          name: "Test Site",
          description: "Top-level description",
          scribe: { domain: "example.com", basePath: "", title: "Test Site" },
        },
      }])
    );

    const result = await fetchSite("did:plc:testuser", "https://example.com");
    expect(result.description).toBe("Top-level description");
  });

  it("returns undefined description when neither top-level nor scribe field is present", async () => {
    mockFetch.mockResolvedValueOnce(makeListResponse([makeScribeRecord()]));

    const result = await fetchSite("did:plc:testuser", "https://example.com");
    expect(result.description).toBeUndefined();
  });

  it("falls back to scribe.description for legacy records with no top-level field", async () => {
    // Every publication written before the CMS's top-level description fix
    // only has it here. Without this fallback, every existing site's
    // description silently disappears the moment this SDK version ships.
    mockFetch.mockResolvedValueOnce(
      makeListResponse([
        makeScribeRecord({ description: "Legacy nested description" }),
      ])
    );

    const result = await fetchSite("did:plc:testuser", "https://example.com");
    expect(result.description).toBe("Legacy nested description");
  });

  it("prefers the top-level description over scribe.description when both are present", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([
        {
          uri: "at://did:plc:testuser/site.standard.publication/3abc",
          value: {
            url: "https://example.com",
            name: "Test Site",
            description: "Top-level wins",
            scribe: { domain: "example.com", basePath: "", title: "Test Site", description: "Stale nested value" },
          },
        },
      ])
    );

    const result = await fetchSite("did:plc:testuser", "https://example.com");
    expect(result.description).toBe("Top-level wins");
  });

  it("maps scribe.domain to url and scribe.basePath to urlPrefix", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3abc",
        value: {
          url: "https://norobots.blog",
          name: "NoRobots",
          scribe: { domain: "norobots.blog", basePath: "posts", title: "NoRobots" },
        },
      }])
    );

    const result = await fetchSite("did:plc:testuser", "https://norobots.blog");
    expect(result.url).toBe("norobots.blog");
    expect(result.urlPrefix).toBe("posts");
  });

  it("strips trailing slash from publicationUrl when matching", async () => {
    mockFetch.mockResolvedValueOnce(makeListResponse([makeScribeRecord()]));

    const result = await fetchSite("did:plc:testuser", "https://example.com/");
    expect(result.title).toBe("Test Site");
  });

  it("throws NotFoundError when no publication matches the url", async () => {
    mockFetch.mockResolvedValueOnce(makeListResponse([]));

    await expect(
      fetchSite("did:plc:testuser", "https://notfound.example.com")
    ).rejects.toMatchObject({ name: "NotFoundError", message: expect.stringContaining("Site not found") });
  });

  it("throws PdsFetchError when listRecords fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Server Error" });

    await expect(
      fetchSite("did:plc:testuser", "https://example.com")
    ).rejects.toMatchObject({ name: "PdsFetchError", message: expect.stringContaining("Failed to fetch publications") });
  });

  it("throws PdsUnreachableError when the listRecords connection itself fails", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(
      fetchSite("did:plc:testuser", "https://example.com")
    ).rejects.toMatchObject({ name: "PdsUnreachableError" });
  });

  it("normalises missing groups and ungroupedArticles to empty arrays", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3abc",
        value: {
          url: "https://example.com",
          scribe: { domain: "example.com", basePath: "", title: "Test" },
        },
      }])
    );

    const result = await fetchSite("did:plc:testuser", "https://example.com");
    expect(result.groups).toEqual([]);
    expect(result.ungroupedArticles).toEqual([]);
  });

  it("reuses the cached AT URI on a second call via getRecord instead of listRecords", async () => {
    mockFetch.mockResolvedValueOnce(makeListResponse([makeScribeRecord()]));
    await fetchSite("did:plc:testuser", "https://example.com");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: makeScribeRecord().value }),
    });
    await fetchSite("did:plc:testuser", "https://example.com");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0].href).toContain("getRecord");
    expect(mockFetch.mock.calls[1][0].href).not.toContain("listRecords");
  });

  it("self-heals when the cached AT URI no longer resolves (record deleted/recreated elsewhere)", async () => {
    // First call caches the original AT URI.
    mockFetch.mockResolvedValueOnce(makeListResponse([makeScribeRecord()]));
    const first = await fetchSite("did:plc:testuser", "https://example.com");
    expect(first.uri).toBe("at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y");

    // Second call: getRecord against the cached (now-deleted) rkey fails...
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    // ...so it should fall back to a fresh listRecords lookup and find the new record.
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3newrkey",
        value: {
          url: "https://example.com",
          scribe: { domain: "example.com", basePath: "blog", title: "Recreated Site", groups: [], ungroupedArticles: [] },
        },
      }])
    );

    const second = await fetchSite("did:plc:testuser", "https://example.com");
    expect(second.uri).toBe("at://did:plc:testuser/site.standard.publication/3newrkey");
    expect(second.title).toBe("Recreated Site");
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // A third call should now be served from the freshly-repaired cache via getRecord.
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          url: "https://example.com",
          scribe: { domain: "example.com", basePath: "blog", title: "Recreated Site", groups: [], ungroupedArticles: [] },
        },
      }),
    });
    await fetchSite("did:plc:testuser", "https://example.com");
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch.mock.calls[3][0].href).toContain("getRecord");
  });
});

describe("fetchArticle", () => {
  it("fetches an article record from site.standard.document collection", async () => {
    const rawRecord = {
      title: "Hello World",
      content: { $type: "app.scribe.content.html", html: "<p>Hi</p>" },
      path: "/essays/hello-world",
      site: "at://did:plc:testuser/site.standard.publication/3abc",
      publishedAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      scribe: {
        canonicalUrl: "https://example.com/blog/essays/hello-world",
        createdAt: "2024-01-01T00:00:00Z",
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: rawRecord }),
    });

    const result = await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(result.title).toBe("Hello World");
    expect(result.content).toBe("<p>Hi</p>");
    expect(result.path).toBe("/essays/hello-world");
    expect(result.site).toBe("at://did:plc:testuser/site.standard.publication/3abc");
    expect(result.canonicalUrl).toBe("https://example.com/blog/essays/hello-world");
    expect(result.publishedAt).toBe("2024-01-02T00:00:00Z");
  });

  it("fetches from site.standard.document collection", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/hello-world",
          site: "https://example.com",
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("site.standard.document"),
      }),
      expect.any(Object)
    );
  });

  it("passes through canonicalUrl when present in scribe", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/test",
          site: "https://example.com",
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          scribe: { canonicalUrl: "https://example.com/test" },
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(result.canonicalUrl).toBe("https://example.com/test");
  });

  it("leaves canonicalUrl undefined when absent from scribe", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/test",
          site: "https://example.com",
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(result.canonicalUrl).toBeUndefined();
  });

  it("extracts html from app.scribe.content.html union", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "<p>Body</p>" },
          path: "/test",
          site: "https://example.com",
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(result.content).toBe("<p>Body</p>");
  });

  it("returns empty string for content when union type is unrecognised", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "some.other.type", data: "..." },
          path: "/test",
          site: "https://example.com",
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(result.content).toBe("");
  });

  it("maps scribe.coverImageUrl to article.coverImageUrl", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/test",
          site: "at://did:plc:testuser/site.standard.publication/3abc",
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          scribe: { coverImageUrl: "https://images.example.com/cover.jpg" },
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(result.coverImageUrl).toBe("https://images.example.com/cover.jpg");
  });

  it("maps the valid parts of scribe.seo to article.seo", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/test",
          site: "at://did:plc:testuser/site.standard.publication/3abc",
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          scribe: { seo: { title: "SEO title", description: 7, noindex: true } },
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(result.seo).toEqual({ title: "SEO title", noindex: true });
  });

  it("leaves coverImageUrl undefined when absent from scribe", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: {
          title: "Test",
          content: { $type: "app.scribe.content.html", html: "" },
          path: "/test",
          site: "at://did:plc:testuser/site.standard.publication/3abc",
          publishedAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      }),
    });

    const result = await fetchArticle("did:plc:testuser", "3jxtctq7kqm2y");
    expect(result.coverImageUrl).toBeUndefined();
  });

  it("throws PdsFetchError when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(
      fetchArticle("did:plc:testuser", "missing-article")
    ).rejects.toMatchObject({ name: "PdsFetchError", message: expect.stringContaining("Failed to fetch article") });
  });
});

const makeArticleListResponse = (articleRefs: object[]) =>
  makeListResponse([{
    uri: "at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y",
    value: {
      url: "https://example.com",
      name: "Test Site",
      scribe: {
        domain: "example.com",
        basePath: "blog",
        title: "Test Site",
        groups: [{ slug: "essays", title: "Essays", articles: articleRefs }],
        ungroupedArticles: [],
      },
    },
  }]);

const makeArticleResponse = () => ({
  ok: true,
  json: async () => ({
    value: {
      title: "My Article",
      content: { $type: "app.scribe.content.html", html: "<p>Hi</p>" },
      path: "/essays/my-article",
      site: "https://example.com",
      publishedAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      scribe: {
        canonicalUrl: "https://example.com/blog/essays/my-article",
        createdAt: "2024-01-01T00:00:00Z",
      },
    },
  }),
});

describe("fetchArticleBySlug", () => {
  it("fetches site then article by TID rkey from ArticleRef.uri", async () => {
    mockFetch
      .mockResolvedValueOnce(makeArticleListResponse([{
        uri: "at://did:plc:testuser/site.standard.document/3jxtctq7kqm2y",
        title: "My Article",
        slug: "my-article",
        splashImageUrl: null,
        createdAt: "2024-01-01T00:00:00Z",
      }]))
      .mockResolvedValueOnce(makeArticleResponse());

    const result = await fetchArticleBySlug("did:plc:testuser", "https://example.com", "my-article");

    expect(result.article.title).toBe("My Article");
    expect(result.uri).toBe("at://did:plc:testuser/site.standard.document/3jxtctq7kqm2y");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("rkey=3jxtctq7kqm2y") }),
      expect.any(Object)
    );
  });

  it("returns the AT URI from the ArticleRef, not a reconstructed one", async () => {
    const articleUri = "at://did:plc:testuser/site.standard.document/3jxtctq7kqm2y";
    mockFetch
      .mockResolvedValueOnce(makeArticleListResponse([{
        uri: articleUri,
        title: "My Article",
        slug: "my-article",
        splashImageUrl: null,
        createdAt: "2024-01-01T00:00:00Z",
      }]))
      .mockResolvedValueOnce(makeArticleResponse());

    const result = await fetchArticleBySlug("did:plc:testuser", "https://example.com", "my-article");
    expect(result.uri).toBe(articleUri);
  });

  it("falls back to rkey matching for legacy ArticleRefs without a slug field", async () => {
    mockFetch
      .mockResolvedValueOnce(makeArticleListResponse([{
        uri: "at://did:plc:testuser/site.standard.document/my-article",
        title: "My Article",
        splashImageUrl: null,
        createdAt: "2024-01-01T00:00:00Z",
      }]))
      .mockResolvedValueOnce(makeArticleResponse());

    const result = await fetchArticleBySlug("did:plc:testuser", "https://example.com", "my-article");
    expect(result.article.title).toBe("My Article");
  });

  it("searches ungroupedArticles as well as groups", async () => {
    mockFetch
      .mockResolvedValueOnce(makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y",
        value: {
          url: "https://example.com",
          scribe: {
            domain: "example.com",
            basePath: "",
            title: "Test Site",
            groups: [],
            ungroupedArticles: [{
              uri: "at://did:plc:testuser/site.standard.document/3jxtctq7kqm2y",
              title: "My Article",
              slug: "my-article",
              splashImageUrl: null,
              createdAt: "2024-01-01T00:00:00Z",
            }],
          },
        },
      }]))
      .mockResolvedValueOnce(makeArticleResponse());

    const result = await fetchArticleBySlug("did:plc:testuser", "https://example.com", "my-article");
    expect(result.article.title).toBe("My Article");
  });

  it("throws NotFoundError when no article matches the slug", async () => {
    mockFetch.mockResolvedValueOnce(makeArticleListResponse([]));

    await expect(
      fetchArticleBySlug("did:plc:testuser", "https://example.com", "nonexistent")
    ).rejects.toMatchObject({ name: "NotFoundError", message: "Article not found: nonexistent" });
  });

  // Found live 2026-07-16: Scribe CMS's Contributors feature (sync-later
  // publish) can point an ArticleRef.uri at a *different* account's repo
  // than the site's own — this function used to always refetch via the
  // site's own `author` identifier regardless, hitting the wrong repo
  // (`RecordNotFound`, surfaced to readers as an unexpected error).
  describe("Contributor-authored articles (ArticleRef.uri on a different repo than the site owner)", () => {
    afterEach(() => {
      vi.mocked(resolveIdentifier).mockImplementation(async () => "did:plc:testuser");
    });

    it("resolves the article from the ref's own DID, not the site's author", async () => {
      vi.mocked(resolveIdentifier).mockImplementation(async (handleOrDid) => handleOrDid);

      mockFetch
        .mockResolvedValueOnce(makeArticleListResponse([{
          uri: "at://did:plc:contributor/site.standard.document/3jxtctq7kqm2y",
          title: "Guest Post",
          slug: "guest-post",
          splashImageUrl: null,
          createdAt: "2024-01-01T00:00:00Z",
        }]))
        .mockResolvedValueOnce(makeArticleResponse());

      const result = await fetchArticleBySlug("did:plc:siteowner", "https://example.com", "guest-post");

      expect(result.article.title).toBe("My Article");
      expect(result.uri).toBe("at://did:plc:contributor/site.standard.document/3jxtctq7kqm2y");
      // The article fetch (second call) must hit the Contributor's own
      // repo, not the site owner's — the bug fetched `repo=did:plc:siteowner`
      // here instead, which 404s since the document doesn't live there.
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.objectContaining({ href: expect.stringContaining("repo=did%3Aplc%3Acontributor") }),
        expect.any(Object)
      );
    });
  });
});

describe("resolvePublicationUri", () => {
  it("returns TID-based AT URI by looking up publication by url field", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y",
        value: { url: "https://example.com", scribe: { domain: "example.com", basePath: "", title: "Test" } },
      }])
    );

    const result = await resolvePublicationUri("did:plc:testuser", "https://example.com");
    expect(result).toBe("at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y");
  });

  it("strips trailing slash from publicationUrl when matching", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3abc",
        value: { url: "https://example.com", scribe: { domain: "example.com", basePath: "", title: "Test" } },
      }])
    );

    const result = await resolvePublicationUri("did:plc:testuser", "https://example.com/");
    expect(result).toBe("at://did:plc:testuser/site.standard.publication/3abc");
  });

  it("throws NotFoundError when no publication matches the url", async () => {
    mockFetch.mockResolvedValueOnce(makeListResponse([]));

    await expect(
      resolvePublicationUri("did:plc:testuser", "https://notfound.example.com")
    ).rejects.toMatchObject({ name: "NotFoundError", message: expect.stringContaining("Site not found") });
  });

  it("caches the resolved AT URI, so a second call for the same author+url doesn't refetch", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y",
        value: { url: "https://example.com", scribe: { domain: "example.com", basePath: "", title: "Test" } },
      }])
    );

    const first = await resolvePublicationUri("did:plc:testuser", "https://example.com");
    const callsAfterFirst = mockFetch.mock.calls.length;
    const second = await resolvePublicationUri("did:plc:testuser", "https://example.com");

    expect(second).toBe(first);
    expect(mockFetch.mock.calls.length).toBe(callsAfterFirst);
  });

  it("does not share the cache across different publication urls for the same author", async () => {
    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y",
        value: { url: "https://example.com", scribe: { domain: "example.com", basePath: "", title: "Test" } },
      }])
    );
    await resolvePublicationUri("did:plc:testuser", "https://example.com");
    const callsAfterFirst = mockFetch.mock.calls.length;

    mockFetch.mockResolvedValueOnce(
      makeListResponse([{
        uri: "at://did:plc:testuser/site.standard.publication/3other",
        value: { url: "https://other.example.com", scribe: { domain: "other.example.com", basePath: "", title: "Other" } },
      }])
    );
    const second = await resolvePublicationUri("did:plc:testuser", "https://other.example.com");

    expect(second).toBe("at://did:plc:testuser/site.standard.publication/3other");
    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("re-resolves once the cache entry's TTL has expired", async () => {
    vi.useFakeTimers();
    try {
      mockFetch.mockResolvedValueOnce(
        makeListResponse([{
          uri: "at://did:plc:testuser/site.standard.publication/3jxtctq7kqm2y",
          value: { url: "https://example.com", scribe: { domain: "example.com", basePath: "", title: "Test" } },
        }])
      );
      await resolvePublicationUri("did:plc:testuser", "https://example.com");
      const callsAfterFirst = mockFetch.mock.calls.length;

      vi.advanceTimersByTime(61_000);

      mockFetch.mockResolvedValueOnce(
        makeListResponse([{
          uri: "at://did:plc:testuser/site.standard.publication/3rekeyed",
          value: { url: "https://example.com", scribe: { domain: "example.com", basePath: "", title: "Test" } },
        }])
      );
      const second = await resolvePublicationUri("did:plc:testuser", "https://example.com");

      expect(mockFetch.mock.calls.length).toBeGreaterThan(callsAfterFirst);
      expect(second).toBe("at://did:plc:testuser/site.standard.publication/3rekeyed");
    } finally {
      vi.useRealTimers();
    }
  });
});
