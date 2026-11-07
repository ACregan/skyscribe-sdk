# @skyscribe-sdk/react-router-framework

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/react-router-framework)](https://www.npmjs.com/package/@skyscribe-sdk/react-router-framework)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Loader factories for reading [SkyScribe](https://skyscribe.app) content in [React Router v7 framework mode](https://reactrouter.com).

Fetches content on the server, passes it to your route component via `useLoaderData`, and wires up request cancellation via `request.signal` automatically. No client-side loading states.

> **Not compatible with React Router SPA (library) mode.** For client-rendered React, use [`@skyscribe-sdk/react`](https://www.npmjs.com/package/@skyscribe-sdk/react) instead.

## Installation

```bash
npm install @skyscribe-sdk/react-router-framework
```

## Usage

### Publication home route

```ts
// app/routes/blog.tsx
import { createPublicationLoader } from "@skyscribe-sdk/react-router-framework";
import { useLoaderData } from "react-router";

export const loader = createPublicationLoader("alice.bsky.social", "https://alice.bsky.social");

export default function Blog() {
  const publication = useLoaderData<typeof loader>();

  return (
    <ul>
      {publication.categories.map((category) =>
        category.documents.map((ref) => (
          <li key={ref.uri}>{ref.title}</li>
        ))
      )}
    </ul>
  );
}
```

### Dynamic Document route

Use `createDocumentRouteLoader` for routes where the slug comes from URL params. It resolves the Document and returns the `StandardDocument`; its `uri` is the AT URI that `@skyscribe-sdk/social`'s `LikeButton` takes as `documentUri`.

```ts
// app/routes/blog.$categorySlug.$documentSlug.tsx
import { createDocumentRouteLoader } from "@skyscribe-sdk/react-router-framework";
import { useLoaderData } from "react-router";

export const loader = createDocumentRouteLoader(
  "alice.bsky.social",
  "https://alice.bsky.social"
);

export default function DocumentPage() {
  const { title, content, uri } = useLoaderData<typeof loader>();

  return (
    <article>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
```

The slug is read from the `documentSlug` route param, so name the segment `$documentSlug`. The third argument lets you use a different param name:

```ts
export const loader = createDocumentRouteLoader("alice.bsky.social", "https://alice.bsky.social", "slug");
```

### AT Protocol well-known route

`createWellKnownLoader` serves the author's publication AT URI at a `/.well-known/` endpoint — required for AT Protocol client discovery:

```ts
// app/routes/well-known.ts
import { createWellKnownLoader } from "@skyscribe-sdk/react-router-framework";

export const loader = createWellKnownLoader("alice.bsky.social", "https://alice.bsky.social");
```

### Open Graph and Twitter Card meta tags

`documentMeta` and `publicationMeta` return a `MetaDescriptor[]` array ready to spread into a React Router `meta` function. They produce Open Graph and Twitter Card tags, and the `site.standard` link tags Bluesky needs for its Standard.site link card. `standardSiteLinks(publication, document?)` returns just the link tags, for other pages.

```ts
import { documentMeta } from "@skyscribe-sdk/react-router-framework";
import type { Route } from "./+types/blog.$categorySlug.$documentSlug";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "My Blog" }];
  return [
    ...documentMeta(loaderData.document, loaderData.publication),
    { title: `${loaderData.document.title} — My Blog` },
  ];
}
```

`publicationMeta` covers the home and Category pages:

```ts
import { publicationMeta } from "@skyscribe-sdk/react-router-framework";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "My Blog" }];
  return [
    ...publicationMeta(loaderData.publication),
    { title: "My Blog" },
  ];
}
```

Both functions require the `StandardPublication` object from the loader — include it in your loader return if it isn't there already.

## Testing

All three factory functions accept an optional `deps` parameter for dependency injection. Pass mock functions directly — no `vi.mock` needed:

```ts
import { describe, it, expect, vi } from "vitest";
import { createPublicationLoader, createDocumentRouteLoader } from "@skyscribe-sdk/react-router-framework";

const makeArgs = () =>
  ({ request: new Request("https://example.com"), params: {}, context: {} }) as any;

describe("blog loaders", () => {
  it("fetches the publication", async () => {
    const fetchPublication = vi.fn().mockResolvedValueOnce(mockPublication);
    const loader = createPublicationLoader("alice.bsky.social", "https://alice.bsky.social", { fetchPublication });
    const result = await loader(makeArgs());
    expect(result).toEqual(mockPublication);
  });

  it("fetches a Document by slug", async () => {
    const fetchDocumentBySlug = vi.fn().mockResolvedValueOnce(mockDocument);
    const loader = createDocumentRouteLoader(
      "alice.bsky.social",
      "https://alice.bsky.social",
      "documentSlug",
      { fetchDocumentBySlug }
    );
    const result = await loader({ ...makeArgs(), params: { documentSlug: "hello" } });
    expect(result).toEqual(mockDocument);
  });
});
```

## TypeScript types

The main types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { StandardPublication, StandardDocument, DocumentRef, Category } from "@skyscribe-sdk/react-router-framework";
```

`ArticleWithUri` is the return type of `createDocumentRouteLoader` — it extends `StandardDocument` with `documentUri: string`.

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Upgrading from 2.x? The old names (`createSiteLoader`, `createArticleRouteLoader`, `siteMeta`, `articleMeta`) still work, marked `@deprecated`. See [Upgrading to 5.0](https://sdk.skyscribe.app/upgrading-to-5).
