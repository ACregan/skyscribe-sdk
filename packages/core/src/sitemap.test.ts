import { describe, it, expect } from "vitest";
import { getSitemapEntries } from "./sitemap.js";
import type { Site } from "./types.js";

const mockSite: Site = {
  uri: "at://did:plc:abc/site.standard.publication/norobotspubkey",
  title: "Test Blog",
  url: "norobots.blog",
  urlPrefix: "blog",
  description: "A test blog",
  groups: [
    {
      slug: "essays",
      title: "Essays",
      articles: [
        {
          uri: "at://did:plc:abc/site.standard.document/first-post",
          title: "First Post",
          slug: "first-post",
          splashImageUrl: null,
          createdAt: "2024-01-01T00:00:00Z",
          publishedAt: "2024-01-01T12:00:00Z",
          updatedAt: "2024-01-15T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/site.standard.document/second-post",
          title: "Second Post",
          slug: "second-post",
          splashImageUrl: null,
          createdAt: "2024-02-01T00:00:00Z",
          publishedAt: "2024-02-01T12:00:00Z",
        },
      ],
    },
    {
      slug: "notes",
      title: "Notes",
      articles: [
        {
          uri: "at://did:plc:abc/site.standard.document/note-one",
          title: "Note One",
          slug: "note-one",
          splashImageUrl: null,
          createdAt: "2024-03-01T00:00:00Z",
          publishedAt: "2024-03-01T12:00:00Z",
          updatedAt: "2024-03-10T00:00:00Z",
        },
      ],
    },
  ],
  ungroupedArticles: [
    {
      uri: "at://did:plc:abc/site.standard.document/draft",
      title: "Draft",
      slug: "draft",
      splashImageUrl: null,
      createdAt: "2024-05-01T00:00:00Z",
      publishedAt: "2024-05-01T12:00:00Z",
    },
  ],
};

describe("getSitemapEntries", () => {
  it("returns an array", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(Array.isArray(entries)).toBe(true);
  });

  it("always includes the homepage", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries).toContainEqual({ url: "https://norobots.blog" });
  });

  it("includes the blog index when urlPrefix is set", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/blog" });
  });

  it("does not duplicate root when urlPrefix is empty", () => {
    const siteNoPrefix: Site = { ...mockSite, urlPrefix: "" };
    const entries = getSitemapEntries(siteNoPrefix, { baseUrl: "https://norobots.blog" });
    const rootEntries = entries.filter(e => e.url === "https://norobots.blog");
    expect(rootEntries).toHaveLength(1);
  });

  it("includes group URLs with urlPrefix", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/blog/essays" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/blog/notes" });
  });

  it("includes group URLs without urlPrefix", () => {
    const siteNoPrefix: Site = { ...mockSite, urlPrefix: "" };
    const entries = getSitemapEntries(siteNoPrefix, { baseUrl: "https://norobots.blog" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/essays" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/notes" });
  });

  it("includes article URLs with urlPrefix", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries.some(e => e.url === "https://norobots.blog/blog/essays/first-post")).toBe(true);
    expect(entries.some(e => e.url === "https://norobots.blog/blog/notes/note-one")).toBe(true);
  });

  it("includes article URLs without urlPrefix", () => {
    const siteNoPrefix: Site = { ...mockSite, urlPrefix: "" };
    const entries = getSitemapEntries(siteNoPrefix, { baseUrl: "https://norobots.blog" });
    expect(entries.some(e => e.url === "https://norobots.blog/essays/first-post")).toBe(true);
    expect(entries.some(e => e.url === "https://norobots.blog/notes/note-one")).toBe(true);
  });

  it("includes lastmod when updatedAt is present", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries).toContainEqual({
      url: "https://norobots.blog/blog/essays/first-post",
      lastmod: "2024-01-15",
    });
    expect(entries).toContainEqual({
      url: "https://norobots.blog/blog/notes/note-one",
      lastmod: "2024-03-10",
    });
  });

  it("omits lastmod when updatedAt is absent", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    const secondPost = entries.find(e => e.url === "https://norobots.blog/blog/essays/second-post");
    expect(secondPost).toBeDefined();
    expect(secondPost).not.toHaveProperty("lastmod");
  });

  it("does not include ungroupedArticles", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries.every(e => !e.url.includes("draft"))).toBe(true);
  });

  it("leaves out an article whose canonical URL is another site's", () => {
    const site: Site = {
      ...mockSite,
      groups: [
        {
          ...mockSite.groups[0],
          articles: [
            ...mockSite.groups[0].articles,
            {
              uri: "at://did:plc:abc/site.standard.document/imported",
              title: "Imported",
              slug: "imported",
              splashImageUrl: null,
              createdAt: "2024-03-01T00:00:00Z",
              canonicalElsewhere: true,
            },
          ],
        },
      ],
    };
    const urls = getSitemapEntries(site, { baseUrl: "https://norobots.blog" }).map((e) => e.url);
    expect(urls).not.toContain("https://norobots.blog/blog/essays/imported");
    expect(urls).toContain("https://norobots.blog/blog/essays/first-post");
    // The Group page stays.
    expect(urls).toContain("https://norobots.blog/blog/essays");
  });
});

