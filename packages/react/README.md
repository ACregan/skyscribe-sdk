# @skyscribe-sdk/react

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/react)](https://www.npmjs.com/package/@skyscribe-sdk/react)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

React hooks for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. Requires React 18 or later.

Wraps [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) with idiomatic React state management. Handles loading state, error state, and request cancellation automatically — re-fetches when parameters change and aborts in-flight requests on unmount.

## Installation

```bash
npm install @skyscribe-sdk/react
```

## Usage

### `ScribeContent`

Renders an article's HTML in a `<div class="scribe-content">` (so `@skyscribe-sdk/styles` applies), with Embeds (videos, music, code pens, Bluesky posts and link cards) shown as their players. Videos, music and pens show a Poster until clicked, so no player loads unasked.

```tsx
import { ScribeContent } from "@skyscribe-sdk/react";
import "@skyscribe-sdk/styles";

<ScribeContent html={article.content} />

// Load every player with the page instead of Posters
<ScribeContent html={article.content} clickToLoad={false} />

// Keep Embeds as the links they're stored as
<ScribeContent html={article.content} embeds={false} />
```

### `useSite`

```tsx
import { useSite } from "@skyscribe-sdk/react";

function BlogIndex() {
  const { site, loading, error } = useSite("alice.bsky.social", "https://alice.bsky.social");

  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Something went wrong: {error.message}</p>;

  return (
    <ul>
      {site.groups.map((group) =>
        group.articles.map((article) => (
          <li key={article.uri}>{article.title}</li>
        ))
      )}
    </ul>
  );
}
```

### `useArticleBySlug`

Looks the article up by its slug (as in its URL) and returns it with its AT URI:

```tsx
import { useArticleBySlug } from "@skyscribe-sdk/react";

function ArticlePage({ slug }: { slug: string }) {
  const { article, uri, loading, error } = useArticleBySlug(
    "alice.bsky.social",
    "https://alice.bsky.social",
    slug
  );

  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Something went wrong: {error.message}</p>;

  if (!article) return null;

  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </article>
  );
}
```

`useArticle(author, rkey)` fetches by record key instead, for when you already have an `ArticleRef`. Don't pass it a slug.

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported so you only need one import:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/react";
```

## Using with server-side rendering

If you're using React Router v7 framework mode, consider [`@skyscribe-sdk/react-router-framework`](https://www.npmjs.com/package/@skyscribe-sdk/react-router-framework) instead — it fetches on the server and avoids client-side loading states entirely.

For Next.js App Router or other SSR frameworks, use [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) directly in your server components or page loaders.

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)
