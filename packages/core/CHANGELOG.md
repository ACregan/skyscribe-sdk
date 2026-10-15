# @skyscribe-sdk/core

## 3.13.0

### Minor Changes

- `ArticleRef` gains an optional `canonicalElsewhere: true`, set by SkyScribe on an article imported from another app whose author kept the original as the canonical URL. `getSitemapEntries` leaves those articles out, so search engines index the original rather than your copy. Articles without the flag are unchanged.

## 3.12.0

### Minor Changes

- Embeds. SkyScribe Documents can now contain Embeds: videos, music, code pens, Bluesky posts and link cards. Each is stored as a link marked with its kind (`<figure data-embed="youtube"><a href="…">…</a></figure>`), so anything that doesn't know about Embeds still shows a working link.

  - `@skyscribe-sdk/core`: `renderEmbeds(html)` turns each Embed into its provider's player, a lazy iframe built only from the parts of the stored link that match that provider's pattern. Supported kinds are link card, Bluesky post, YouTube (played from youtube-nocookie.com), Spotify, Bandcamp, Vimeo, CodePen and SoundCloud, listed in `EMBED_KINDS`. `listenForEmbedResize(window)` lets Bluesky posts grow to their real height. `EMBED_FRAME_HOSTS` lists the hosts a Content-Security-Policy's `frame-src` must allow.
  - `@skyscribe-sdk/react`: `ScribeContent` renders Embeds by default; pass `embeds={false}` to keep them as links. It now needs `@skyscribe-sdk/core` 3.12 or later.

## 3.11.3

### Patch Changes

- - `buildCanonicalUrl` no longer repeats the path prefix when an article has no `canonicalUrl`. Published articles' `path` already includes it, which produced URLs like `/blog/blog/essays/my-post`.
  - `listArticles` returns each article's human-readable slug (from its `path`) instead of its record key, and reads `createdAt`, the cover image (as `splashImageUrl`) and `contributors` from where current records store them. Drafts are still included.
  - `fetchArticle`'s second parameter is renamed from `articleSlug` to `rkey`, matching what it has always done: fetch by record key. Callers aren't affected.

## 3.11.2

### Patch Changes

- Renamed from `@scribe-atp/*` to `@skyscribe-sdk/*` as part of the move to the SkyScribe SDK. Only the package name changes: every export, hook, type and CSS class keeps its name, and version numbers continue from the old package. To migrate, replace `@scribe-atp/` with `@skyscribe-sdk/` in your imports and `package.json`.

## 3.11.1

### Patch Changes

- Fix `fetchSite`/`listSites` reading a publication's `description` from the wrong place. `site.standard.publication` defines `description` as a top-level field; `fetchSite` was already (correctly, but silently uselessly) reading it top-level only, which meant it always returned `undefined` since every CMS write path put it in `scribe.description` instead. `listSites` had the opposite problem — it read `scribe.description` only, with no top-level field even declared on the type.

  Both functions now read `description` top-level first, falling back to `scribe.description` for existing records written before this fix — no code changes needed downstream, but consumer sites won't see a site's real description until they update to this version.

## 3.11.0

### Minor Changes

- Add `PdsUnreachableError`, distinguishing "the PDS responded with an error" from "the PDS couldn't be reached at all."

  Previously `PdsFetchError` covered both a non-ok HTTP response (the service is up, this operation failed) and a connection-level failure (DNS failure, connection refused, timeout — `fetch()` itself never got a response). The latter wasn't even consistently wrapped: several internal `fetch()` calls threw raw, unclassified errors on connection failure instead of any typed SDK error.

  `PdsUnreachableError` extends `PdsFetchError`, so existing `instanceof PdsFetchError` checks still match it — check `instanceof PdsUnreachableError` first if you want to distinguish "couldn't load that record" from "service is down" in your UI. All internal `fetch()` calls (`fetchSite`, `fetchArticle`, `fetchArticleBySlug`, `resolvePublicationUri`, `listSites`, `listArticles`, `fetchProfile`, handle/PDS resolution) now consistently throw either `PdsFetchError` or `PdsUnreachableError` — no more raw unclassified errors on connection failure. `withRetry` treats both the same (retryable); the distinction is for end-user messaging and logging, not retry behavior.

## 3.10.0

### Minor Changes

- Add `NotFoundError` and `PdsFetchError` typed errors, and a generic `withRetry()` wrapper.

  `fetchSite`, `fetchArticle`, `fetchArticleBySlug`, and `resolvePublicationUri` now throw `NotFoundError` when a record genuinely doesn't exist (a fetch succeeded, the record just isn't there — retrying won't help) and `PdsFetchError` for everything else (network failure, non-ok HTTP response, handle/DID/PDS resolution failure — safe to retry). Both extend `Error` and are exported from the package root.

  `withRetry(fn, options)` wraps any async call with configurable retry-with-backoff (`attempts`, `delaysMs`, `signal`). It never retries `NotFoundError` or an aborted signal, and retries everything else — including plain `Error`s from code that hasn't adopted the typed errors. Opt-in only; none of the existing fetch functions retry automatically.

## 3.9.0

### Minor Changes

- Add `contributors` to `ArticleRef`. Site manifests already carry contributor
  data per article (written by Scribe CMS), but the type only exposed it on
  the full `Article` shape — list views (`fetchSite`, `createSiteLoader`, etc.)
  had no typed access to it. Consumers can now show per-article Writer/
  Photographer credit on listing pages, not just the full article page.

## 3.8.1

### Patch Changes

- Fix `fetchArticleBySlug` refetching an article via the site's own author identifier regardless of which repo its `ArticleRef.uri` actually names. Scribe CMS's Contributors feature (sync-later publish) can point an ArticleRef at a Contributor's own repo rather than the site owner's — resolving via the owner's identifier 404s in that case. Now resolves from the ArticleRef's own DID instead.

## 3.8.0

### Minor Changes

- Add `fetchProfile(handleOrDid, signal?)`, resolving a Bluesky profile via `app.bsky.actor.getProfile`. Returns a `Profile` type mirroring `app.bsky.actor.defs#profileViewDetailed` in full — `displayName`, `description`, `avatar`, `pronouns`, `website`, `banner`, `followersCount`, `followsCount`, `postsCount`, `createdAt`, `associated`, `pinnedPost`, `verification`, and `status` — so consumers can pick whichever fields they want for an author card without needing an SDK change per field. Omits `viewer` (always empty against the public unauthenticated AppView), `indexedAt`, and `labels`/`$type`/`debug`.

## 3.7.1

### Patch Changes

- Fix `fetchSite` throwing indefinitely after a `site.standard.publication` record is deleted and recreated (e.g. re-running "Add New Site" for the same domain). `publicationUriCache` previously cached the resolved AT URI forever with no revalidation, so any long-running consumer process kept retrying a now-deleted rkey until it was manually restarted. Cache entries now expire after 60s, and `fetchSite` falls back to a fresh `listRecords` lookup whenever a cached URI's `getRecord` call fails, instead of surfacing the failure.

## 3.7.0

### Minor Changes

- Add canonical link tags and JSON-LD structured data to article/site meta generation.

  - `generateArticleMeta`/`generateSiteMeta` now include a `<link rel="canonical">` tag and a `script:ld+json` entry (`BlogPosting`/`WebSite` schema.org markup) alongside the existing Open Graph/Twitter tags. `@scribe-atp/react-router-framework`'s `articleMeta`/`siteMeta` pick this up automatically once consumers update `@scribe-atp/core` — no code changes needed there.
  - New standalone exports `generateArticleJsonLd`/`generateSiteJsonLd` and `buildSiteUrl` from `@scribe-atp/core`, for frameworks whose metadata API has no room for a raw `<script>` tag.
  - `@scribe-atp/next`'s `articleMetadata`/`siteMetadata` now set `alternates.canonical`, and re-export `generateArticleJsonLd`/`generateSiteJsonLd` for consumers to render themselves via `dangerouslySetInnerHTML`.
  - `@scribe-atp/nuxt` re-exports `buildCanonicalUrl`, `buildSiteUrl`, `generateArticleJsonLd`, and `generateSiteJsonLd` for consumers to wire into `useHead()`, since `useSeoMeta()` has no field for either.

## 3.6.0

### Minor Changes

- Rename Article.splashImageUrl → Article.coverImageUrl; fix buildCanonicalUrl to use site.url; article.site is now an AT URI pointing to the publication record

## 3.5.0

### Minor Changes

- Align field mapping with site.standard spec: splashImageUrl, createdAt, and canonicalUrl are now read from the scribe extension object inside document records. Add textContent and bskyPostRef to the Article type. site.standard.document records now store site as an https:// URL rather than an AT URI.

## 3.4.2

### Patch Changes

- Internal refactoring — no public API changes.

  `@scribe-atp/social`: extract shared popup/polling/postMessage machinery into a `useSocialAction` hook. `LikeButton`, `ShareButton`, and `SubscribeButton` are now thin adapters; all behaviour is identical.

  `@scribe-atp/core`: expose `_clearAllCaches()` (consolidates `publicationUriCache`, `handleCache`, and `pdsCache` into a single test seam). Replaces the previous `_clearPublicationUriCache()`.

## 3.4.1

### Patch Changes

- Fix `listSites` crash when a `site.standard.publication` record has no `scribe` extension field (e.g. records created by other AT Protocol tools). Records without `scribe` are now silently skipped.

## 3.4.0

### Minor Changes

- Add `crossPostToBluesky` function for creating a Bluesky post with an `app.bsky.embed.external` embed containing `associatedRefs` pointing to `site.standard.document` and `site.standard.publication` records. Returns a `StrongRef` (`{ uri, cid }`) suitable for writing as `bskyPostRef` on the document record. Also exports `CrossPostParams` and `StrongRef` types.

## 3.3.1

### Patch Changes

- Export `buildCanonicalUrl` from `@scribe-atp/core`. Add `articleMetadata` and `siteMetadata` to `@scribe-atp/next`, returning Next.js `Metadata` objects for use in `generateMetadata`. Add `articleSeoMeta` and `siteSeoMeta` to `@scribe-atp/nuxt`, returning objects shaped for Nuxt's `useSeoMeta` composable.

## 3.3.0

### Minor Changes

- Add `generateArticleMeta` and `generateSiteMeta` helpers to `@scribe-atp/core` for generating Open Graph and Twitter Card meta tags from `site.standard` data. Add `articleMeta` and `siteMeta` wrappers to `@scribe-atp/react-router-framework` typed as `MetaDescriptor[]` for direct use in React Router v7 `meta` exports.

## 3.2.0

### Minor Changes

- Add `uri` field to `Site` type — `fetchSite` now returns the publication's own AT URI alongside its other fields. Needed by consumer sites to pass the publication AT URI to social action popups (subscribe button).

## 3.1.0

### Minor Changes

- Add `ArticleContributor` interface and `contributors`/`tags` fields to `Article`.

  New `ArticleContributor` type: `{ did: string; role?: string; displayName?: string }`.
  Both fields are optional and backwards-compatible with existing consumers.

## 3.0.2

### Patch Changes

- 93dcd2a: fetchSite reads description from top-level site.standard.publication field instead of scribe.description

## 3.0.1

### Patch Changes

- 7b9ec3e: Update package READMEs to reflect the `publicationUrl` API introduced in the v3/v2/v1 major releases — replaces all `siteSlug` parameter references and `toSlug()` usage examples with full HTTPS URL strings.

## 2.3.0

### Minor Changes

- Add `fetchArticleBySlug(author, siteSlug, slug)` to core, which resolves a human-readable slug to its TID rkey via the site manifest before fetching the article record. Returns `{ article, uri }` as `ArticleResult`.

  Remove `resolveDocumentUri` (assumed rkey === slug, which breaks after TID migration).

  Update `createArticleRouteLoader` signature to `(author, siteSlug, slugParam?)` — `siteSlug` is now required so the loader can use `fetchArticleBySlug`. Remove `createArticleLoader` (use `createArticleRouteLoader` or `fetchArticleBySlug` directly).

## 2.2.0

### Minor Changes

- Add `resolvePublicationUri` and `resolveDocumentUri` to support Standard.site discovery features.

  Both functions resolve an author handle (or DID) to a DID and return the AT URI for the publication or document record. Handle resolution is now cached at the module level to avoid redundant network calls on repeated requests (e.g. `.well-known` endpoint, article pages).

  Consumer sites can use these to implement:

  - A `/.well-known/site.standard.publication` resource route returning the publication AT URI
  - A `<link rel="site.standard.document">` tag on article pages pointing to the document record

## 2.1.0

### Minor Changes

- feat: read from site.standard.publication

  Fetch and list sites from site.standard.publication instead of app.scribe.site. Site records now store the Scribe manifest in a nested scribe extension field; scribe.domain maps to url and scribe.basePath maps to urlPrefix in the output — no breaking change for consumer sites.

  Adds optional canonicalUrl field to the Article type, passed through from site.standard.document records.

## 2.0.0

### Major Changes

- Migrate ArticleRef and Article field names to standard.site lexicon shape

  **Breaking changes in `@scribe-atp/core`:**

  - `ArticleRef.url` renamed to `ArticleRef.slug`
  - `ArticleRef.synopsis` renamed to `ArticleRef.description`
  - `Article.url` renamed to `Article.slug`
  - `Article.synopsis` renamed to `Article.description`
  - New optional fields on `ArticleRef`: `publishedAt`, `tags`
  - `Article.content` now transparently unwraps `app.scribe.content.html` union records in addition to accepting raw strings

  Framework adapters receive a minor bump as they re-export the updated types from core.

## 1.2.0

### Minor Changes

- Add `listSites` and `listArticles` functions for discovering all of an author's content.

  Both functions call `com.atproto.repo.listRecords` on the author's PDS and handle cursor-based pagination automatically. `listSites` returns `SiteRecord[]` (a `Site` with a `uri` field). `listArticles` returns `ArticleRef[]`. Cross-referencing the two lets callers identify draft articles — those not referenced in any site record.

## 1.1.1

### Patch Changes

- 0907fc0: Replace `generateSitemap` with `getSitemapEntries`, which returns `SitemapEntry[]` instead of an XML string. This correctly scopes the SDK to Scribe content — consumers merge the returned entries into their own framework's sitemap generator alongside their non-Scribe pages.

## 1.1.0

### Minor Changes

- Add `generateFeed` and `generateSitemap` utility functions for generating RSS 2.0 feeds and XML sitemaps from a Scribe site record.

## 1.0.1

### Patch Changes

- Add per-package README files so each package page on npm displays documentation.

## 1.0.0

### Major Changes

- a1aebbc: Stable 1.0.0 release. PDS resolution, AbortSignal support, and framework adapters are production-tested across multiple live sites.
