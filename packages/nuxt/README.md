# @skyscribe-sdk/nuxt

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/nuxt)](https://www.npmjs.com/package/@skyscribe-sdk/nuxt)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Nuxt 3 module for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. Requires Nuxt 3 or later.

Wraps [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) with Nuxt-idiomatic `useAsyncData` composables and auto-imports — no explicit imports needed in your components or pages.

## Installation

```bash
npm install @skyscribe-sdk/nuxt
```

Register the module in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ["@skyscribe-sdk/nuxt"],
});
```

## Usage

The composables are auto-imported globally — no import statement needed:

### `useScribePublication`

```vue
<!-- pages/blog/index.vue -->
<script setup lang="ts">
const { data: publication, pending, error } = await useScribePublication(
  "alice.bsky.social",
  "https://alice.bsky.social"
);
</script>

<template>
  <div v-if="pending">Loading…</div>
  <div v-else-if="error">{{ error.message }}</div>
  <ul v-else>
    <li v-for="group in publication!.categories" :key="group.slug">
      {{ category.title }}
    </li>
  </ul>
</template>
```

### `useScribeDocumentBySlug`

Looks the Document up by its slug (as in its URL). `data` holds the Document; its `uri` is its AT URI:

```vue
<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
const route = useRoute();
const { data: document, pending, error } = await useScribeDocumentBySlug(
  "alice.bsky.social",
  "https://alice.bsky.social",
  route.params.slug as string
);
</script>

<template>
  <article v-if="document">
    <h1>{{ document.title }}</h1>
    <div v-html="document.content" />
  </article>
</template>
```

`useScribeDocument(author, rkey)` fetches by record key instead, for when you already have a `DocumentRef`. Don't pass it a slug.

The composables return the full `useAsyncData` result shape: `{ data, pending, error, refresh, ... }`.

### Deferred loading with `lazy`

Pass `useAsyncData` options as an optional third argument:

```ts
const { data: publication, pending } = useScribePublication(
  "alice.bsky.social",
  "https://alice.bsky.social",
  { lazy: true }
);
```

## ISR (Incremental Static Regeneration)

Use Nuxt's [`routeRules`](https://nuxt.com/docs/guide/concepts/rendering#route-rules) in `nuxt.config.ts` to control revalidation:

```ts
export default defineNuxtConfig({
  modules: ["@skyscribe-sdk/nuxt"],
  routeRules: {
    "/blog/**": { swr: 3600 }, // revalidate every hour
  },
});
```

## Open Graph and Twitter Card meta tags

`documentSeoMeta` and `publicationSeoMeta` return a camelCase object shaped for Nuxt's `useSeoMeta()` composable. They produce Open Graph and Twitter Card tags for rich link previews when sharing Document URLs on Bluesky and other platforms. Add the canonical link and the `site.standard` link tags with `useHead` and `standardSiteLinks` (re-exported).

```vue
<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
import { documentSeoMeta } from "@skyscribe-sdk/nuxt";
import { fetchDocumentBySlug, fetchPublication } from "@skyscribe-sdk/core";

const route = useRoute();
const [document, publication] = await Promise.all([
  fetchDocumentBySlug("alice.bsky.social", "https://alice.bsky.social", route.params.slug as string),
  fetchPublication("alice.bsky.social", "https://alice.bsky.social"),
]);

useSeoMeta(documentSeoMeta(document, publication));
</script>
```

If the author gave the Document SEO Settings in SkyScribe (`document.seo`), `documentSeoMeta` uses its SEO title and description and adds `robots: "noindex"` when asked.

`publicationSeoMeta` covers the home and Category pages:

```ts
import { publicationSeoMeta } from "@skyscribe-sdk/nuxt";

useSeoMeta(publicationSeoMeta(publication));
```

These functions are **not** auto-imported — use an explicit import from `@skyscribe-sdk/nuxt`.

## Site Analytics

Cookie-free visit figures for your SDK-driven website, shown to the Publication's owner on its Insights tab in SkyScribe (free). Call it once, in `app.vue`:

```vue
<script setup lang="ts">
useSiteAnalytics();
</script>
```

Figures appear once your site serves `/.well-known/site.standard.publication` with your Publication's AT URI. You're responsible for disclosing the analytics in your privacy policy. Guide: https://sdk.skyscribe.app/guides/site-analytics

## Auto-imports

The composables are auto-imported: `useScribePublication`, `useScribeDocumentBySlug`, `useScribeDocument`, `useScribePublicationUri`, `useScribeDocumentUri` (version 1.3.0 or later; earlier versions didn't ship them) and `useSiteAnalytics` (1.4.0 or later).

Utility functions and meta helpers require an explicit import:

```ts
import { toSlug, flattenDocuments } from "@skyscribe-sdk/core";
import { documentSeoMeta, publicationSeoMeta } from "@skyscribe-sdk/nuxt";
```

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { StandardPublication, StandardDocument, DocumentRef, Category } from "@skyscribe-sdk/nuxt";
```

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Upgrading from 1.x? The old names (`useScribeSite`, `useScribeArticle`, `useScribeArticleBySlug`, `siteSeoMeta`, `articleSeoMeta`) still work and stay auto-imported, marked `@deprecated`. See [Upgrading to 5.0](https://sdk.skyscribe.app/upgrading-to-5).
