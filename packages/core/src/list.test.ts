import { describe, it, expect, vi, beforeEach } from "vitest";
import { listPublications, listDocuments } from "./list.js";

vi.mock("./resolve.js", () => ({
  resolveIdentifier: vi.fn(async () => "did:plc:testuser"),
  resolvePds: vi.fn(async () => "https://pds.example.com"),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => mockFetch.mockReset());

describe("listPublications", () => {
  it("fetches all sites from a single page response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/example-com",
            cid: "bafy",
            value: {
              scribe: {
                domain: "example.com",
                basePath: "blog",
                title: "My Blog",
                groups: [],
                ungroupedArticles: [],
              },
            },
          },
        ],
      }),
    });

    const result = await listPublications("alice.bsky.social");
    expect(result).toHaveLength(1);
    expect(result[0].uri).toBe("at://did:plc:testuser/site.standard.publication/example-com");
    expect(result[0].name).toBe("My Blog");
    expect(result[0].domain).toBe("example.com");
    expect(result[0].basePath).toBe("blog");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("com.atproto.repo.listRecords") }),
      expect.any(Object)
    );
  });

  it("prefers the top-level description over scribe.description", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/example-com",
            cid: "bafy",
            value: {
              description: "Top-level wins",
              scribe: {
                domain: "example.com",
                basePath: "blog",
                title: "My Blog",
                description: "Stale nested value",
                groups: [],
                ungroupedArticles: [],
              },
            },
          },
        ],
      }),
    });

    const result = await listPublications("alice.bsky.social");
    expect(result[0].description).toBe("Top-level wins");
  });

  it("falls back to scribe.description for legacy records with no top-level field", async () => {
    // Every publication written before the CMS's top-level description fix
    // only has it here. Without this fallback, every existing site's
    // description silently disappears the moment this SDK version ships.
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/example-com",
            cid: "bafy",
            value: {
              scribe: {
                domain: "example.com",
                basePath: "blog",
                title: "My Blog",
                description: "Legacy nested description",
                groups: [],
                ungroupedArticles: [],
              },
            },
          },
        ],
      }),
    });

    const result = await listPublications("alice.bsky.social");
    expect(result[0].description).toBe("Legacy nested description");
  });

  it("fetches from site.standard.publication collection", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/example-com",
            cid: "bafy",
            value: {
              scribe: { domain: "example.com", basePath: "", title: "My Blog" },
            },
          },
        ],
      }),
    });

    await listPublications("alice.bsky.social");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining("site.standard.publication"),
      }),
      expect.any(Object)
    );
  });

  it("maps scribe.domain to url and scribe.basePath to urlPrefix", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/norobots-blog",
            cid: "bafy",
            value: {
              scribe: { domain: "norobots.blog", basePath: "posts", title: "NoRobots" },
            },
          },
        ],
      }),
    });

    const result = await listPublications("did:plc:testuser");
    expect(result[0].domain).toBe("norobots.blog");
    expect(result[0].basePath).toBe("posts");
  });

  it("follows cursor across multiple pages", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/site.standard.publication/site-one",
              cid: "bafy1",
              value: {
                scribe: { domain: "one.example.com", basePath: "", title: "Site One" },
              },
            },
          ],
          cursor: "page2token",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/site.standard.publication/site-two",
              cid: "bafy2",
              value: {
                scribe: { domain: "two.example.com", basePath: "", title: "Site Two" },
              },
            },
          ],
        }),
      });

    const result = await listPublications("did:plc:testuser");
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Site One");
    expect(result[1].name).toBe("Site Two");

    const secondCall = mockFetch.mock.calls[1][0] as URL;
    expect(secondCall.searchParams.get("cursor")).toBe("page2token");
  });

  it("normalises missing Categories to an empty array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.publication/example-com",
            cid: "bafy",
            value: {
              scribe: { domain: "example.com", basePath: "", title: "Test" },
            },
          },
        ],
      }),
    });

    const result = await listPublications("did:plc:testuser");
    expect(result[0].categories).toEqual([]);
  });

  it("returns an empty array when there are no site records", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: [] }),
    });

    const result = await listPublications("did:plc:testuser");
    expect(result).toEqual([]);
  });

  it("throws when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Forbidden" });
    await expect(listPublications("did:plc:testuser")).rejects.toThrow("Failed to list site.standard.publication");
  });
});

describe("listDocuments", () => {
  it("fetches all articles from site.standard.document collection", async () => {
    const rawDocument = {
      title: "Hello World",
      path: "/essays/hello-world",
      site: "at://did:plc:testuser/site.standard.publication/example-com",
      publishedAt: "2024-01-02T00:00:00Z",
      splashImageUrl: null,
      description: "A test article",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/hello-world",
            cid: "bafy",
            value: rawDocument,
          },
        ],
      }),
    });

    const result = await listDocuments("alice.bsky.social");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      uri: "at://did:plc:testuser/site.standard.document/hello-world",
      title: "Hello World",
      slug: "hello-world",
      coverImageUrl: null,
      description: "A test article",
      createdAt: "2024-01-01T00:00:00Z",
      publishedAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    });
  });

  it("derives slug from the last segment of path", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/my-article-slug",
            cid: "bafy",
            value: {
              title: "Test",
              path: "/blog/essays/my-article-slug",
              site: "at://did:plc:testuser/site.standard.publication/example-com",
              publishedAt: "2024-01-01T00:00:00Z",
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
      }),
    });

    const result = await listDocuments("did:plc:testuser");
    expect(result[0].slug).toBe("my-article-slug");
  });

  it("uses the human-readable slug from path, not the TID rkey", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/3mp47vvkh342n",
            cid: "bafy",
            value: {
              title: "Test",
              path: "/essays/a-year-of-letters",
              site: "at://did:plc:testuser/site.standard.publication/3mp4nd46xwr2h",
              publishedAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
      }),
    });

    const result = await listDocuments("did:plc:testuser");
    expect(result[0].slug).toBe("a-year-of-letters");
  });

  it("falls back to the rkey for records without a path (drafts)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/3mp47vvkh342n",
            cid: "bafy",
            value: {
              title: "Draft",
              site: "https://reader.scribe-atp.app/did:plc:testuser/site.standard.document/3mp47vvkh342n",
              scribe: { createdAt: "2024-03-01T00:00:00Z" },
            },
          },
        ],
      }),
    });

    const result = await listDocuments("did:plc:testuser");
    expect(result[0].slug).toBe("3mp47vvkh342n");
  });

  it("reads createdAt, the cover image and contributors from current records", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/3mp47vvkh342n",
            cid: "bafy",
            value: {
              title: "Current",
              path: "/essays/current",
              site: "at://did:plc:testuser/site.standard.publication/3mp4nd46xwr2h",
              publishedAt: "2024-01-02T00:00:00Z",
              contributors: [{ did: "did:plc:bob", role: "Editor" }],
              scribe: {
                createdAt: "2024-01-01T00:00:00Z",
                coverImageUrl: "https://cdn.example.com/cover.webp",
              },
            },
          },
        ],
      }),
    });

    const result = await listDocuments("did:plc:testuser");
    expect(result[0].createdAt).toBe("2024-01-01T00:00:00Z");
    expect(result[0].coverImageUrl).toBe("https://cdn.example.com/cover.webp");
    expect(result[0].contributors).toEqual([{ did: "did:plc:bob", role: "Editor" }]);
  });

  it("follows cursor across multiple pages", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/site.standard.document/first",
              cid: "bafy1",
              value: {
                title: "First",
                path: "/first",
                site: "at://did:plc:testuser/site.standard.publication/example-com",
                publishedAt: "2024-01-01T00:00:00Z",
                createdAt: "2024-01-01T00:00:00Z",
              },
            },
          ],
          cursor: "nextpage",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            {
              uri: "at://did:plc:testuser/site.standard.document/second",
              cid: "bafy2",
              value: {
                title: "Second",
                path: "/second",
                site: "at://did:plc:testuser/site.standard.publication/example-com",
                publishedAt: "2024-01-02T00:00:00Z",
                createdAt: "2024-01-02T00:00:00Z",
              },
            },
          ],
        }),
      });

    const result = await listDocuments("did:plc:testuser");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("First");
    expect(result[1].title).toBe("Second");
  });

  it("normalises an undefined cover image to null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        records: [
          {
            uri: "at://did:plc:testuser/site.standard.document/no-splash",
            cid: "bafy",
            value: {
              title: "No Splash",
              path: "/no-splash",
              site: "at://did:plc:testuser/site.standard.publication/example-com",
              publishedAt: "2024-01-01T00:00:00Z",
              createdAt: "2024-01-01T00:00:00Z",
            },
          },
        ],
      }),
    });

    const result = await listDocuments("did:plc:testuser");
    expect(result[0].coverImageUrl).toBeNull();
  });

  it("returns an empty array when there are no article records", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: [] }),
    });

    const result = await listDocuments("did:plc:testuser");
    expect(result).toEqual([]);
  });

  it("throws when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, statusText: "Not Found" });
    await expect(listDocuments("did:plc:testuser")).rejects.toThrow(
      "Failed to list site.standard.document"
    );
  });
});
