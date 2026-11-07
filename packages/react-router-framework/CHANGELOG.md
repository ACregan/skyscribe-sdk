# @skyscribe-sdk/react-router-framework

## 3.0.0

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

## 2.1.4

### Patch Changes

- Renamed from `@scribe-atp/*` to `@skyscribe-sdk/*` as part of the move to the SkyScribe SDK. Only the package name changes: every export, hook, type and CSS class keeps its name, and version numbers continue from the old package. To migrate, replace `@scribe-atp/` with `@skyscribe-sdk/` in your imports and `package.json`.
- Updated dependencies
  - @skyscribe-sdk/core@3.11.2

## 2.1.3

### Patch Changes

- Widen the `react-router` peer dependency range to `^7.0.0 || ^8.0.0`. The package only imports the `LoaderFunctionArgs` type and wraps loader functions with a signature unchanged between v7 and v8 (no middleware, split route modules, or other v8-specific runtime APIs are used), so no code changes were needed — this is a compatibility declaration update, verified against react-router@8.2.0.

## 2.1.2

### Patch Changes

- Add optional dependency injection to loader factories for testability. All three factory functions (`createSiteLoader`, `createArticleRouteLoader`, `createWellKnownLoader`) now accept an optional `deps` parameter so consumers can pass mock fetch functions in tests without needing `vi.mock`.

## 2.1.1

### Patch Changes

- Fix missing type declarations in framework adapters and styles package.

  `react-router-framework`, `next`, and `nuxt` all had stale dist d.ts files that omitted meta helper functions added after the initial build (`articleMeta`/`siteMeta`, `articleMetadata`/`siteMetadata`, `articleSeoMeta`/`siteSeoMeta`). Rebuilding the packages regenerates correct declarations.

  `styles` had an empty `src/index.d.ts` (0 bytes), which TypeScript treats as a global script rather than an ES module, causing a type error on side-effect imports (`import '@scribe-atp/styles'`). Added `export {}` to mark it as a module.

## 2.1.0

### Minor Changes

- Add `generateArticleMeta` and `generateSiteMeta` helpers to `@scribe-atp/core` for generating Open Graph and Twitter Card meta tags from `site.standard` data. Add `articleMeta` and `siteMeta` wrappers to `@scribe-atp/react-router-framework` typed as `MetaDescriptor[]` for direct use in React Router v7 `meta` exports.

### Patch Changes

- Updated dependencies
  - @scribe-atp/core@3.3.0

## 2.0.1

### Patch Changes

- 7b9ec3e: Update package READMEs to reflect the `publicationUrl` API introduced in the v3/v2/v1 major releases — replaces all `siteSlug` parameter references and `toSlug()` usage examples with full HTTPS URL strings.
- Updated dependencies [7b9ec3e]
  - @scribe-atp/core@3.0.1

## 1.3.0

### Minor Changes

- Add `fetchArticleBySlug(author, siteSlug, slug)` to core, which resolves a human-readable slug to its TID rkey via the site manifest before fetching the article record. Returns `{ article, uri }` as `ArticleResult`.

  Remove `resolveDocumentUri` (assumed rkey === slug, which breaks after TID migration).

  Update `createArticleRouteLoader` signature to `(author, siteSlug, slugParam?)` — `siteSlug` is now required so the loader can use `fetchArticleBySlug`. Remove `createArticleLoader` (use `createArticleRouteLoader` or `fetchArticleBySlug` directly).

### Patch Changes

- Updated dependencies
  - @scribe-atp/core@2.3.0

## 1.2.0

### Minor Changes

- Add Standard.site discovery support to all framework adapters.

  Each adapter exposes framework-idiomatic helpers for the two discovery URIs introduced in `@scribe-atp/core` 2.2.0:

  - **react-router-framework**: `createWellKnownLoader(author, siteSlug)` returns a resource-route loader that serves the publication AT URI as plain text; `createArticleRouteLoader(author)` returns an article loader that also resolves and returns `documentUri`.
  - **next**: `createScribeSite` return object gains `getDocumentUri(articleSlug)`; `createWellKnownHandler(author, siteSlug)` returns an App Router route handler for the `.well-known` endpoint.
  - **vue**: `useScribeDocumentUri(author, articleSlug)` and `useScribePublicationUri(author, siteSlug)` composables with `uri`/`loading`/`error` refs.
  - **nuxt**: `useScribeDocumentUri` and `useScribePublicationUri` composables wrapping `useAsyncData`, auto-imported by the module.
  - **angular**: `ScribeService` gains `getDocumentUri` and `getPublicationUri` Observable methods; `injectDocumentUri` and `injectPublicationUri` injection functions expose the same via Signals.

## 1.1.0

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

## 1.0.1

### Patch Changes

- Add per-package README files so each package page on npm displays documentation.
- Updated dependencies
  - @scribe-atp/core@1.0.1

## 1.0.0

### Major Changes

- a1aebbc: Stable 1.0.0 release. PDS resolution, AbortSignal support, and framework adapters are production-tested across multiple live sites.

### Patch Changes

- Updated dependencies [a1aebbc]
  - @scribe-atp/core@1.0.0
