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

### `useScribeSite`

```vue
<!-- pages/blog/index.vue -->
<script setup lang="ts">
const { data: site, pending, error } = await useScribeSite(
  "alice.bsky.social",
  "https://alice.bsky.social"
);
</script>

<template>
  <div v-if="pending">Loading…</div>
  <div v-else-if="error">{{ error.message }}</div>
  <ul v-else>
    <li v-for="group in site!.groups" :key="group.slug">
      {{ group.title }}
    </li>
  </ul>
</template>
```

### `useScribeArticleBySlug`

Looks the article up by its slug (as in its URL). `data` holds `{ article, uri }`:

```vue
<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
const route = useRoute();
const { data, pending, error } = await useScribeArticleBySlug(
  "alice.bsky.social",
  "https://alice.bsky.social",
  route.params.slug as string
);
</script>

<template>
  <article v-if="data">
    <h1>{{ data.article.title }}</h1>
    <div v-html="data.article.content" />
  </article>
</template>
```

`useScribeArticle(author, rkey)` fetches by record key instead, for when you already have an `ArticleRef`. Don't pass it a slug.

The composables return the full `useAsyncData` result shape: `{ data, pending, error, refresh, ... }`.

### Deferred loading with `lazy`

Pass `useAsyncData` options as an optional third argument:

```ts
const { data: site, pending } = useScribeSite(
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

`articleSeoMeta` and `siteSeoMeta` return a camelCase object shaped for Nuxt's `useSeoMeta()` composable. They produce Open Graph and Twitter Card tags for rich link previews when sharing article URLs on Bluesky and other platforms.

```vue
<!-- pages/blog/[slug].vue -->
<script setup lang="ts">
import { articleSeoMeta } from "@skyscribe-sdk/nuxt";
import { fetchArticleBySlug, fetchSite } from "@skyscribe-sdk/core";

const route = useRoute();
const [{ article }, site] = await Promise.all([
  fetchArticleBySlug("alice.bsky.social", "https://alice.bsky.social", route.params.slug as string),
  fetchSite("alice.bsky.social", "https://alice.bsky.social"),
]);

useSeoMeta(articleSeoMeta(article, site));
</script>
```

`siteSeoMeta` covers index and group pages:

```ts
import { siteSeoMeta } from "@skyscribe-sdk/nuxt";

useSeoMeta(siteSeoMeta(site));
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

The composables are auto-imported: `useScribeSite`, `useScribeArticleBySlug`, `useScribeArticle`, `useScribePublicationUri`, `useScribeDocumentUri` (version 1.3.0 or later; earlier versions didn't ship them) and `useSiteAnalytics` (1.4.0 or later).

Utility functions and meta helpers require an explicit import:

```ts
import { toSlug, flattenArticles } from "@skyscribe-sdk/core";
import { articleSeoMeta, siteSeoMeta } from "@skyscribe-sdk/nuxt";
```

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { Site, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/nuxt";
```

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)
