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

Renders a Document's HTML in a `<div class="scribe-content">` (so `@skyscribe-sdk/styles` applies), with Embeds (videos, music, code pens, Bluesky posts and link cards) shown as their players. Videos, music and pens show a Poster until clicked, so no player loads unasked.

```tsx
import { ScribeContent } from "@skyscribe-sdk/react";
import "@skyscribe-sdk/styles";

<ScribeContent html={document.content} />

// Load every player with the page instead of Posters
<ScribeContent html={document.content} clickToLoad={false} />

// Keep Embeds as the links they're stored as
<ScribeContent html={document.content} embeds={false} />
```

### `usePublication`

```tsx
import { usePublication } from "@skyscribe-sdk/react";

function BlogIndex() {
  const { publication, loading, error } = usePublication("alice.bsky.social", "https://alice.bsky.social");

  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Something went wrong: {error.message}</p>;

  return (
    <ul>
      {publication.categories.map((category) =>
        category.documents.map((document) => (
          <li key={document.uri}>{document.title}</li>
        ))
      )}
    </ul>
  );
}
```

### `useDocumentBySlug`

Looks the Document up by its slug (as in its URL). Its `uri` is its AT URI:

```tsx
import { useDocumentBySlug } from "@skyscribe-sdk/react";

function DocumentPage({ slug }: { slug: string }) {
  const { document, loading, error } = useDocumentBySlug(
    "alice.bsky.social",
    "https://alice.bsky.social",
    slug
  );

  if (loading) return <p>Loading…</p>;
  if (error)   return <p>Something went wrong: {error.message}</p>;

  if (!document) return null;

  return (
    <article>
      <h1>{document.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: document.content }} />
    </article>
  );
}
```

`useDocument(author, rkey)` fetches by record key instead, for when you already have a `DocumentRef`. Don't pass it a slug.

### `SiteAnalytics`

Cookie-free visit figures for your SDK-driven website, shown to the Publication's owner on its Insights tab in SkyScribe (free). Render it once, in your root layout:

```tsx
import { SiteAnalytics } from "@skyscribe-sdk/react";

<SiteAnalytics />
```

Figures appear once your site serves `/.well-known/site.standard.publication` with your Publication's AT URI. You're responsible for disclosing the analytics in your privacy policy. Guide: https://sdk.skyscribe.app/guides/site-analytics

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported so you only need one import:

```ts
import type { StandardPublication, StandardDocument, DocumentRef, Category } from "@skyscribe-sdk/react";
```

## Using with server-side rendering

If you're using React Router v7 framework mode, consider [`@skyscribe-sdk/react-router-framework`](https://www.npmjs.com/package/@skyscribe-sdk/react-router-framework) instead — it fetches on the server and avoids client-side loading states entirely.

For Next.js App Router or other SSR frameworks, use [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) directly in your server components or page loaders.

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)
