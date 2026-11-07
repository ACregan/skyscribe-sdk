import { describe, it, expect } from "vitest";
import { getSitemapEntries } from "./sitemap.js";
import type { StandardPublication } from "./types.js";

const mockSite: StandardPublication = {
  uri: "at://did:plc:abc/site.standard.publication/norobotspubkey",
  name: "Test Blog",
  domain: "norobots.blog",
  basePath: "blog",
  description: "A test blog",
  categories: [
    {
      slug: "essays",
      title: "Essays",
      documents: [
        {
          uri: "at://did:plc:abc/site.standard.document/first-post",
          title: "First Post",
          slug: "first-post",
          coverImageUrl: null,
          createdAt: "2024-01-01T00:00:00Z",
          publishedAt: "2024-01-01T12:00:00Z",
          updatedAt: "2024-01-15T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/site.standard.document/second-post",
          title: "Second Post",
          slug: "second-post",
          coverImageUrl: null,
          createdAt: "2024-02-01T00:00:00Z",
          publishedAt: "2024-02-01T12:00:00Z",
        },
      ],
    },
    {
      slug: "notes",
      title: "Notes",
      documents: [
        {
          uri: "at://did:plc:abc/site.standard.document/note-one",
          title: "Note One",
          slug: "note-one",
          coverImageUrl: null,
          createdAt: "2024-03-01T00:00:00Z",
          publishedAt: "2024-03-01T12:00:00Z",
          updatedAt: "2024-03-10T00:00:00Z",
        },
      ],
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

  it("includes the blog index when basePath is set", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/blog" });
  });

  it("does not duplicate root when basePath is empty", () => {
    const siteNoPrefix: StandardPublication = { ...mockSite, basePath: "" };
    const entries = getSitemapEntries(siteNoPrefix, { baseUrl: "https://norobots.blog" });
    const rootEntries = entries.filter(e => e.url === "https://norobots.blog");
    expect(rootEntries).toHaveLength(1);
  });

  it("includes group URLs with basePath", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/blog/essays" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/blog/notes" });
  });

  it("includes group URLs without basePath", () => {
    const siteNoPrefix: StandardPublication = { ...mockSite, basePath: "" };
    const entries = getSitemapEntries(siteNoPrefix, { baseUrl: "https://norobots.blog" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/essays" });
    expect(entries).toContainEqual({ url: "https://norobots.blog/notes" });
  });

  it("includes article URLs with basePath", () => {
    const entries = getSitemapEntries(mockSite, { baseUrl: "https://norobots.blog" });
    expect(entries.some(e => e.url === "https://norobots.blog/blog/essays/first-post")).toBe(true);
    expect(entries.some(e => e.url === "https://norobots.blog/blog/notes/note-one")).toBe(true);
  });

  it("includes article URLs without basePath", () => {
    const siteNoPrefix: StandardPublication = { ...mockSite, basePath: "" };
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


  it("leaves out an article whose canonical URL is another site's", () => {
    const site: StandardPublication = {
      ...mockSite,
      categories: [
        {
          ...mockSite.categories[0],
          documents: [
            ...mockSite.categories[0].documents,
            {
              uri: "at://did:plc:abc/site.standard.document/imported",
              title: "Imported",
              slug: "imported",
              coverImageUrl: null,
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

  it("leaves out an article whose SEO Settings ask for noindex", () => {
    const site: StandardPublication = {
      ...mockSite,
      categories: [
        {
          ...mockSite.categories[0],
          documents: [
            ...mockSite.categories[0].documents,
            {
              uri: "at://did:plc:abc/site.standard.document/hidden",
              title: "Hidden",
              slug: "hidden",
              coverImageUrl: null,
              createdAt: "2024-03-01T00:00:00Z",
              noindex: true,
            },
          ],
        },
      ],
    };
    const urls = getSitemapEntries(site, { baseUrl: "https://norobots.blog" }).map((e) => e.url);
    expect(urls).not.toContain("https://norobots.blog/blog/essays/hidden");
    expect(urls).toContain("https://norobots.blog/blog/essays/first-post");
  });
});

