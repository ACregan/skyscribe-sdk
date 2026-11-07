import { describe, it, expect } from "vitest";
import {
  generateDocumentMeta,
  generatePublicationMeta,
  generateDocumentJsonLd,
  generatePublicationJsonLd,
  standardSiteLinks,
} from "./meta.js";
import type { StandardDocument, StandardPublication } from "./types.js";

const site: StandardPublication = {
  uri: "at://did:plc:abc/site.standard.publication/tid123",
  name: "NoRobots",
  domain: "norobots.blog",
  basePath: "blog",
  description: "A blog about engineering and design.",
  splashImageUrl: "https://norobots.blog/images/splash.webp",
  logoImageUrl: "https://norobots.blog/images/logo.webp",
  categories: [],
};

const article: StandardDocument = {
  uri: "at://did:plc:abc/site.standard.document/doc123",
  title: "LLMs Are Full of Shit",
  content: "<p>Content</p>",
  path: "/engineering/llms-are-full-of-shit",
  site: "at://did:plc:abc/site.standard.publication/tid123",
  coverImageUrl: "https://norobots.blog/images/llms.webp",
  description: "A post about LLMs.",
  createdAt: "2025-01-01T00:00:00.000Z",
  publishedAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("generateDocumentMeta", () => {
  it("uses the SEO title and description in the head when set", () => {
    const tags = generateDocumentMeta(
      { ...article, seo: { title: "LLMs, Honestly", description: "Why LLMs bluff." } },
      site,
    );
    expect(tags).toContainEqual({ title: "LLMs, Honestly — NoRobots" });
    expect(tags).toContainEqual({ property: "og:title", content: "LLMs, Honestly" });
    expect(tags).toContainEqual({ name: "twitter:title", content: "LLMs, Honestly" });
    expect(tags).toContainEqual({ name: "description", content: "Why LLMs bluff." });
    expect(tags).toContainEqual({ property: "og:description", content: "Why LLMs bluff." });
    expect(tags).toContainEqual({ name: "twitter:description", content: "Why LLMs bluff." });
    // The JSON-LD headline keeps the article's own title.
    const ld = tags.find((t) => "script:ld+json" in t) as { "script:ld+json": { headline: string } };
    expect(ld["script:ld+json"].headline).toBe("LLMs Are Full of Shit");
  });

  it("adds robots noindex only when the SEO Settings ask for it", () => {
    expect(generateDocumentMeta(article, site)).not.toContainEqual({ name: "robots", content: "noindex" });
    expect(generateDocumentMeta({ ...article, seo: { noindex: true } }, site)).toContainEqual({
      name: "robots",
      content: "noindex",
    });
  });

  it("includes title tag combining article and site titles", () => {
    const tags = generateDocumentMeta(article, site);
    expect(tags).toContainEqual({ title: "LLMs Are Full of Shit — NoRobots" });
  });

  it("composes canonical url from site.url + site.basePath + article.path", () => {
    const tags = generateDocumentMeta(article, site);
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    });
  });

  it("doesn't repeat the prefix when article.path already contains it", () => {
    // Publishing writes path with the base path included.
    const tags = generateDocumentMeta(
      { ...article, path: "/blog/engineering/llms-are-full-of-shit" },
      site,
    );
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    });
  });

  it("still adds the prefix when a path merely starts with the same letters", () => {
    const tags = generateDocumentMeta(
      { ...article, path: "/blogging/llms-are-full-of-shit" },
      site,
    );
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/blog/blogging/llms-are-full-of-shit",
    });
  });

  it("prefers article.canonicalUrl when present", () => {
    const tags = generateDocumentMeta(
      { ...article, canonicalUrl: "https://norobots.blog/custom" },
      site,
    );
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/custom",
    });
  });

  it("handles missing basePath", () => {
    const tags = generateDocumentMeta(article, { ...site, basePath: "" });
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/engineering/llms-are-full-of-shit",
    });
  });

  it("includes og:image and twitter:image when coverImageUrl present", () => {
    const tags = generateDocumentMeta(article, site);
    expect(tags).toContainEqual({
      property: "og:image",
      content: "https://norobots.blog/images/llms.webp",
    });
    expect(tags).toContainEqual({
      name: "twitter:image",
      content: "https://norobots.blog/images/llms.webp",
    });
    expect(tags).toContainEqual({
      name: "twitter:card",
      content: "summary_large_image",
    });
  });

  it("falls back to summary card when no coverImageUrl", () => {
    const tags = generateDocumentMeta(
      { ...article, coverImageUrl: undefined },
      site,
    );
    expect(tags).toContainEqual({ name: "twitter:card", content: "summary" });
    expect(tags).not.toContainEqual(
      expect.objectContaining({ property: "og:image" }),
    );
  });

  it("omits description tags when description is absent", () => {
    const tags = generateDocumentMeta(
      { ...article, description: undefined },
      site,
    );
    expect(tags).not.toContainEqual(
      expect.objectContaining({ name: "description" }),
    );
  });

  it("sets og:type to article", () => {
    const tags = generateDocumentMeta(article, site);
    expect(tags).toContainEqual({ property: "og:type", content: "article" });
  });

  it("includes a canonical link tag matching the composed canonical url", () => {
    const tags = generateDocumentMeta(article, site);
    expect(tags).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    });
  });

  it("includes a script:ld+json tag matching generateDocumentJsonLd's output", () => {
    const tags = generateDocumentMeta(article, site);
    expect(tags).toContainEqual({
      "script:ld+json": generateDocumentJsonLd(article, site),
    });
  });
});

describe("generateDocumentJsonLd", () => {
  it("produces a BlogPosting schema with the article's core fields", () => {
    const jsonLd = generateDocumentJsonLd(article, site);
    expect(jsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "LLMs Are Full of Shit",
      datePublished: "2025-01-01T00:00:00.000Z",
      dateModified: "2025-01-01T00:00:00.000Z",
      description: "A post about LLMs.",
      image: "https://norobots.blog/images/llms.webp",
    });
  });

  it("sets mainEntityOfPage to the article's canonical url", () => {
    const jsonLd = generateDocumentJsonLd(article, site);
    expect(jsonLd.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://norobots.blog/blog/engineering/llms-are-full-of-shit",
    });
  });

  it("falls back to the site title as author when no contributor is present", () => {
    const jsonLd = generateDocumentJsonLd(article, site);
    expect(jsonLd.author).toEqual({ "@type": "Person", name: "NoRobots" });
  });

  it("uses the first contributor's displayName as author when present", () => {
    const jsonLd = generateDocumentJsonLd(
      {
        ...article,
        contributors: [{ did: "did:plc:xyz", displayName: "Alice Author" }],
      },
      site,
    );
    expect(jsonLd.author).toEqual({ "@type": "Person", name: "Alice Author" });
  });

  it("includes publisher logo when the site has one", () => {
    const jsonLd = generateDocumentJsonLd(article, site);
    expect(jsonLd.publisher).toEqual({
      "@type": "Organization",
      name: "NoRobots",
      logo: { "@type": "ImageObject", url: "https://norobots.blog/images/logo.webp" },
    });
  });

  it("omits publisher logo when the site has none", () => {
    const jsonLd = generateDocumentJsonLd(article, { ...site, logoImageUrl: undefined });
    expect(jsonLd.publisher).toEqual({
      "@type": "Organization",
      name: "NoRobots",
    });
  });

  it("joins tags into a keywords string when present", () => {
    const jsonLd = generateDocumentJsonLd(
      { ...article, tags: ["ai", "engineering"] },
      site,
    );
    expect(jsonLd.keywords).toBe("ai, engineering");
  });

  it("omits keywords, description, and image when absent", () => {
    const jsonLd = generateDocumentJsonLd(
      { ...article, tags: undefined, description: undefined, coverImageUrl: undefined },
      site,
    );
    expect(jsonLd.keywords).toBeUndefined();
    expect(jsonLd.description).toBeUndefined();
    expect(jsonLd.image).toBeUndefined();
  });
});

describe("generatePublicationMeta", () => {
  it("includes site title as title tag", () => {
    const tags = generatePublicationMeta(site);
    expect(tags).toContainEqual({ title: "NoRobots" });
  });

  it("composes site url from url + basePath", () => {
    const tags = generatePublicationMeta(site);
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog/blog",
    });
  });

  it("handles missing basePath", () => {
    const tags = generatePublicationMeta({ ...site, basePath: "" });
    expect(tags).toContainEqual({
      property: "og:url",
      content: "https://norobots.blog",
    });
  });

  it("sets og:type to website", () => {
    const tags = generatePublicationMeta(site);
    expect(tags).toContainEqual({ property: "og:type", content: "website" });
  });

  it("includes og:image when splashImageUrl present", () => {
    const tags = generatePublicationMeta(site);
    expect(tags).toContainEqual({
      property: "og:image",
      content: "https://norobots.blog/images/splash.webp",
    });
  });

  it("includes a canonical link tag matching the composed site url", () => {
    const tags = generatePublicationMeta(site);
    expect(tags).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: "https://norobots.blog/blog",
    });
  });

  it("includes a script:ld+json tag matching generatePublicationJsonLd's output", () => {
    const tags = generatePublicationMeta(site);
    expect(tags).toContainEqual({ "script:ld+json": generatePublicationJsonLd(site) });
  });
});

describe("generatePublicationJsonLd", () => {
  it("produces a WebSite schema with the site's core fields", () => {
    const jsonLd = generatePublicationJsonLd(site);
    expect(jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "NoRobots",
      url: "https://norobots.blog/blog",
      description: "A blog about engineering and design.",
    });
  });

  it("omits description when the site has none", () => {
    const jsonLd = generatePublicationJsonLd({ ...site, description: undefined });
    expect(jsonLd.description).toBeUndefined();
  });
});

describe("standard.site link tags", () => {
  const publicationLink = {
    tagName: "link",
    rel: "site.standard.publication",
    href: "at://did:plc:abc/site.standard.publication/tid123",
  };
  const documentLink = {
    tagName: "link",
    rel: "site.standard.document",
    href: "at://did:plc:abc/site.standard.document/doc123",
  };

  it("standardSiteLinks names the Publication, and the Document when given one", () => {
    expect(standardSiteLinks(site)).toEqual([publicationLink]);
    expect(standardSiteLinks(site, article)).toEqual([publicationLink, documentLink]);
  });

  it("generateDocumentMeta includes both link tags", () => {
    const tags = generateDocumentMeta(article, site);
    expect(tags).toContainEqual(publicationLink);
    expect(tags).toContainEqual(documentLink);
  });

  it("generatePublicationMeta includes the Publication link tag only", () => {
    const tags = generatePublicationMeta(site);
    expect(tags).toContainEqual(publicationLink);
    expect(tags).not.toContainEqual(documentLink);
  });
});
