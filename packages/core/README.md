# @skyscribe-sdk/core

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/core)](https://www.npmjs.com/package/@skyscribe-sdk/core)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Framework-agnostic TypeScript functions for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. No runtime dependencies.

It uses the [site.standard](https://standard.site) names: a **Publication** (`site.standard.publication`) holds **Categories**, which hold **Documents** (`site.standard.document`). Upgrading from 4.x? See [Upgrading to 5.0](https://sdk.skyscribe.app/upgrading-to-5); upgrade every `@skyscribe-sdk` package together.

This is the foundation of the SkyScribe SDK — all framework adapters (`@skyscribe-sdk/react`, `@skyscribe-sdk/angular`, etc.) build on top of it.

## Installation

```bash
npm install @skyscribe-sdk/core
```

## Usage

### Fetch a Publication

A Publication holds an author's Documents, arranged in Categories, plus its metadata and images.

```ts
import { fetchPublication } from "@skyscribe-sdk/core";

const publication = await fetchPublication("alice.bsky.social", "https://alice.bsky.social");

console.log(publication.name);
console.log(publication.categories); // the Categories, each with its published Documents
console.log(publication.domain);     // bare domain, e.g. "alice.bsky.social"
console.log(publication.basePath);   // path prefix, e.g. "blog" — may be empty
```

### Fetch a Document by slug

`fetchDocumentBySlug` resolves a Document within a known Publication. It fetches the Publication first (using the cache if available), finds the Document's ref by slug, then fetches the full record. The Document carries its own AT URI as `uri`, which the social buttons need.

```ts
import { fetchDocumentBySlug } from "@skyscribe-sdk/core";

const document = await fetchDocumentBySlug(
  "alice.bsky.social",
  "https://alice.bsky.social",
  "my-first-post"
);

console.log(document.title);
console.log(document.content);      // full HTML string
console.log(document.description);  // short summary for cards and meta tags
console.log(document.uri);          // AT URI — "at://did:plc:.../site.standard.document/3abc..."
```

Use this when rendering a Document page. Pass `document.uri` to `@skyscribe-sdk/social`'s `LikeButton`.

### Fetch a Document directly

If you already have a `DocumentRef`, `fetchDocument` skips the Publication lookup. It takes the Document's account and record key (rkey), both in `ref.uri`. Don't pass it a slug: current Documents have opaque rkeys.

```ts
import { fetchDocument, slugFromUri } from "@skyscribe-sdk/core";

const document = await fetchDocument(ref.uri.split("/")[2], slugFromUri(ref.uri));

console.log(document.title);
console.log(document.content);
```

### List all Publications

When you need to discover every Publication an author has — for example, to build a browser or reader interface — use `listPublications`:

```ts
import { listPublications, slugFromUri } from "@skyscribe-sdk/core";

const publications = await listPublications("alice.bsky.social");

for (const publication of publications) {
  const rkey = slugFromUri(publication.uri); // the record key (a TID), e.g. "3mp4nd46xwr2h"
  console.log(publication.name, publication.categories);
}
```

### List all Documents

`listDocuments` returns lightweight `DocumentRef` objects for every Document in the author's repository, regardless of publication state:

```ts
import { listPublications, listDocuments } from "@skyscribe-sdk/core";

const [publications, documents] = await Promise.all([
  listPublications("alice.bsky.social"),
  listDocuments("alice.bsky.social"),
]);

// derive which documents are drafts (not referenced in any publication record)
const referencedUris = new Set(
  publications.flatMap((p) => p.categories.flatMap((c) => c.documents)).map((d) => d.uri)
);

const drafts = documents.filter((d) => !referencedUris.has(d.uri));
```

Both functions handle cursor-based pagination automatically and accept an optional `AbortSignal`.

### AbortSignal

All fetch functions accept an optional `AbortSignal` as their final argument:

```ts
const publication = await fetchPublication("alice.bsky.social", "https://alice.bsky.social", request.signal);
```

### Utilities

```ts
import { slugFromUri, flattenDocuments } from "@skyscribe-sdk/core";

slugFromUri("at://did:plc:abc/site.standard.document/3mp4hfovqib2h"); // → "3mp4hfovqib2h"

flattenDocuments(publication.categories); // → DocumentRef[] across all Categories
```

### Embeds

SkyScribe stores videos, music, code pens, Bluesky posts and link cards in a Document's HTML as links marked with their kind (`<figure data-embed="youtube"><a href="…">…</a></figure>`). `renderEmbeds` turns videos, music and pens into Posters (thumbnail, title, Play) that load their player only when clicked, and Bluesky posts into their player. Players are built only from the parts of each link that match its provider's pattern; anything else is left as it is.

```ts
import { renderEmbeds, enhanceEmbeds, EMBED_FRAME_HOSTS } from "@skyscribe-sdk/core";

const html = renderEmbeds(document.content); // or { clickToLoad: false } for players straight away

// Once, in the browser: Posters load their player on click, Bluesky posts grow to fit.
const stop = enhanceEmbeds(window);
```

Kinds: link card, Bluesky post, YouTube, Spotify, Bandcamp, Vimeo, CodePen, SoundCloud. If your site sends a Content-Security-Policy, allow `EMBED_FRAME_HOSTS` in `frame-src` and `https:` in `img-src`. `ScribeContent` from `@skyscribe-sdk/react` does all of this for you.

### Feed & Sitemap

Generate an RSS 2.0 feed or an XML sitemap from a fetched `StandardPublication` object. Both functions are pure — they produce a string and make no network requests.

#### RSS feed

```ts
import { fetchPublication, generateFeed } from "@skyscribe-sdk/core";

const publication = await fetchPublication("alice.bsky.social", "https://alice.bsky.social");

const xml = generateFeed(publication, {
  baseUrl: "https://alice.bsky.social",
  feedUrl: "https://alice.bsky.social/feed.xml", // adds <atom:link rel="self">
  language: "en",  // defaults to "en"
  limit: 20,       // cap items; omit to include all
});

// In a server handler:
return new Response(xml, {
  headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
});
```

Only published Documents (in `publication.categories`) are included; drafts aren't in the Publication record.

#### Sitemap entries

`getSitemapEntries` returns structured data — not XML — so you can merge Scribe URLs into your own framework's sitemap generator alongside non-Scribe pages (portfolio, contact, etc.). Documents marked `canonicalElsewhere` (imported into SkyScribe with the original kept as canonical) are left out, so search engines index the original. Documents whose author turned on noindex in their SEO Settings (`noindex`) are left out too.

```ts
import { fetchPublication, getSitemapEntries } from "@skyscribe-sdk/core";

const publication = await fetchPublication("alice.bsky.social", "https://alice.bsky.social");

const entries = getSitemapEntries(publication, {
  baseUrl: "https://alice.bsky.social",
});
// [
//   { url: "https://alice.bsky.social" },
//   { url: "https://alice.bsky.social/blog" },
//   { url: "https://alice.bsky.social/blog/essays/first-post", lastmod: "2024-01-15" },
//   ...
// ]
```

Each entry is `{ url: string, lastmod?: string }`. Merge with your own routes and pass to your framework's sitemap generator. Document entries include `lastmod` when `updatedAt` is available. Drafts are never included.

### Open Graph and Twitter Card meta tags

`generateDocumentMeta` and `generatePublicationMeta` produce Open Graph and Twitter Card meta tags, plus the `site.standard.publication` / `site.standard.document` link tags Bluesky needs for its Standard.site link card, for a Document or Publication page. These are the tags that drive rich link previews when sharing URLs on Bluesky, Twitter/X, Slack, and other platforms.

The output is a `ScribeMetaTag[]` array — a framework-neutral format. Use a framework adapter (e.g. `@skyscribe-sdk/react-router-framework`) to convert this to your framework's meta format, or consume it directly:

```ts
import { fetchDocumentBySlug, fetchPublication, generateDocumentMeta, generatePublicationMeta, standardSiteLinks } from "@skyscribe-sdk/core";

const document = await fetchDocumentBySlug("alice.bsky.social", "https://alice.bsky.social", "my-post");
const publication = await fetchPublication("alice.bsky.social", "https://alice.bsky.social");

const documentTags = generateDocumentMeta(document, publication);
// [
//   { title: "My Post — Alice's Blog" },
//   { tagName: "link", rel: "site.standard.publication", href: "at://…" },
//   { tagName: "link", rel: "site.standard.document", href: "at://…" },
//   { property: "og:type", content: "article" },
//   { property: "og:title", content: "My Post" },
//   { property: "og:url", content: "https://alice.bsky.social/blog/my-post" },
//   { property: "og:site_name", content: "Alice's Blog" },
//   { property: "og:description", content: "..." },
//   { name: "twitter:card", content: "summary_large_image" },
//   ...
// ]

const publicationTags = generatePublicationMeta(publication);
// tags for the home page or a Category page

const links = standardSiteLinks(publication, document);
// just the two link tags, for pages that don't use the helpers above
```

If the author gave the Document SEO Settings in SkyScribe (`document.seo`), `generateDocumentMeta` uses its SEO title and description in the title and description tags and adds `robots: noindex` when asked. The JSON-LD `headline` keeps the Document's own title.

`buildCanonicalUrl` is also exported — it returns the full Document URL from `document.canonicalUrl` (if set) or by combining `publication.domain`, `publication.basePath`, and `document.path`:

```ts
import { buildCanonicalUrl } from "@skyscribe-sdk/core";

const url = buildCanonicalUrl(document, publication);
// → "https://alice.bsky.social/blog/my-first-post"
```

### Cross-posting to Bluesky

`crossPostToBluesky` creates an `app.bsky.feed.post` in the author's repository with an external embed that includes `associatedRefs` pointing to the `site.standard.document` and `site.standard.publication` records. This produces the rich Bluesky link card for standard.site content. It returns a `StrongRef` `{ uri, cid }` that should be written back to the `site.standard.document` record as `bskyPostRef`.

This function requires an authenticated AT Protocol agent — it is intended for CMS integrations, not consumer-facing reader apps.

```ts
import { crossPostToBluesky } from "@skyscribe-sdk/core";

const postRef = await crossPostToBluesky(agent, {
  did: "did:plc:abc123",                                          // authenticated author DID
  documentUri: "at://did:plc:abc123/site.standard.document/3tid",
  documentCid: "bafyreiabc...",
  publicationUri: "at://did:plc:abc123/site.standard.publication/3tid",
  publicationCid: "bafyreidef...",
  canonicalUrl: "https://alice.bsky.social/blog/my-post",
  title: "My Post",
  text: "My Post https://alice.bsky.social/blog/my-post",        // editable post message
  description: "A short summary.",                               // optional
  thumbBlob: uploadedBlobRef,                                    // optional — upload via agent.uploadBlob first
});

// postRef = { uri: "at://did:plc:abc123/app.bsky.feed.post/3abc", cid: "bafy..." }
// Write this as bskyPostRef on the site.standard.document record.
```

`agent` can be any object with a `com.atproto.repo.createRecord` method — the `Agent` from `@atproto/api` satisfies this automatically.

### Site Analytics

Cookie-free visit figures for your SDK-driven website, shown to the Publication's owner on its Insights tab in SkyScribe (free):

```ts
import { loadSiteAnalytics, siteAnalyticsScriptTag } from "@skyscribe-sdk/core";

loadSiteAnalytics();          // in the browser, once per page
siteAnalyticsScriptTag();     // or print this tag into server-rendered HTML
```

Figures appear once your website serves `/.well-known/site.standard.publication` with your Publication's AT URI. You're responsible for disclosing the analytics in your privacy policy. Guide: https://sdk.skyscribe.app/guides/site-analytics

## TypeScript types

```ts
import type {
  StandardPublication,
  StandardDocument,
  DocumentRef,
  DocumentContributor,
  Category,
  ScribeMetaTag,
  CrossPostParams,
  StrongRef,
} from "@skyscribe-sdk/core";
```

| Type | Description |
| ---- | ----------- |
| `StandardPublication` | A `site.standard.publication` record: `uri`, `name`, `domain`, `basePath`, images and `categories`. |
| `StandardDocument` | A `site.standard.document` record with full HTML content and its own `uri`. |
| `DocumentContributor` | `{ did: string; role?: string; displayName?: string }` — a credit on a Document. |
| `Category` | A named, ordered set of Documents within a Publication (a SkyScribe extension). |
| `DocumentRef` | Lightweight Document snapshot for rendering lists without N+1 fetches. |
| `ScribeMetaTag` | Union of `{ title }`, `{ name, content }`, `{ property, content }`, `{ tagName: "link", rel, href }` and `{ "script:ld+json" }` — the output of `generateDocumentMeta` / `generatePublicationMeta`. |
| `CrossPostParams` | Parameters for `crossPostToBluesky` — document/publication refs, canonical URL, title, text, and optional description/thumb. |
| `StrongRef` | `{ uri: string; cid: string }` — an AT Protocol strong reference. Returned by `crossPostToBluesky`. |

## How it works

SkyScribe content is stored on the AT Protocol. Each author's Documents live on their own Personal Data Server (PDS), which may be hosted anywhere. This package resolves the correct PDS for each author automatically — handling both `did:plc` and `did:web` identities — and caches DID document lookups in memory for the lifetime of the module.

`fetchPublication` also caches each resolved publication's AT URI for 60 seconds to avoid a `listRecords` call on every request. If a cached URI stops resolving — for example, the `site.standard.publication` record was deleted and a new one created for the same domain — `fetchPublication` automatically falls back to a fresh lookup instead of failing, so long-running server processes self-heal without needing a restart.

## Deprecated names

The 4.x names (`fetchSite`, `fetchArticle`, `fetchArticleBySlug`, `listSites`, `listArticles`, `Site`, `Article`, …) still work, marked `@deprecated`, until the next major. The renamed fields (`title` → `name`, `url` → `domain`, `urlPrefix` → `basePath`, `groups` → `categories`, `articles` → `documents`) have no alias.

## Framework adapters

| Package | Framework |
| ------- | --------- |
| [`@skyscribe-sdk/react`](https://www.npmjs.com/package/@skyscribe-sdk/react) | React 18+ hooks |
| [`@skyscribe-sdk/react-router-framework`](https://www.npmjs.com/package/@skyscribe-sdk/react-router-framework) | React Router v7 framework mode |
| [`@skyscribe-sdk/angular`](https://www.npmjs.com/package/@skyscribe-sdk/angular) | Angular 16+ |
| [`@skyscribe-sdk/next`](https://www.npmjs.com/package/@skyscribe-sdk/next) | Next.js 13+ App Router |
| [`@skyscribe-sdk/vue`](https://www.npmjs.com/package/@skyscribe-sdk/vue) | Vue 3 |
| [`@skyscribe-sdk/nuxt`](https://www.npmjs.com/package/@skyscribe-sdk/nuxt) | Nuxt 3 |
| [`@skyscribe-sdk/social`](https://www.npmjs.com/package/@skyscribe-sdk/social) | React Like and Subscribe buttons |

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)
