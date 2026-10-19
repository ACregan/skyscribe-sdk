# @skyscribe-sdk/react

## 3.1.0

### Minor Changes

- Site Analytics: cookie-free visit figures for an SDK-driven website, shown to the Publication's owner on its Insights tab in SkyScribe. Add `<SiteAnalytics />` (react, vue), `useSiteAnalytics()` (nuxt), or `loadSiteAnalytics()` / `siteAnalyticsScriptTag()` (core). Figures appear once the site serves `/.well-known/site.standard.publication`. Guide: https://sdk.skyscribe.app/guides/site-analytics

### Patch Changes

- Updated dependencies
  - @skyscribe-sdk/core@4.1.0

## 3.0.0

### Major Changes

- Click-to-load Embeds (skyscribe-app ADR 0080). Videos, music and code pens now render as a **Poster** (thumbnail, title and a Play or Load player button, the player's exact size) and load their player only when the reader clicks, already playing where the provider allows it. Bluesky posts and link cards are unchanged.

  - core: `renderEmbeds(html, { clickToLoad })` defaults to Posters; `{ clickToLoad: false }` gives the previous players. New `enhanceEmbeds(window)` (Poster clicks plus Bluesky resizing), `listenForEmbedClicks(window)` and `hasEmbedPlayer(html)`. **Breaking:** if you call `renderEmbeds` yourself, add `enhanceEmbeds(window)` once in the browser, or Posters stay links to the media's page. A strict Content-Security-Policy needs `img-src https:` for thumbnails.
  - react: `ScribeContent` shows Posters and calls `enhanceEmbeds` for you; `clickToLoad={false}` loads players with the page.
  - styles: Poster styles and four `--scribe-embed-poster-*` tokens.

### Patch Changes

- Updated dependencies
  - @skyscribe-sdk/core@4.0.0

## 2.3.0

### Minor Changes

- Embeds. SkyScribe Documents can now contain Embeds: videos, music, code pens, Bluesky posts and link cards. Each is stored as a link marked with its kind (`<figure data-embed="youtube"><a href="…">…</a></figure>`), so anything that doesn't know about Embeds still shows a working link.

  - `@skyscribe-sdk/core`: `renderEmbeds(html)` turns each Embed into its provider's player, a lazy iframe built only from the parts of the stored link that match that provider's pattern. Supported kinds are link card, Bluesky post, YouTube (played from youtube-nocookie.com), Spotify, Bandcamp, Vimeo, CodePen and SoundCloud, listed in `EMBED_KINDS`. `listenForEmbedResize(window)` lets Bluesky posts grow to their real height. `EMBED_FRAME_HOSTS` lists the hosts a Content-Security-Policy's `frame-src` must allow.
  - `@skyscribe-sdk/react`: `ScribeContent` renders Embeds by default; pass `embeds={false}` to keep them as links. It now needs `@skyscribe-sdk/core` 3.12 or later.

### Patch Changes

- Updated dependencies
  - @skyscribe-sdk/core@3.12.0

## 2.2.0

### Minor Changes

- New helpers that fetch an article by its human-readable slug, as in its URL, and return it with its AT URI: `useArticleBySlug` (React), `useScribeArticleBySlug` (Vue and Nuxt), and `injectArticleBySlug` / `ScribeService.getArticleBySlug` (Angular).

  The existing `useArticle`, `useScribeArticle`, `injectArticle` and `ScribeService.getArticle` fetch by record key (rkey), which for articles published with current tooling is an opaque ID, not the slug. Their parameter is renamed from `articleSlug` to `rkey` to say so; callers aren't affected.

### Patch Changes

- Updated dependencies
  - @skyscribe-sdk/core@3.11.3

## 2.1.1

### Patch Changes

- Renamed from `@scribe-atp/*` to `@skyscribe-sdk/*` as part of the move to the SkyScribe SDK. Only the package name changes: every export, hook, type and CSS class keeps its name, and version numbers continue from the old package. To migrate, replace `@scribe-atp/` with `@skyscribe-sdk/` in your imports and `package.json`.
- Updated dependencies
  - @skyscribe-sdk/core@3.11.2

## 2.1.0

### Minor Changes

- Add `@scribe-atp/styles` — base CSS for rendering Scribe CMS content

  New package `@scribe-atp/styles` provides scoped styles for article content rendered via Scribe CMS. Import the stylesheet and wrap article HTML in an element with `class="scribe-content"`.

  Covers: code block syntax highlighting (Prism-compatible token classes), inline code, images, blockquotes, ordered/unordered lists with correct indentation, and checklists (using `aria-checked` attribute selectors). All colours are overridable via CSS custom properties (`--scribe-token-keyword`, `--scribe-code-bg`, etc.).

  Add `ScribeContent` component to `@scribe-atp/react` — a thin `<div>` wrapper that applies `scribe-content` class and renders HTML via `dangerouslySetInnerHTML`. Accepts all `<div>` HTML attributes; `className` is merged with `scribe-content`.

## 2.0.1

### Patch Changes

- 7b9ec3e: Update package READMEs to reflect the `publicationUrl` API introduced in the v3/v2/v1 major releases — replaces all `siteSlug` parameter references and `toSlug()` usage examples with full HTTPS URL strings.
- Updated dependencies [7b9ec3e]
  - @scribe-atp/core@3.0.1

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
