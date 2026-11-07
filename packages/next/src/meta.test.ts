import { describe, it, expect, vi } from "vitest";
import {
  documentMetadata,
  publicationMetadata,
  generateDocumentJsonLd,
  generatePublicationJsonLd,
} from "./meta.js";

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

describe("documentMetadata", () => {
  it("uses the SEO title and description and honours noindex", () => {
    const meta = documentMetadata(
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
    expect(documentMetadata(article, site).robots).toBeUndefined();
  });

  it("returns combined title", () => {
    const meta = documentMetadata(article, site);
    expect(meta.title).toBe("LLMs Are Full of Shit — NoRobots");
  });

  it("sets og:type to article", () => {
    const meta = documentMetadata(article, site);
    expect(meta.openGraph).toMatchObject({ type: "article" });
  });

  it("composes og:url from site.url + basePath + path", () => {
    const meta = documentMetadata(article, site);
    expect(meta.openGraph?.url).toBe(
      "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    );
  });

  it("prefers article.canonicalUrl when present", () => {
    const meta = documentMetadata(
      { ...article, canonicalUrl: "https://norobots.blog/custom" },
      site,
    );
    expect(meta.openGraph?.url).toBe("https://norobots.blog/custom");
  });

  it("includes og:image when coverImageUrl present", () => {
    const meta = documentMetadata(article, site);
    expect(meta.openGraph?.images).toContain(
      "https://norobots.blog/images/llms.webp",
    );
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to summary card when no coverImageUrl", () => {
    const meta = documentMetadata({ ...article, coverImageUrl: undefined }, site);
    expect(meta.twitter).toMatchObject({ card: "summary" });
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it("omits description when absent", () => {
    const meta = documentMetadata({ ...article, description: undefined }, site);
    expect(meta.description).toBeUndefined();
    expect(meta.openGraph?.description).toBeUndefined();
  });

  it("sets alternates.canonical to the composed canonical url", () => {
    const meta = documentMetadata(article, site);
    expect(meta.alternates).toEqual({
      canonical: "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    });
  });
});

describe("generateDocumentJsonLd / generatePublicationJsonLd re-exports", () => {
  it("re-exports a working generateDocumentJsonLd from @skyscribe-sdk/core", () => {
    const jsonLd = generateDocumentJsonLd(article, site);
    expect(jsonLd).toMatchObject({ "@type": "BlogPosting", headline: article.title });
  });

  it("re-exports a working generatePublicationJsonLd from @skyscribe-sdk/core", () => {
    const jsonLd = generatePublicationJsonLd(site);
    expect(jsonLd).toMatchObject({ "@type": "WebSite", name: site.name });
  });
});

describe("publicationMetadata", () => {
  it("returns site title", () => {
    const meta = publicationMetadata(site);
    expect(meta.title).toBe("NoRobots");
  });

  it("sets og:type to website", () => {
    const meta = publicationMetadata(site);
    expect(meta.openGraph).toMatchObject({ type: "website" });
  });

  it("composes og:url from url + basePath", () => {
    const meta = publicationMetadata(site);
    expect(meta.openGraph?.url).toBe("https://norobots.blog/blog");
  });

  it("handles missing basePath", () => {
    const meta = publicationMetadata({ ...site, basePath: "" });
    expect(meta.openGraph?.url).toBe("https://norobots.blog");
  });

  it("includes og:image when splashImageUrl present", () => {
    const meta = publicationMetadata(site);
    expect(meta.openGraph?.images).toContain(
      "https://norobots.blog/images/splash.webp",
    );
  });

  it("sets alternates.canonical to the composed site url", () => {
    const meta = publicationMetadata(site);
    expect(meta.alternates).toEqual({ canonical: "https://norobots.blog/blog" });
  });
});
