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
import { createScribePublication } from "@skyscribe-sdk/next";

export const scribe = createScribePublication("alice.bsky.social", "https://alice.bsky.social");
```

### Category route — `/blog/[categorySlug]`

```ts
// app/blog/[categorySlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateCategoryParams;
// → [{ categorySlug: "tech" }, { categorySlug: "life" }]

export const generateMetadata = ({ params }: { params: { categorySlug: string } }) =>
  scribe.generateCategoryMetadata(params.categorySlug);

export default function CategoryPage({ params }: { params: { categorySlug: string } }) {
  // ...
}
```

### Document route — `/blog/[categorySlug]/[documentSlug]`

```ts
// app/blog/[categorySlug]/[documentSlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateCategoryDocumentParams;
// → [{ categorySlug: "tech", documentSlug: "hello" }, ...]

export const generateMetadata = ({ params }: { params: { documentSlug: string } }) =>
  scribe.generateDocumentMetadata(params.documentSlug);

export default function DocumentPage({ params }: { params: { categorySlug: string; documentSlug: string } }) {
  // ...
}
```

### Flat Document route — `/blog/[documentSlug]`

```ts
// app/blog/[documentSlug]/page.tsx
import { scribe } from "@/lib/scribe";

export const generateStaticParams = scribe.generateDocumentParams;
// → [{ documentSlug: "hello" }, { documentSlug: "second" }, ...]
```

### Publication home metadata

```ts
// app/blog/page.tsx
import { scribe } from "@/lib/scribe";

export const generateMetadata = scribe.generatePublicationMetadata;
```

## Metadata

The metadata generators are opinionated by design. They produce complete, ready-to-use `Metadata` objects including OpenGraph tags — you don't need to wire these up manually.

| Generator | `title` | `description` | OpenGraph |
| --------- | ------- | ------------- | --------- |
| `generatePublicationMetadata` | `publication.name` | `publication.description` | title, description, splash image |
| `generateCategoryMetadata` | `"Category — Publication"` | — | title |
| `generateDocumentMetadata` | `"Document — Publication"` | `description` | title, description, cover image |

Document metadata uses the cached `DocumentRef` snapshot already present in the Publication record, plus one request for the Document itself to read its SEO Settings: the author's SEO title and description replace the title and description, and noindex sets `robots: { index: false }`. If that request fails, the snapshot alone is used. `documentMetadata` (below) applies the SEO Settings too.

### Standalone metadata helpers

Outside the factory pattern, `documentMetadata` and `publicationMetadata` are exported as standalone functions that accept a `StandardDocument`/`StandardPublication` object directly. These are useful when you're already fetching content yourself and just need the `Metadata` object:

```ts
import { documentMetadata, publicationMetadata } from "@skyscribe-sdk/next";
import { fetchDocumentBySlug, fetchPublication } from "@skyscribe-sdk/core";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const [document, publication] = await Promise.all([
    fetchDocumentBySlug("alice.bsky.social", "https://alice.bsky.social", params.slug),
    fetchPublication("alice.bsky.social", "https://alice.bsky.social"),
  ]);
  return documentMetadata(document, publication);
}
```

**Need custom metadata?** Call `fetchPublication` or `fetchDocument` from `@skyscribe-sdk/core` directly and compose your own `Metadata` object:

```ts
import { fetchPublication } from "@skyscribe-sdk/core";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const publication = await fetchPublication("alice.bsky.social", "https://alice.bsky.social");
  return {
    title: `${publication.name} | My Platform`,
    // custom fields...
  };
}
```

### site.standard link tags

`Metadata` has no field for the `<link rel="site.standard.publication">` / `site.standard.document` tags Bluesky reads for its Standard.site link card, so render `standardSiteLinks(publication, document)` as `<link>` elements in your page or layout (React 19 moves them into the `<head>`).

## ISR (Incremental Static Regeneration)

The SDK does not configure Next.js fetch caching. Use Next.js [route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) to control revalidation:

```ts
// app/blog/[categorySlug]/[documentSlug]/page.tsx
export const revalidate = 3600; // revalidate every hour
```

## Pages Router

`@skyscribe-sdk/next` targets the App Router only. For Pages Router, use `@skyscribe-sdk/core` directly:

```ts
// pages/blog/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import { fetchPublication, fetchDocumentBySlug } from "@skyscribe-sdk/core";

export const getStaticPaths: GetStaticPaths = async () => {
  const publication = await fetchPublication("alice.bsky.social", "https://alice.bsky.social");
  const paths = publication.categories.flatMap((category) =>
    category.documents.map((document) => ({ params: { slug: document.slug ?? "" } }))
  );
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const document = await fetchDocumentBySlug(
    "alice.bsky.social",
    "https://alice.bsky.social",
    params!.slug as string
  );
  return { props: { document } };
};
```

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { StandardPublication, StandardDocument, DocumentRef, Category } from "@skyscribe-sdk/next";
```

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Upgrading from 1.x? `createScribeSite` still works, marked `@deprecated`, with its old method names and `{ groupSlug, articleSlug }` params; rename your route folders when you switch to `createScribePublication`. See [Upgrading to 5.0](https://sdk.skyscribe.app/upgrading-to-5).
