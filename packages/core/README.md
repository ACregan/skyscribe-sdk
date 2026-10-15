# @skyscribe-sdk/core

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/core)](https://www.npmjs.com/package/@skyscribe-sdk/core)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Framework-agnostic TypeScript functions for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. No runtime dependencies.

This is the foundation of the SkyScribe SDK — all framework adapters (`@skyscribe-sdk/react`, `@skyscribe-sdk/angular`, etc.) build on top of it.

## Installation

```bash
npm install @skyscribe-sdk/core
```

## Usage

### Fetch a site

A *site* is an author's publication — it contains their article groups, metadata, and splash image.

```ts
import { fetchSite } from "@skyscribe-sdk/core";

const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

console.log(site.title);
console.log(site.groups);            // published article groups
console.log(site.ungroupedArticles); // unpublished / draft articles
console.log(site.urlPrefix);         // path prefix, e.g. "blog" — may be empty
```

### Fetch an article by slug

`fetchArticleBySlug` resolves an article within a known publication. It fetches the site first (using the cache if available), locates the article ref by slug, then fetches the full article record. Returns the article and its AT URI together — the URI is needed for social interactions.

```ts
import { fetchArticleBySlug } from "@skyscribe-sdk/core";

const { article, uri } = await fetchArticleBySlug(
  "alice.bsky.social",
  "https://alice.bsky.social",
  "my-first-post"
);

console.log(article.title);
console.log(article.content);      // full HTML string
console.log(article.description);  // short summary for cards and meta tags
console.log(uri);                   // AT URI — "at://did:plc:.../site.standard.document/3abc..."
```

Use this when rendering an article page. Pass `uri` to `@skyscribe-sdk/social`'s `LikeButton`.

### Fetch an article directly

If you already have an `ArticleRef`, `fetchArticle` skips the site lookup. It takes the article's account and record key (rkey), both in `ref.uri`. Don't pass it a slug: current articles have opaque rkeys.

```ts
import { fetchArticle, slugFromUri } from "@skyscribe-sdk/core";

const article = await fetchArticle(ref.uri.split("/")[2], slugFromUri(ref.uri));

console.log(article.title);
console.log(article.content);
```

### List all sites

When you need to discover every site an author has published — for example, to build a browser or reader interface — use `listSites`:

```ts
import { listSites, slugFromUri } from "@skyscribe-sdk/core";

const sites = await listSites("alice.bsky.social");

for (const site of sites) {
  const siteRkey = slugFromUri(site.uri); // the record key (a TID), e.g. "3mp4nd46xwr2h"
  console.log(site.title, site.groups);
}
```

### List all articles

`listArticles` returns lightweight `ArticleRef` objects for every article in the author's repository, regardless of publication state:

```ts
import { listSites, listArticles } from "@skyscribe-sdk/core";

const [sites, articles] = await Promise.all([
  listSites("alice.bsky.social"),
  listArticles("alice.bsky.social"),
]);

// derive which articles are drafts (not referenced in any site record)
const referencedUris = new Set(
  sites.flatMap((s) => [
    ...s.groups.flatMap((g) => g.articles),
    ...s.ungroupedArticles,
  ]).map((a) => a.uri)
);

const drafts = articles.filter((a) => !referencedUris.has(a.uri));
```

Both functions handle cursor-based pagination automatically and accept an optional `AbortSignal`.

### AbortSignal

All fetch functions accept an optional `AbortSignal` as their final argument:

```ts
const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social", request.signal);
```

### Utilities

```ts
import { slugFromUri, flattenArticles } from "@skyscribe-sdk/core";

slugFromUri("at://did:plc:abc/site.standard.document/3mp4hfovqib2h"); // → "3mp4hfovqib2h"

flattenArticles(site.groups); // → ArticleRef[] across all groups
```

### Embeds

SkyScribe stores videos, music, code pens, Bluesky posts and link cards in an article's HTML as links marked with their kind (`<figure data-embed="youtube"><a href="…">…</a></figure>`). `renderEmbeds` turns them into players: lazy iframes built only from the parts of each link that match its provider's pattern. Anything else is left as it is.

```ts
import { renderEmbeds, listenForEmbedResize, EMBED_FRAME_HOSTS } from "@skyscribe-sdk/core";

const html = renderEmbeds(article.content);

// In the browser, so Bluesky posts grow to their real height:
const stop = listenForEmbedResize(window);
```

Kinds: link card, Bluesky post, YouTube, Spotify, Bandcamp, Vimeo, CodePen, SoundCloud. If your site sends a Content-Security-Policy, allow `EMBED_FRAME_HOSTS` in `frame-src`. `ScribeContent` from `@skyscribe-sdk/react` does all of this for you.

### Feed & Sitemap

Generate an RSS 2.0 feed or an XML sitemap from a fetched `Site` object. Both functions are pure — they produce a string and make no network requests.

#### RSS feed

```ts
import { fetchSite, generateFeed } from "@skyscribe-sdk/core";

const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

const xml = generateFeed(site, {
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

Only published articles (from `site.groups`) are included. Draft articles in `site.ungroupedArticles` are excluded.

#### Sitemap entries

`getSitemapEntries` returns structured data — not XML — so you can merge Scribe URLs into your own framework's sitemap generator alongside non-Scribe pages (portfolio, contact, etc.).

```ts
import { fetchSite, getSitemapEntries } from "@skyscribe-sdk/core";

const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

const entries = getSitemapEntries(site, {
  baseUrl: "https://alice.bsky.social",
});
// [
//   { url: "https://alice.bsky.social" },
//   { url: "https://alice.bsky.social/blog" },
//   { url: "https://alice.bsky.social/blog/essays/first-post", lastmod: "2024-01-15" },
//   ...
// ]
```

Each entry is `{ url: string, lastmod?: string }`. Merge with your own routes and pass to your framework's sitemap generator. Article entries include `lastmod` when `updatedAt` is available. Draft articles in `site.ungroupedArticles` are excluded.

### Open Graph and Twitter Card meta tags

`generateArticleMeta` and `generateSiteMeta` produce Open Graph and Twitter Card meta tags for an article or site page. These are the tags that drive rich link previews when sharing URLs on Bluesky, Twitter/X, Slack, and other platforms.

The output is a `ScribeMetaTag[]` array — a framework-neutral format. Use a framework adapter (e.g. `@skyscribe-sdk/react-router-framework`) to convert this to your framework's meta format, or consume it directly:

```ts
import { fetchArticleBySlug, fetchSite, generateArticleMeta, generateSiteMeta } from "@skyscribe-sdk/core";

const { article } = await fetchArticleBySlug("alice.bsky.social", "https://alice.bsky.social", "my-post");
const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");

const articleTags = generateArticleMeta(article, site);
// [
//   { title: "My Post — Alice's Blog" },
//   { property: "og:type", content: "article" },
//   { property: "og:title", content: "My Post" },
//   { property: "og:url", content: "https://alice.bsky.social/blog/my-post" },
//   { property: "og:site_name", content: "Alice's Blog" },
//   { property: "og:description", content: "..." },
//   { name: "twitter:card", content: "summary_large_image" },
//   ...
// ]

const siteTags = generateSiteMeta(site);
// tags for a blog index or home page
```

`buildCanonicalUrl` is also exported — it derives the full article URL from `article.canonicalUrl` (if set) or by combining `article.site`, `site.urlPrefix`, and `article.path`:

```ts
import { buildCanonicalUrl } from "@skyscribe-sdk/core";

const url = buildCanonicalUrl(article, site);
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

## TypeScript types

```ts
import type {
  Site,
  SiteRecord,
  Article,
  ArticleRef,
  ArticleResult,
  ArticleContributor,
  SiteGroup,
  ScribeMetaTag,
  CrossPostParams,
  StrongRef,
} from "@skyscribe-sdk/core";
```

| Type | Description |
| ---- | ----------- |
| `Site` | An author's full publication. |
| `SiteRecord` | A `Site` with a `uri` field — the AT URI of the record. Returned by `listSites`. |
| `Article` | A single article with full HTML content. |
| `ArticleResult` | `{ article: Article; uri: string }` — returned by `fetchArticleBySlug`. |
| `ArticleContributor` | `{ did: string; role?: string; displayName?: string }` — contributor metadata on an article. |
| `SiteGroup` | A named group of articles within a site. |
| `ArticleRef` | Lightweight article snapshot for rendering lists without N+1 fetches. |
| `ScribeMetaTag` | Union of `{ title }`, `{ name, content }`, and `{ property, content }` — the output of `generateArticleMeta` / `generateSiteMeta`. |
| `CrossPostParams` | Parameters for `crossPostToBluesky` — document/publication refs, canonical URL, title, text, and optional description/thumb. |
| `StrongRef` | `{ uri: string; cid: string }` — an AT Protocol strong reference. Returned by `crossPostToBluesky`. |

## How it works

Scribe content is stored on the AT Protocol. Each author's articles live on their own Personal Data Server (PDS), which may be hosted anywhere. This package resolves the correct PDS for each author automatically — handling both `did:plc` and `did:web` identities — and caches DID document lookups in memory for the lifetime of the module.

`fetchSite` also caches each resolved publication's AT URI for 60 seconds to avoid a `listRecords` call on every request. If a cached URI stops resolving — for example, the `site.standard.publication` record was deleted and a new one created for the same domain — `fetchSite` automatically falls back to a fresh lookup instead of failing, so long-running server processes self-heal without needing a restart.

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
