# SkyScribe SDK

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/core?label=%40skyscribe-sdk%2Fcore)](https://www.npmjs.com/package/@skyscribe-sdk/core)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

TypeScript packages for showing content written in [SkyScribe](https://skyscribe.app) on a website you build yourself. Authors write and publish in SkyScribe; their content lives in their own Bluesky account, as [site.standard](https://standard.site) records, and the SDK fetches it for your website.

It handles the parts that are easy to get wrong: resolving an author's handle to the right Personal Data Server, caching those lookups, turning records into typed objects, and wiring up request cancellation.

**Documentation: [sdk.skyscribe.app](https://sdk.skyscribe.app)**

## Names

The SDK uses the same names as SkyScribe and the records: a **Publication** (`site.standard.publication`, the `StandardPublication` type) holds **Categories**, which hold **Documents** (`site.standard.document`, the `StandardDocument` type). Categories are SkyScribe's extension to the spec.

Upgrading from 4.x? See [Upgrading to 5.0](https://sdk.skyscribe.app/upgrading-to-5), and upgrade every `@skyscribe-sdk` package together.

## Packages

| Package | For |
| ------- | --- |
| [`@skyscribe-sdk/core`](./packages/core) | Any framework, or none. Start here. |
| [`@skyscribe-sdk/react`](./packages/react) | React hooks and the `ScribeContent` component |
| [`@skyscribe-sdk/react-router-framework`](./packages/react-router-framework) | React Router v7/v8 framework mode loaders and meta helpers |
| [`@skyscribe-sdk/next`](./packages/next) | Next.js 13+ App Router |
| [`@skyscribe-sdk/vue`](./packages/vue) | Vue 3 composables |
| [`@skyscribe-sdk/nuxt`](./packages/nuxt) | Nuxt 3 module |
| [`@skyscribe-sdk/angular`](./packages/angular) | Angular 16+ service and Signals |
| [`@skyscribe-sdk/social`](./packages/social) | React Like, Share and Follow buttons |
| [`@skyscribe-sdk/styles`](./packages/styles) | Themeable CSS for Document content |

For SvelteKit, Astro or anything else, use `@skyscribe-sdk/core` directly: see [Other frameworks](https://sdk.skyscribe.app/frameworks/other).

## Quick look

```ts
import { fetchPublication, fetchDocumentBySlug } from "@skyscribe-sdk/core";

const publication = await fetchPublication("alice.bsky.social", "https://alice.bsky.social");

for (const category of publication.categories) {
  for (const ref of category.documents) console.log(category.title, ref.title, ref.slug);
}

const document = await fetchDocumentBySlug("alice.bsky.social", "https://alice.bsky.social", "my-first-post");
console.log(document.title, document.uri);
```

Requires Node.js 22 or later. Every package ships its own type declarations.

## Development

```bash
npm install
npm run build       # build every package
npm test            # Vitest, all packages
npm run typecheck
npm run docs:dev    # the docs site (apps/docs)
```

[DEVELOPER_NOTES.md](./DEVELOPER_NOTES.md) covers the changeset and release process. Architecture decisions are in [docs/adr](./docs/adr), and the shared vocabulary in [UBIQUITOUS_LANGUAGE.md](./UBIQUITOUS_LANGUAGE.md).

## This repository

This GitHub repository is a read-only mirror. Issues and pull requests here aren't monitored: to report a problem or suggest a change, email hello@skyscribe.app.

## License

[MIT](./LICENSE)
