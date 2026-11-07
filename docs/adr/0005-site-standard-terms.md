# ADR 0005 — The public API uses the site.standard terms

**Status:** Accepted
**Date:** 2026-11-07

The SDK's API predates SkyScribe's naming, so one thing had up to three names: SkyScribe said Publication, Document and Category; the SDK said `Site`, `Article` and `Group`; the records are `site.standard.publication` and `site.standard.document`. The docs needed a translation table, and "Site" collided with SkyScribe's Site (the hosted website built for a Publication). The old glossary told us to *avoid* "publication" and "document" because they overlap the record names. We now want that overlap: a developer who reads `site.standard.document` on a PDS and `fetchDocument` in the SDK should see one thing.

## Decision

- **Names.** The site.standard term wherever the spec has one (Publication, Document); SkyScribe's term for the rest (Category, which the spec has no equivalent for). `Site` → Publication, `Article` → Document, `Group` → Category in every type, field, function and parameter name. "Site Analytics" keeps its name: it is a SkyScribe product name and measures a website, not a record.
- **`StandardPublication` and `StandardDocument`** are the two record types. A bare `Document` would silently shadow the DOM's global `Document` in any file that forgot the import; `SiteDocument` would reintroduce "Site". `Standard*` is the ecosystem's own name (Standard.site). Only these two carry the prefix; `Category`, `DocumentRef` and `DocumentContributor` clash with nothing.
- **Fields follow the record.** A Publication's title is `name` (the spec field), `urlPrefix` is `basePath` (the `scribe.basePath` it comes from), `groups` is `categories`, a Category's `articles` is `documents`, and a `DocumentRef`'s `splashImageUrl` is `coverImageUrl` (the same image is `coverImageUrl` on the full Document). `StandardDocument.site` keeps its name: it is the spec field. The old `Site.url` held `scribe.domain`, a bare domain, not the spec's `url` (a full `https://` URL), so it becomes `domain`, with no `url` field at all: every old `.url` read fails at typecheck instead of quietly building `https://https://…` links. A spec `url` can come later in a minor. The legacy, always-empty `ungroupedArticles` and the empty `SiteRecord` alias are dropped.
- **`StandardDocument` carries its own `uri`,** so `ArticleResult { article, uri }` and React Router's `ArticleWithUri` are dropped rather than renamed, and a meta helper can name the Document in a link tag.
- **The "Scribe" prefix stays** (`ScribeContent`, `ScribeService`, `useScribePublication`, `createScribePublication`). It means "understands the Scribe extension" (`scribe.*`, `app.scribe.content.html`), which is accurate, and Vue/Nuxt need some prefix because Nuxt auto-imports globally. `Standard*` would overclaim: these helpers don't fully understand a site.standard record without the extension.
- **One breaking major per package that re-exports the types** (core 5, react 4, react-router-framework 3, next, vue, nuxt and angular 2). The field renames make a major unavoidable; keeping old and new fields side by side would double what every loader serialises. The old *function and type names* stay as `@deprecated` aliases until the next major, because they cost nothing. Every adapter now requires core `^5.0.0` (some accepted `*`).
- **Route params.** The new Document loader reads `params.documentSlug`, and Next's new `generate*Params` return `{ categorySlug, documentSlug }`. The deprecated names keep `articleSlug` / `groupSlug`, so a developer switches name and route segment together, and a bump alone breaks nothing.
- **Link tags.** The Publication and Document meta helpers emit `<link rel="site.standard.publication">` (and `site.standard.document` on Documents), which Bluesky needs to draw a Standard.site link card. `standardSiteLinks()` returns just those tags for pages that don't use the meta helpers.

## Consequences

- The docs drop the "SkyScribe names and SDK names" table; "Upgrading to 5.0" lists every rename.
- Already-published adapters that accept any core (react-router-framework 2, next 1, angular 1) install against core 5 and break at runtime. Published ranges can't be changed, so the upgrade guide and the core changelog lead with "upgrade every `@skyscribe-sdk` package together".
- skyscribe-app and skyscribe-site stay on core 4 until their next ordinary branch.
