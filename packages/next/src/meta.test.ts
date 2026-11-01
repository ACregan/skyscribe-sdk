import { describe, it, expect, vi } from "vitest";
import {
  articleMetadata,
  siteMetadata,
  generateArticleJsonLd,
  generateSiteJsonLd,
} from "./meta.js";

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

describe("articleMetadata", () => {
  it("uses the SEO title and description and honours noindex", () => {
    const meta = articleMetadata(
      { ...article, seo: { title: "LLMs, Honestly", description: "Why LLMs bluff.", noindex: true } },
      site,
    );
    expect(meta.title).toBe("LLMs, Honestly — NoRobots");
    expect(meta.description).toBe("Why LLMs bluff.");
    expect(meta.openGraph).toMatchObject({ title: "LLMs, Honestly", description: "Why LLMs bluff." });
    expect(meta.twitter).toMatchObject({ title: "LLMs, Honestly", description: "Why LLMs bluff." });
    expect(meta.robots).toEqual({ index: false });
  });

  it("leaves robots unset without noindex", () => {
    expect(articleMetadata(article, site).robots).toBeUndefined();
  });

  it("returns combined title", () => {
    const meta = articleMetadata(article, site);
    expect(meta.title).toBe("LLMs Are Full of Shit — NoRobots");
  });

  it("sets og:type to article", () => {
    const meta = articleMetadata(article, site);
    expect(meta.openGraph).toMatchObject({ type: "article" });
  });

  it("composes og:url from site.url + urlPrefix + path", () => {
    const meta = articleMetadata(article, site);
    expect(meta.openGraph?.url).toBe(
      "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    );
  });

  it("prefers article.canonicalUrl when present", () => {
    const meta = articleMetadata(
      { ...article, canonicalUrl: "https://norobots.blog/custom" },
      site,
    );
    expect(meta.openGraph?.url).toBe("https://norobots.blog/custom");
  });

  it("includes og:image when coverImageUrl present", () => {
    const meta = articleMetadata(article, site);
    expect(meta.openGraph?.images).toContain(
      "https://norobots.blog/images/llms.webp",
    );
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to summary card when no coverImageUrl", () => {
    const meta = articleMetadata({ ...article, coverImageUrl: undefined }, site);
    expect(meta.twitter).toMatchObject({ card: "summary" });
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it("omits description when absent", () => {
    const meta = articleMetadata({ ...article, description: undefined }, site);
    expect(meta.description).toBeUndefined();
    expect(meta.openGraph?.description).toBeUndefined();
  });

  it("sets alternates.canonical to the composed canonical url", () => {
    const meta = articleMetadata(article, site);
    expect(meta.alternates).toEqual({
      canonical: "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    });
  });
});

describe("generateArticleJsonLd / generateSiteJsonLd re-exports", () => {
  it("re-exports a working generateArticleJsonLd from @skyscribe-sdk/core", () => {
    const jsonLd = generateArticleJsonLd(article, site);
    expect(jsonLd).toMatchObject({ "@type": "BlogPosting", headline: article.title });
  });

  it("re-exports a working generateSiteJsonLd from @skyscribe-sdk/core", () => {
    const jsonLd = generateSiteJsonLd(site);
    expect(jsonLd).toMatchObject({ "@type": "WebSite", name: site.title });
  });
});

describe("siteMetadata", () => {
  it("returns site title", () => {
    const meta = siteMetadata(site);
    expect(meta.title).toBe("NoRobots");
  });

  it("sets og:type to website", () => {
    const meta = siteMetadata(site);
    expect(meta.openGraph).toMatchObject({ type: "website" });
  });

  it("composes og:url from url + urlPrefix", () => {
    const meta = siteMetadata(site);
    expect(meta.openGraph?.url).toBe("https://norobots.blog/blog");
  });

  it("handles missing urlPrefix", () => {
    const meta = siteMetadata({ ...site, urlPrefix: "" });
    expect(meta.openGraph?.url).toBe("https://norobots.blog");
  });

  it("includes og:image when splashImageUrl present", () => {
    const meta = siteMetadata(site);
    expect(meta.openGraph?.images).toContain(
      "https://norobots.blog/images/splash.webp",
    );
  });

  it("sets alternates.canonical to the composed site url", () => {
    const meta = siteMetadata(site);
    expect(meta.alternates).toEqual({ canonical: "https://norobots.blog/blog" });
  });
});
