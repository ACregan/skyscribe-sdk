import { describe, it, expect } from "vitest";
import { generateFeed } from "./feed.js";
import type { StandardPublication } from "./types.js";

const mockSite: StandardPublication = {
  uri: "at://did:plc:abc/site.standard.publication/norobotspubkey",
  name: "Test Blog",
  domain: "norobots.blog",
  basePath: "blog",
  description: "A test blog about things",
  categories: [
    {
      slug: "essays",
      title: "Essays",
      documents: [
        {
          uri: "at://did:plc:abc/site.standard.document/first-post",
          title: "First Post",
          slug: "first-post",
          coverImageUrl: "https://norobots.blog/splash.jpg",
          description: "This is the first post synopsis",
          createdAt: "2024-01-01T00:00:00Z",
          publishedAt: "2024-01-01T12:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/site.standard.document/second-post",
          title: "Second Post",
          slug: "second-post",
          coverImageUrl: null,
          createdAt: "2024-02-01T00:00:00Z",
          publishedAt: "2024-02-01T12:00:00Z",
          updatedAt: "2024-02-02T00:00:00Z",
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
          description: "A short note",
          createdAt: "2024-03-01T00:00:00Z",
          publishedAt: "2024-03-01T12:00:00Z",
          updatedAt: "2024-03-02T00:00:00Z",
        },
        {
          uri: "at://did:plc:abc/site.standard.document/note-two",
          title: "Note Two",
          slug: "note-two",
          coverImageUrl: null,
          createdAt: "2024-04-01T00:00:00Z",
          publishedAt: "2024-04-01T12:00:00Z",
        },
      ],
    },
  ],
};

describe("generateFeed", () => {
  it("returns a string with a valid XML preamble", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it("includes correct channel title", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<![CDATA[Test Blog]]>");
  });

  it("uses site description when present", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<![CDATA[A test blog about things]]>");
  });

  it("falls back to site title when description is absent", () => {
    const siteNoDesc: StandardPublication = { ...mockSite, description: undefined };
    const feed = generateFeed(siteNoDesc, { baseUrl: "https://norobots.blog" });
    // title appears in channel <title> and <description>
    const cdataOccurrences = feed.match(/<!\[CDATA\[Test Blog\]\]>/g);
    expect(cdataOccurrences).not.toBeNull();
    expect(cdataOccurrences!.length).toBeGreaterThanOrEqual(2);
  });

  it("includes correct channel link with basePath", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<link>https://norobots.blog/blog</link>");
  });

  it("includes correct channel link without basePath", () => {
    const siteNoPrefix: StandardPublication = { ...mockSite, basePath: "" };
    const feed = generateFeed(siteNoPrefix, {
      baseUrl: "https://norobots.blog",
    });
    expect(feed).toContain("<link>https://norobots.blog</link>");
  });

  it("includes all 4 articles from groups", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    const itemCount = (feed.match(/<item>/g) ?? []).length;
    expect(itemCount).toBe(4);
  });

  it("constructs correct article URLs with basePath", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("https://norobots.blog/blog/essays/first-post");
    expect(feed).toContain("https://norobots.blog/blog/notes/note-one");
  });

  it("constructs correct article URLs without basePath", () => {
    const siteNoPrefix: StandardPublication = { ...mockSite, basePath: "" };
    const feed = generateFeed(siteNoPrefix, {
      baseUrl: "https://norobots.blog",
    });
    expect(feed).toContain("https://norobots.blog/essays/first-post");
    expect(feed).toContain("https://norobots.blog/notes/note-two");
  });

  it("caps items when limit option is provided", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      limit: 2,
    });
    const itemCount = (feed.match(/<item>/g) ?? []).length;
    expect(itemCount).toBe(2);
  });

  it("includes atom:link when feedUrl is provided", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      feedUrl: "https://norobots.blog/feed.xml",
    });
    expect(feed).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(feed).toContain(
      '<atom:link href="https://norobots.blog/feed.xml" rel="self" type="application/rss+xml"/>'
    );
  });

  it("does not include atom namespace when feedUrl is absent", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).not.toContain("xmlns:atom");
    expect(feed).not.toContain("atom:link");
  });


  it("uses empty string for description when absent", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    // second-post has no synopsis
    expect(feed).toContain("<description><![CDATA[]]></description>");
  });

  it("uses the language option when provided", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      language: "fr",
    });
    expect(feed).toContain("<language>fr</language>");
  });

  it("defaults language to 'en'", () => {
    const feed = generateFeed(mockSite, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<language>en</language>");
  });
});

describe("generateFeed XML escaping", () => {
  it("escapes XML-significant characters in the atom:link feedUrl", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      feedUrl: "https://norobots.blog/feed.xml?tag=news&category=\"top\"",
    });
    expect(feed).toContain(
      '<atom:link href="https://norobots.blog/feed.xml?tag=news&amp;category=&quot;top&quot;" rel="self" type="application/rss+xml"/>',
    );
    expect(feed).not.toContain('category="top"');
  });

  it("escapes XML-significant characters in the language option", () => {
    const feed = generateFeed(mockSite, {
      baseUrl: "https://norobots.blog",
      language: "en & <fr>",
    });
    expect(feed).toContain("<language>en &amp; &lt;fr&gt;</language>");
  });

  it("wraps titles containing markup in CDATA rather than escaping them", () => {
    const site: StandardPublication = { ...mockSite, name: `A "quoted" <Title> & More` };
    const feed = generateFeed(site, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain(`<![CDATA[A "quoted" <Title> & More]]>`);
  });

  it("wraps article descriptions containing markup in CDATA rather than escaping them", () => {
    const site: StandardPublication = {
      ...mockSite,
      categories: [
        {
          slug: "essays",
          title: "Essays",
          documents: [
            {
              ...mockSite.categories[0].documents[0],
              description: `Uses <b>bold</b> & "quotes"`,
            },
          ],
        },
      ],
    };
    const feed = generateFeed(site, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain(`<description><![CDATA[Uses <b>bold</b> & "quotes"]]></description>`);
  });

  // Not fixed as part of this test-coverage pass — flagging as a discovered
  // latent bug. XML's CDATA sections cannot contain the literal sequence
  // "]]>": if it appears verbatim, it closes the CDATA section early,
  // producing a malformed feed. An article title/description containing
  // that exact sequence (unlikely, but not impossible from pasted content)
  // would corrupt the generated XML. cdata() has no handling for it.
  it("[known gap] does not escape a literal ']]>' inside CDATA content, which would truncate the CDATA section", () => {
    const site: StandardPublication = { ...mockSite, name: "Weird title ]]> more text" };
    const feed = generateFeed(site, { baseUrl: "https://norobots.blog" });
    expect(feed).toContain("<![CDATA[Weird title ]]> more text]]>");
  });
});
