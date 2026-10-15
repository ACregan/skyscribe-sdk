# @skyscribe-sdk/styles

## 1.3.0

### Minor Changes

- Embeds: spacing for every Embed (`.scribe-content figure[data-embed]`), rounded players, and link cards drawn as a card with image, title and description. New custom properties: `--scribe-embed-border`, `--scribe-embed-radius` and `--scribe-embed-muted`.

## 1.2.0

### Minor Changes

- Style horizontal rules and tables. SkyScribe's editor can now write both, and imported documents keep them. Browsers draw tables with no cell borders by default, so `.scribe-content` now styles `hr`, `table`, `th` and `td`: bordered cells, a shaded header row, and wide tables that scroll sideways instead of stretching the page. Three new custom properties theme them: `--scribe-hr-color`, `--scribe-table-border` and `--scribe-table-header-bg`.

## 1.1.4

### Patch Changes

- Renamed from `@scribe-atp/*` to `@skyscribe-sdk/*` as part of the move to the SkyScribe SDK. Only the package name changes: every export, hook, type and CSS class keeps its name, and version numbers continue from the old package. To migrate, replace `@scribe-atp/` with `@skyscribe-sdk/` in your imports and `package.json`.

## 1.1.3

### Patch Changes

- Fix missing type declarations in framework adapters and styles package.

  `react-router-framework`, `next`, and `nuxt` all had stale dist d.ts files that omitted meta helper functions added after the initial build (`articleMeta`/`siteMeta`, `articleMetadata`/`siteMetadata`, `articleSeoMeta`/`siteSeoMeta`). Rebuilding the packages regenerates correct declarations.

  `styles` had an empty `src/index.d.ts` (0 bytes), which TypeScript treats as a global script rather than an ES module, causing a type error on side-effect imports (`import '@scribe-atp/styles'`). Added `export {}` to mark it as a module.

## 1.1.2

### Patch Changes

- Add empty type declaration so TypeScript consumers with `verbatimModuleSyntax` can import the package as a side effect without a type error.

## 1.1.1

### Patch Changes

- Add README documenting installation, usage, theming, and the full custom property reference.

## 1.1.0

### Minor Changes

- Add `@scribe-atp/styles` — base CSS for rendering Scribe CMS content

  New package `@scribe-atp/styles` provides scoped styles for article content rendered via Scribe CMS. Import the stylesheet and wrap article HTML in an element with `class="scribe-content"`.

  Covers: code block syntax highlighting (Prism-compatible token classes), inline code, images, blockquotes, ordered/unordered lists with correct indentation, and checklists (using `aria-checked` attribute selectors). All colours are overridable via CSS custom properties (`--scribe-token-keyword`, `--scribe-code-bg`, etc.).

  Add `ScribeContent` component to `@scribe-atp/react` — a thin `<div>` wrapper that applies `scribe-content` class and renders HTML via `dangerouslySetInnerHTML`. Accepts all `<div>` HTML attributes; `className` is merged with `scribe-content`.
