import { describe, it, expect, vi } from "vitest";
import { documentSeoMeta, publicationSeoMeta } from "./seoMeta.js";

vi.mock("@skyscribe-sdk/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@skyscribe-sdk/core")>();
  return { ...actual };
});

import type { StandardDocument, StandardPublication } from "@skyscribe-sdk/core";

const site: StandardPublication = {
  uri: "at://did:plc:abc/site.standard.publication/tid123",
  name: "NoRobots",
  domain: "norobots.blog",
  basePath: "blog",
  description: "A blog about engineering.",
  splashImageUrl: "https://norobots.blog/images/splash.webp",
  logoImageUrl: "https://norobots.blog/images/logo.webp",
  categories: [],
};

const article: StandardDocument = {
  uri: "at://did:plc:testuser/site.standard.document/doc1",
  title: "LLMs Are Full of Shit",
  content: "<p>Content</p>",
  path: "/engineering/llms-are-full-of-shit",
  site: "at://did:plc:testuser/site.standard.publication/3abc",
  coverImageUrl: "https://norobots.blog/images/llms.webp",
  description: "A post about LLMs.",
  createdAt: "2025-01-01T00:00:00.000Z",
  publishedAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("documentSeoMeta", () => {
  it("uses the SEO title and description and honours noindex", () => {
    const meta = documentSeoMeta(
      { ...article, seo: { title: "SEO title", description: "SEO desc", noindex: true } },
      site,
    );
    expect(meta.title).toBe(`SEO title — ${site.name}`);
    expect(meta.ogTitle).toBe("SEO title");
    expect(meta.twitterDescription).toBe("SEO desc");
    expect(meta.robots).toBe("noindex");
  });

  it("returns combined title", () => {
    const meta = documentSeoMeta(article, site);
    expect(meta.title).toBe("LLMs Are Full of Shit — NoRobots");
  });

  it("sets ogType to article", () => {
    const meta = documentSeoMeta(article, site);
    expect(meta.ogType).toBe("article");
  });

  it("composes ogUrl from site.url + basePath + path", () => {
    const meta = documentSeoMeta(article, site);
    expect(meta.ogUrl).toBe(
      "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    );
  });

  it("prefers article.canonicalUrl when present", () => {
    const meta = documentSeoMeta(
      { ...article, canonicalUrl: "https://norobots.blog/custom" },
      site,
    );
    expect(meta.ogUrl).toBe("https://norobots.blog/custom");
  });

  it("sets summary_large_image card when coverImageUrl present", () => {
    const meta = documentSeoMeta(article, site);
    expect(meta.twitterCard).toBe("summary_large_image");
    expect(meta.ogImage).toBe("https://norobots.blog/images/llms.webp");
    expect(meta.twitterImage).toBe("https://norobots.blog/images/llms.webp");
  });

  it("falls back to summary card when no coverImageUrl", () => {
    const meta = documentSeoMeta({ ...article, coverImageUrl: undefined }, site);
    expect(meta.twitterCard).toBe("summary");
    expect(meta.ogImage).toBeUndefined();
  });

  it("omits description fields when absent", () => {
    const meta = documentSeoMeta({ ...article, description: undefined }, site);
    expect(meta.ogDescription).toBeUndefined();
    expect(meta.twitterDescription).toBeUndefined();
  });
});

describe("publicationSeoMeta", () => {
  it("returns site title", () => {
    const meta = publicationSeoMeta(site);
    expect(meta.title).toBe("NoRobots");
  });

  it("sets ogType to website", () => {
    const meta = publicationSeoMeta(site);
    expect(meta.ogType).toBe("website");
  });

  it("composes ogUrl from url + basePath", () => {
    const meta = publicationSeoMeta(site);
    expect(meta.ogUrl).toBe("https://norobots.blog/blog");
  });

  it("handles missing basePath", () => {
    const meta = publicationSeoMeta({ ...site, basePath: "" });
    expect(meta.ogUrl).toBe("https://norobots.blog");
  });

  it("includes ogImage when splashImageUrl present", () => {
    const meta = publicationSeoMeta(site);
    expect(meta.ogImage).toBe("https://norobots.blog/images/splash.webp");
  });
});
