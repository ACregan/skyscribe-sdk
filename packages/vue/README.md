# @skyscribe-sdk/vue

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/vue)](https://www.npmjs.com/package/@skyscribe-sdk/vue)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

Vue 3 composables for reading [SkyScribe](https://skyscribe.app) content from the AT Protocol. Requires Vue 3 or later.

Wraps [`@skyscribe-sdk/core`](https://www.npmjs.com/package/@skyscribe-sdk/core) with idiomatic Vue 3 reactivity. Handles loading state, error state, and request cancellation automatically.

> **Building a Nuxt app?** Use [`@skyscribe-sdk/nuxt`](https://www.npmjs.com/package/@skyscribe-sdk/nuxt) instead — it builds on this package and adds auto-imports and `useAsyncData` integration.

## Installation

```bash
npm install @skyscribe-sdk/vue
```

## Usage

### `useScribePublication`

```vue
<script setup lang="ts">
import { useScribePublication } from "@skyscribe-sdk/vue";

const { publication, loading, error } = useScribePublication(
  "alice.bsky.social",
  "https://alice.bsky.social"
);
</script>

<template>
  <div v-if="loading">Loading…</div>
  <div v-else-if="error">{{ error.message }}</div>
  <ul v-else>
    <li v-for="group in publication!.categories" :key="group.slug">
      {{ category.title }}
    </li>
  </ul>
</template>
```

### `useScribeDocumentBySlug`

Looks the Document up by its slug (as in its URL). Its `uri` is its AT URI:

```vue
<script setup lang="ts">
import { useScribeDocumentBySlug } from "@skyscribe-sdk/vue";

const props = defineProps<{ slug: string }>();
const { document, loading, error } = useScribeDocumentBySlug(
  "alice.bsky.social",
  "https://alice.bsky.social",
  props.slug
);
</script>

<template>
  <div v-if="loading">Loading…</div>
  <div v-else-if="error">{{ error.message }}</div>
  <article v-else>
    <h1>{{ document!.title }}</h1>
    <div v-html="document!.content" />
  </article>
</template>
```

`useScribeDocument(author, rkey)` fetches by record key instead, for when you already have a `DocumentRef`. Don't pass it a slug.

Both composables abort the in-flight request automatically when the component is unmounted.

### `SiteAnalytics`

Cookie-free visit figures for your SDK-driven website, shown to the Publication's owner on its Insights tab in SkyScribe (free). Render it once, in `App.vue`:

```vue
<script setup lang="ts">
import { SiteAnalytics } from "@skyscribe-sdk/vue";
</script>

<template>
  <SiteAnalytics />
</template>
```

Figures appear once your site serves `/.well-known/site.standard.publication` with your Publication's AT URI. You're responsible for disclosing the analytics in your privacy policy. Guide: https://sdk.skyscribe.app/guides/site-analytics

## TypeScript types

All types from `@skyscribe-sdk/core` are re-exported:

```ts
import type { StandardPublication, StandardDocument, DocumentRef, Category } from "@skyscribe-sdk/vue";
```

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)
