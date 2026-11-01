# ADR 0004 — The SDK honours a Document's SEO Settings

**Status:** Accepted
**Date:** 2026-11-01

skyscribe-app lets any author give a Document SEO Settings, stored on the record as `scribe.seo: { title?, description?, noindex? }` (skyscribe-app ADR 0099). They apply wherever the Document is shown, so the SDK acts on them for SDK-driven websites, released in step with the app and skyscribe-site, not as an opt-in.

- **`generateArticleMeta`** uses the SEO title for `<title>`, `og:title` and `twitter:title` (still " — site title" in `<title>`), and the SEO description for the meta / OG / Twitter descriptions. It adds `{ name: "robots", content: "noindex" }` for a noindexed Document. The JSON-LD `headline` keeps the Document's own title. Empty fields fall back to the title and description, so output is unchanged for every Document without SEO Settings: a minor release, not a major one.
- **`getSitemapEntries`** leaves out articles whose manifest entry has `noindex: true` (set by skyscribe-app beside `canonicalElsewhere`).
- **`generateFeed`** is unchanged: noindex keeps a Document out of search engines, not out of RSS.
- **`Article` gains an optional `seo`** and **`ArticleRef` an optional `noindex`**, so sites with their own meta code can read them. Over-long values (title > 200, description > 500 characters) are ignored on read, as skyscribe-site does.
