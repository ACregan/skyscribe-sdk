# @skyscribe-sdk/next

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/next)](https://www.npmjs.com/package/@skyscribe-sdk/next)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Next.js App Router adapter for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. Requires Next.js 13 or later.

Wraps [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) with Next.js-idiomatic factories for `generateStaticParams` and `generateMetadata`.

> **App Router only.** For Pages Router support, use [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) directly — see [Pages Router](#pages-router) below.

## Installation

```bash
npm install @skyscribe-sdk/next
```

## Usage

Create a factory once and export its functions from your route files:

```ts
// lib/scribe.ts
import { createScribeSite } from "@skyscribe-sdk/next";

export const scribe = createScribeSite("alice.bsky.social", "https://alice.bsky.social");
```

### Group index route — `/blog/[groupSlug]`

```ts
// app/blog/[groupSlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateGroupParams;
// → [{ groupSlug: "tech" }, { groupSlug: "life" }]

export const generateMetadata = ({ params }: { params: { groupSlug: string } }) =>
  scribe.generateGroupMetadata(params.groupSlug);

export default function GroupPage({ params }: { params: { groupSlug: string } }) {
  // ...
}
```

### Article route — `/blog/[groupSlug]/[articleSlug]`

```ts
// app/blog/[groupSlug]/[articleSlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateGroupArticleParams;
// → [{ groupSlug: "tech", articleSlug: "hello" }, ...]

export const generateMetadata = ({ params }: { params: { articleSlug: string } }) =>
  scribe.generateArticleMetadata(params.articleSlug);

export default function ArticlePage({ params }: { params: { groupSlug: string; articleSlug: string } }) {
  // ...
}
```

### Flat article route — `/blog/[articleSlug]`

```ts
// app/blog/[articleSlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateArticleParams;
// → [{ articleSlug: "hello" }, { articleSlug: "second" }, ...]
```

### Site index metadata

```ts
// app/blog/page.tsx
import { scribe } from "@/lib/scribe";

export const generateMetadata = scribe.generateSiteMetadata;
```

## Metadata

The metadata generators are opinionated by design. They produce complete, ready-to-use `Metadata` objects including OpenGraph tags — you don't need to wire these up manually.

| Generator | `title` | `description` | OpenGraph |
| --------- | ------- | ------------- | --------- |
| `generateSiteMetadata` | `site.title` | `site.description` | title, description, splash image |
| `generateGroupMetadata` | `"Group — Site"` | — | title |
| `generateArticleMetadata` | `"Article — Site"` | `description` | title, description, splash image |

Article metadata uses the cached `ArticleRef` snapshot already present in the site record, plus one request for the article itself to read its SEO Settings: the author's SEO title and description replace the title and description, and noindex sets `robots: { index: false }`. If that request fails, the snapshot alone is used. `articleMetadata` (below) applies the SEO Settings too.

### Standalone metadata helpers

Outside the factory pattern, `articleMetadata` and `siteMetadata` are exported as standalone functions that accept an `Article`/`Site` object directly. These are useful when you're already fetching content yourself and just need the `Metadata` object:

```ts
import { articleMetadata, siteMetadata } from "@skyscribe-sdk/next";
import { fetchArticleBySlug, fetchSite } from "@skyscribe-sdk/core";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const [{ article }, site] = await Promise.all([
    fetchArticleBySlug("alice.bsky.social", "https://alice.bsky.social", params.slug),
    fetchSite("alice.bsky.social", "https://alice.bsky.social"),
  ]);
  return articleMetadata(article, site);
}
```

**Need custom metadata?** Call `fetchSite` or `fetchArticle` from `@skyscribe-sdk/core` directly and compose your own `Metadata` object:

```ts
import { fetchSite } from "@skyscribe-sdk/core";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");
  return {
    title: `${site.title} | My Platform`,
    // custom fields...
  };
}
```

## ISR (Incremental Static Regeneration)

The SDK does not configure Next.js fetch caching. Use Next.js [route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) to control revalidation:

```ts
// app/blog/[groupSlug]/[articleSlug]/page.tsx
export const revalidate = 3600; // revalidate every hour
```

## Pages Router

`@skyscribe-sdk/next` targets the App Router only. For Pages Router, use `@skyscribe-sdk/core` directly:

```ts
// pages/blog/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import { fetchSite, fetchArticleBySlug } from "@skyscribe-sdk/core";

export const getStaticPaths: GetStaticPaths = async () => {
  const site = await fetchSite("alice.bsky.social", "https://alice.bsky.social");
  const paths = site.groups.flatMap((group) =>
    group.articles.map((article) => ({ params: { slug: article.slug ?? "" } }))
  );
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { article } = await fetchArticleBySlug(
    "alice.bsky.social",
    "https://alice.bsky.social",
    params!.slug as string
  );
  return { props: { article } };
};
```

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/next";
```

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)
