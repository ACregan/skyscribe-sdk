# @skyscribe-sdk/next

## 2.0.0

### Major Changes

- Requires `@skyscribe-sdk/core` 5 and uses its site.standard names (ADR 0005); see "Upgrading to 5.0" on sdk.skyscribe.app.

  - react: `usePublication`, `useDocument`, `useDocumentBySlug` (returning `{ publication }` / `{ document }`).
  - react-router-framework: `createPublicationLoader`, `createDocumentRouteLoader` (reads `params.documentSlug` by default), `publicationMeta`, `documentMeta`, `standardSiteLinks`.
  - next: `createScribePublication` (its `generate*Params` return `{ categorySlug, documentSlug }`), `publicationMetadata`, `documentMetadata`, `standardSiteLinks`.
  - vue / nuxt: `useScribePublication`, `useScribeDocument`, `useScribeDocumentBySlug`; nuxt `publicationSeoMeta`, `documentSeoMeta`, `standardSiteLinks`.
  - angular: `injectPublication`, `injectDocument`, `injectDocumentBySlug`; `ScribeService.getPublication` / `getDocument` / `getDocumentBySlug`.

  The old names still work, marked `@deprecated`, until the next major, and keep their old result keys and route params (`site`, `article`, `uri`, `articleSlug`, `groupSlug`), so upgrading alone changes nothing at runtime apart from core's renamed fields.

### Patch Changes

- Updated dependencies
  - @skyscribe-sdk/core@5.0.0

## 1.3.0

### Minor Changes

- Honour a Document's SEO Settings (ADR 0004). `Article` gains `seo` (`{ title?, description?, noindex? }`, read from the record's `scribe.seo`, invalid or over-long values dropped) and `ArticleRef` gains `noindex`. `generateArticleMeta`, Next's `articleMetadata` / `generateArticleMetadata` and Nuxt's `articleSeoMeta` use the SEO title and description in the title and description tags (the JSON-LD headline keeps the article's title) and add robots noindex when set. `getSitemapEntries` leaves out noindexed articles. New exports: `readDocumentSeo`, `DocumentSeo`, `SEO_TITLE_MAX`, `SEO_DESCRIPTION_MAX`.

### Patch Changes

- Updated dependencies
  - @skyscribe-sdk/core@4.2.0

## 1.2.1

### Patch Changes

- Renamed from `@scribe-atp/*` to `@skyscribe-sdk/*` as part of the move to the SkyScribe SDK. Only the package name changes: every export, hook, type and CSS class keeps its name, and version numbers continue from the old package. To migrate, replace `@scribe-atp/` with `@skyscribe-sdk/` in your imports and `package.json`.
- Updated dependencies
  - @skyscribe-sdk/core@3.11.2

## 1.2.0

### Minor Changes

- Add canonical link tags and JSON-LD structured data to article/site meta generation.

  - `generateArticleMeta`/`generateSiteMeta` now include a `<link rel="canonical">` tag and a `script:ld+json` entry (`BlogPosting`/`WebSite` schema.org markup) alongside the existing Open Graph/Twitter tags. `@scribe-atp/react-router-framework`'s `articleMeta`/`siteMeta` pick this up automatically once consumers update `@scribe-atp/core` — no code changes needed there.
  - New standalone exports `generateArticleJsonLd`/`generateSiteJsonLd` and `buildSiteUrl` from `@scribe-atp/core`, for frameworks whose metadata API has no room for a raw `<script>` tag.
  - `@scribe-atp/next`'s `articleMetadata`/`siteMetadata` now set `alternates.canonical`, and re-export `generateArticleJsonLd`/`generateSiteJsonLd` for consumers to render themselves via `dangerouslySetInnerHTML`.
  - `@scribe-atp/nuxt` re-exports `buildCanonicalUrl`, `buildSiteUrl`, `generateArticleJsonLd`, and `generateSiteJsonLd` for consumers to wire into `useHead()`, since `useSeoMeta()` has no field for either.

### Patch Changes

- Updated dependencies
  - @scribe-atp/core@3.7.0

## 1.1.2

### Patch Changes

- Rename `splashImageUrl` to `coverImageUrl` in article metadata helpers to match `Article` type rename in `@scribe-atp/core@3.6.0`.

## 1.1.1

### Patch Changes

- Fix missing type declarations in framework adapters and styles package.

  `react-router-framework`, `next`, and `nuxt` all had stale dist d.ts files that omitted meta helper functions added after the initial build (`articleMeta`/`siteMeta`, `articleMetadata`/`siteMetadata`, `articleSeoMeta`/`siteSeoMeta`). Rebuilding the packages regenerates correct declarations.

  `styles` had an empty `src/index.d.ts` (0 bytes), which TypeScript treats as a global script rather than an ES module, causing a type error on side-effect imports (`import '@scribe-atp/styles'`). Added `export {}` to mark it as a module.

## 1.1.0

### Minor Changes

- Export `buildCanonicalUrl` from `@scribe-atp/core`. Add `articleMetadata` and `siteMetadata` to `@scribe-atp/next`, returning Next.js `Metadata` objects for use in `generateMetadata`. Add `articleSeoMeta` and `siteSeoMeta` to `@scribe-atp/nuxt`, returning objects shaped for Nuxt's `useSeoMeta` composable.

### Patch Changes

- Updated dependencies
  - @scribe-atp/core@3.3.1

## 1.0.1

### Patch Changes

- 7b9ec3e: Update package READMEs to reflect the `publicationUrl` API introduced in the v3/v2/v1 major releases — replaces all `siteSlug` parameter references and `toSlug()` usage examples with full HTTPS URL strings.
- Updated dependencies [7b9ec3e]
  - @scribe-atp/core@3.0.1

## 0.3.0

### Minor Changes

- Add Standard.site discovery support to all framework adapters.

  Each adapter exposes framework-idiomatic helpers for the two discovery URIs introduced in `@scribe-atp/core` 2.2.0:

  - **react-router-framework**: `createWellKnownLoader(author, siteSlug)` returns a resource-route loader that serves the publication AT URI as plain text; `createArticleRouteLoader(author)` returns an article loader that also resolves and returns `documentUri`.
  - **next**: `createScribeSite` return object gains `getDocumentUri(articleSlug)`; `createWellKnownHandler(author, siteSlug)` returns an App Router route handler for the `.well-known` endpoint.
  - **vue**: `useScribeDocumentUri(author, articleSlug)` and `useScribePublicationUri(author, siteSlug)` composables with `uri`/`loading`/`error` refs.
  - **nuxt**: `useScribeDocumentUri` and `useScribePublicationUri` composables wrapping `useAsyncData`, auto-imported by the module.
  - **angular**: `ScribeService` gains `getDocumentUri` and `getPublicationUri` Observable methods; `injectDocumentUri` and `injectPublicationUri` injection functions expose the same via Signals.

## 0.2.0

### Minor Changes

- Migrate ArticleRef and Article field names to standard.site lexicon shape

  **Breaking changes in `@scribe-atp/core`:**

  - `ArticleRef.url` renamed to `ArticleRef.slug`
  - `ArticleRef.synopsis` renamed to `ArticleRef.description`
  - `Article.url` renamed to `Article.slug`
  - `Article.synopsis` renamed to `Article.description`
  - New optional fields on `ArticleRef`: `publishedAt`, `tags`
  - `Article.content` now transparently unwraps `app.scribe.content.html` union records in addition to accepting raw strings

  Framework adapters receive a minor bump as they re-export the updated types from core.

### Patch Changes

- Updated dependencies
  - @scribe-atp/core@2.0.0
