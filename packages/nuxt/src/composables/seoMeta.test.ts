import { describe, it, expect, vi } from "vitest";
import { articleSeoMeta, siteSeoMeta } from "./seoMeta.js";

vi.mock("@skyscribe-sdk/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@skyscribe-sdk/core")>();
  return { ...actual };
});

import type { Article, Site } from "@skyscribe-sdk/core";

const site: Site = {
  uri: "at://did:plc:abc/site.standard.publication/tid123",
  title: "NoRobots",
  url: "norobots.blog",
  urlPrefix: "blog",
  description: "A blog about engineering.",
  splashImageUrl: "https://norobots.blog/images/splash.webp",
  logoImageUrl: "https://norobots.blog/images/logo.webp",
  groups: [],
  ungroupedArticles: [],
};

const article: Article = {
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

describe("articleSeoMeta", () => {
  it("uses the SEO title and description and honours noindex", () => {
    const meta = articleSeoMeta(
      { ...article, seo: { title: "SEO title", description: "SEO desc", noindex: true } },
      site,
    );
    expect(meta.title).toBe(`SEO title — ${site.title}`);
    expect(meta.ogTitle).toBe("SEO title");
    expect(meta.twitterDescription).toBe("SEO desc");
    expect(meta.robots).toBe("noindex");
  });

  it("returns combined title", () => {
    const meta = articleSeoMeta(article, site);
    expect(meta.title).toBe("LLMs Are Full of Shit — NoRobots");
  });

  it("sets ogType to article", () => {
    const meta = articleSeoMeta(article, site);
    expect(meta.ogType).toBe("article");
  });

  it("composes ogUrl from site.url + urlPrefix + path", () => {
    const meta = articleSeoMeta(article, site);
    expect(meta.ogUrl).toBe(
      "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    );
  });

  it("prefers article.canonicalUrl when present", () => {
    const meta = articleSeoMeta(
      { ...article, canonicalUrl: "https://norobots.blog/custom" },
      site,
    );
    expect(meta.ogUrl).toBe("https://norobots.blog/custom");
  });

  it("sets summary_large_image card when coverImageUrl present", () => {
    const meta = articleSeoMeta(article, site);
    expect(meta.twitterCard).toBe("summary_large_image");
    expect(meta.ogImage).toBe("https://norobots.blog/images/llms.webp");
    expect(meta.twitterImage).toBe("https://norobots.blog/images/llms.webp");
  });

  it("falls back to summary card when no coverImageUrl", () => {
    const meta = articleSeoMeta({ ...article, coverImageUrl: undefined }, site);
    expect(meta.twitterCard).toBe("summary");
    expect(meta.ogImage).toBeUndefined();
  });

  it("omits description fields when absent", () => {
    const meta = articleSeoMeta({ ...article, description: undefined }, site);
    expect(meta.ogDescription).toBeUndefined();
    expect(meta.twitterDescription).toBeUndefined();
  });
});

describe("siteSeoMeta", () => {
  it("returns site title", () => {
    const meta = siteSeoMeta(site);
    expect(meta.title).toBe("NoRobots");
  });

  it("sets ogType to website", () => {
    const meta = siteSeoMeta(site);
    expect(meta.ogType).toBe("website");
  });

  it("composes ogUrl from url + urlPrefix", () => {
    const meta = siteSeoMeta(site);
    expect(meta.ogUrl).toBe("https://norobots.blog/blog");
  });

  it("handles missing urlPrefix", () => {
    const meta = siteSeoMeta({ ...site, urlPrefix: "" });
    expect(meta.ogUrl).toBe("https://norobots.blog");
  });

  it("includes ogImage when splashImageUrl present", () => {
    const meta = siteSeoMeta(site);
    expect(meta.ogImage).toBe("https://norobots.blog/images/splash.webp");
  });
});
