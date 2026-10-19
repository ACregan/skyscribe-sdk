# SkyScribe SDK

A monorepo of packages for reading SkyScribe content from the AT Protocol. Authors write articles in [SkyScribe](https://skyscribe.app) (or the older Scribe CMS, which writes the same records); this SDK is for developers who want to display that content on an SDK-driven website. Formerly the Scribe ATP SDK (`@scribe-atp/*`); see [ADR 0003](./docs/adr/0003-migrate-to-skyscribe-sdk.md) for the migration plan.

## Project documentation

| File | Purpose |
| ---- | ------- |
| `CLAUDE.md` | This file — architecture, patterns, and conventions |
| `DEVELOPER_NOTES.md` | Day-to-day development workflow, changeset process, key commands |
| `UBIQUITOUS_LANGUAGE.md` | Shared vocabulary across the codebase and documentation |

## Packages

| Package | Path | Purpose |
| ------- | ---- | ------- |
| `@skyscribe-sdk/core` | `packages/core` | Pure TS fetch functions, PDS resolution, feed/sitemap generation, types. No framework deps. |
| `@skyscribe-sdk/react` | `packages/react` | React hooks (`useSite`, `useArticle`) wrapping core. |
| `@skyscribe-sdk/react-router-framework` | `packages/react-router-framework` | Loader factories for React Router v7/v8 framework mode. |
| `@skyscribe-sdk/angular` | `packages/angular` | Angular service (`ScribeService`) and injection functions (`injectSite`, `injectArticle`). |
| `@skyscribe-sdk/next` | `packages/next` | Next.js 13+ App Router adapter — `createScribeSite` factory for `generateStaticParams` and `generateMetadata`. |
| `@skyscribe-sdk/vue` | `packages/vue` | Vue 3 composables (`useScribeSite`, `useScribeArticle`). |
| `@skyscribe-sdk/nuxt` | `packages/nuxt` | Nuxt 3 module — wraps vue composables with `useAsyncData` and configures auto-imports. |

All framework adapters are thin wrappers around `@skyscribe-sdk/core`. New adapters should follow the same pattern: framework-idiomatic reactivity on top of the core fetch functions, with `AbortController` cleanup.

## CI/CD

GitLab CI. All jobs must include the runner tag:

```yaml
tags:
  - SERVER-docker-runner
```

Add this to the `default` block in `.gitlab-ci.yml` so it applies to every job automatically.

## Stack

- **TypeScript** — strict mode; ESM + CJS dual output via `tsup`
- **npm workspaces** — monorepo; packages linked locally during development
- **Vitest** — unit tests; `fetch` is mocked at the test level
- **@testing-library/react** — component/hook tests in `packages/react`
- **@vue/test-utils** — component/composable tests in `packages/vue`
- **zone.js + TestBed** — Angular testing in `packages/angular`

Each package has its own `package.json`, `tsconfig.json`, and `tsup.config.ts`. The root `package.json` holds dev tooling only.

## AT Protocol background

Scribe stores content in two collections on the author's Personal Data Server (PDS):

**Golden rule: top-level fields must comply with the site.standard lexicon spec. Any Scribe-specific data that is not in the spec goes inside the `scribe` extension object — never at the top level.**

**`site.standard.publication`** — site manifest (rkey = TID):
```ts
{
  // SPEC — top-level only
  $type: "site.standard.publication",

  // SCRIBE EXTENSION — all site metadata lives here
  scribe: {
    domain: string,      // domain name e.g. "norobots.blog" (→ Site.url in SDK)
    basePath: string,    // path prefix e.g. "blog" — empty string if none (→ Site.urlPrefix)
    title: string,
    description?: string,
    splashImageUrl?: string,
    logoImageUrl?: string,
    groups: Array<{
      slug: string,
      title: string,
      articles: ArticleRef[],  // cached snapshots — no N+1 fetches needed
    }>,
    ungroupedArticles: ArticleRef[],  // legacy — no current write path populates this; always empty (ADR 0013)
    createdAt: string,
    updatedAt: string,
  },
}
```

**`site.standard.document`** — all articles (rkey = TID):
```ts
{
  // SPEC — top-level only, per site.standard.document lexicon
  $type: "site.standard.document",
  site: string,          // ADR 0013 — the sole loose-vs-published signal. Either the owning
                         // publication's AT URI ("at://did:plc:.../site.standard.publication/3abc")
                         // once published, or a loose reader URL
                         // ("https://reader.scribe-atp.app/{did}/site.standard.document/{rkey}")
                         // before publish. Never a bare domain string.
  title: string,
  publishedAt?: string,  // ISO 8601 — omitted if blank
  path?: string,         // full URL path e.g. "/blog/my-article"
  description?: string,
  coverImage?: blob,     // <1MB thumbnail
  content?: { $type: "app.scribe.content.html", html: string },
  textContent?: string,  // HTML stripped to plaintext
  bskyPostRef?: { uri: string, cid: string },
  tags?: string[],
  contributors?: { did: string; role?: string; displayName?: string }[],
  updatedAt?: string,

  // SCRIBE EXTENSION — Scribe-specific fields not in the spec
  scribe: {
    domain?: string,        // domain name e.g. "norobots.blog" — omitted while loose (ADR 0013)
    createdAt: string,      // ISO 8601 — article creation date
    coverImageUrl?: string, // source URL for the cover image (→ Article.coverImageUrl)
    canonicalUrl?: string,  // fully-qualified article URL (→ Article.canonicalUrl) — omitted while loose
  },
}
```

Article state (ADR 0013 — two states, not three):
- **Draft** — `site` holds a loose reader URL; not referenced by any `site.standard.publication` record at all
- **Published** — `site` holds the owning publication's AT URI; referenced in that publication's `scribe.groups[].articles`

An article belongs to at most one publication at a time. The old middle state (`referenced in scribe.ungroupedArticles`, assigned to a site but not yet grouped) no longer exists — assignment and grouping happen together, atomically, at publish time. `ungroupedArticles` remains in the schema for backwards compatibility but no current write path populates it.

`app.scribe.article` and `app.scribe.site` are **legacy collections — no longer used**. All content is in `site.standard.document` and `site.standard.publication`.

**`ArticleRef`** — cached snapshot stored inside a publication record:
```ts
{
  uri: string,           // full AT URI e.g. at://did/site.standard.document/3mp4hfovqib2h
  title: string,
  slug?: string,         // human-readable slug stored inside the document record
  splashImageUrl: string | null,
  description?: string | null,
  tags?: string[],
  createdAt: string,
  publishedAt?: string,
  updatedAt?: string,
}
```

AT Protocol repos are **publicly readable without authentication**. No OAuth required for reading.

## PDS resolution — the critical fix

The previous implementation in `scribe-cms.app/app/hooks/` hardcoded `https://public.api.bsky.app` for all XRPC calls. This proxies correctly for `did:plc` accounts on bsky.social but **fails for `did:web` and self-hosted PDS instances**.

The correct flow is:

### Step 1 — resolve handle to DID (if needed)

If `author` is a handle (no `did:` prefix), call `resolveHandle`:
```
GET https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle={handle}
→ { did: "did:plc:..." }
```

Handles can be accepted as a convenience; DIDs are the stable identity.

### Step 2 — resolve DID to PDS endpoint

DID document shape:
```json
{
  "id": "did:plc:...",
  "service": [
    { "id": "#atproto_pds", "type": "AtprotoPersonalDataServer", "serviceEndpoint": "https://bsky.social" }
  ]
}
```

**`did:plc`** — fetch from the PLC directory:
```
GET https://plc.directory/{did}
```

**`did:web`** — construct the well-known URL:
```
GET https://{did-without-did:web:}/.well-known/did.json
```

Find the service entry with `id === "#atproto_pds"` and read `serviceEndpoint`. That is the PDS base URL.

### Step 3 — fetch records from the PDS

Use the resolved PDS URL for all XRPC calls:
```
GET {pdsUrl}/xrpc/com.atproto.repo.getRecord?repo={did}&collection=...&rkey=...
```

### Implementation in `@skyscribe-sdk/core`

```
packages/core/src/
  types.ts          — ArticleRef, SiteGroup, Site, SiteRecord, Article (exported)
  resolve.ts        — resolveIdentifier(), resolvePds() (internal helpers)
  fetch.ts          — fetchSite(), fetchArticle() (exported)
  list.ts           — listSites(), listArticles() (exported) — com.atproto.repo.listRecords with cursor pagination
  utils.ts          — toSlug(), slugFromUri(), flattenArticles() (exported)
  feed.ts           — generateFeed() (exported) — RSS 2.0, hand-rolled XML
  sitemap.ts        — getSitemapEntries() (exported) — returns SitemapEntry[] for merging into framework sitemap generators
  errors.ts         — NotFoundError, PdsFetchError, PdsUnreachableError (exported) — see "Typed errors and retry" below
  retry.ts          — withRetry() (exported) — generic, opt-in retry-with-backoff wrapper
  http.ts           — pdsFetch() (internal) — every fetch() call site in this package goes through it
  analytics.ts      — loadSiteAnalytics(), siteAnalyticsScriptTag(), siteAnalyticsScript() (exported) — the Site Analytics beacon; owns the shared Cloudflare token (skyscribe-app ADR 0086)
  index.ts          — re-exports everything public
```

`resolvePds(did)` should cache results in a `Map` for the lifetime of the module so repeated calls within a single page load don't re-fetch the DID document.

`resolveIdentifier(handleOrDid)` → DID (already correct in the original, just moves here).

`fetchSite(author, siteSlug)` and `fetchArticle(author, articleSlug)` call `resolveIdentifier` then `resolvePds` then the XRPC endpoint. Both functions should be cancellable via `AbortSignal` passed as an optional third argument.

### Typed errors and retry

Every fetch function throws one of three typed errors (all exported from `@skyscribe-sdk/core`), never a raw `Error`:

- **`NotFoundError`** — the fetch succeeded, the record genuinely doesn't exist (bad slug, deleted record, unresolvable handle). Retrying won't help.
- **`PdsFetchError`** — the PDS responded, but with a non-ok HTTP status. The service is up, this operation failed. Safe to retry.
- **`PdsUnreachableError`** (extends `PdsFetchError`) — the request never got a response at all (DNS failure, connection refused, timeout — `fetch()` itself rejected). Safe to retry, but suggests a broader outage rather than a one-off blip.

**Every internal `fetch()` call must go through `http.ts`'s `pdsFetch()` wrapper**, not the global `fetch()` directly — that's what produces the `PdsUnreachableError` vs. `PdsFetchError` split (it catches a rejected `fetch()` and reclassifies it, while a resolved-but-non-ok `Response` is left for the caller's own `!res.ok` check to turn into `PdsFetchError`). A new fetch function that calls raw `fetch()` will silently leak unclassified errors on connection failure — this was a real bug fixed retroactively across `fetch.ts`, `resolve.ts`, `list.ts`, and `profile.ts`.

`withRetry(fn, options)` (`retry.ts`) is a generic, opt-in retry-with-backoff wrapper — default 5 attempts, exponential backoff (`[300, 600, 1200, 2400]`ms). It never retries `NotFoundError` or an aborted signal; everything else is retried, including plain `Error`s from callers that haven't adopted the typed errors. **Not called automatically by any fetch function** — consumers call it themselves. This matters for callers like `@skyscribe-sdk/next`'s build-time `generateStaticParams`, where failing fast is usually preferable to eating several seconds of backoff during a build.

Consumer-facing usage pattern (attempt once synchronously, stream retries behind a `Suspense` boundary on failure) is documented in `scribe-atp-docs`'s "Errors and retries" guide, and implemented independently in `norobots`, `perpetual-summer-ltd`, `anthonycregan.co.uk-2025` (2-way: not-found vs. everything else), and `scribe-atp-reader` (3-way: also distinguishes `PdsUnreachableError`, since Reader visitors can trigger it more meaningfully than a fixed-author site would).

## Fetching an article: slug vs. rkey

Article rkeys are opaque TIDs, so **slug-based helpers are the default for article pages**: `fetchArticleBySlug` (core), `useArticleBySlug` (react), `useScribeArticleBySlug` (vue, nuxt), `injectArticleBySlug` / `ScribeService.getArticleBySlug` (angular), `createArticleRouteLoader` (react-router-framework). They look the slug up in the Site record and return the article with its AT URI. The older `fetchArticle` / `useArticle` / `useScribeArticle` / `injectArticle` / `getArticle` take the **rkey** (their parameter was misleadingly named `articleSlug` until it was renamed in the 2026-10 release). When fetching from an `ArticleRef`, take the account from `ref.uri` as well as the rkey, because an article credited to a contributor can live in their repo.

## `@skyscribe-sdk/react` — hooks

```
packages/react/src/
  useSite.ts        — useSite(author, siteSlug) → { site, loading, error }
  useArticle.ts     — useArticle(author, articleSlug) → { article, loading, error }
  SiteAnalytics.tsx — <SiteAnalytics /> — adds the beacon in an effect (React doesn't run client-created <script>s), renders nothing
  index.ts          — re-exports hooks and all types from core
```

Hooks are thin wrappers — all fetch logic lives in `@skyscribe-sdk/core`. Each hook:
- Creates an `AbortController` in `useEffect`
- Passes `controller.signal` to the core fetch function
- Returns `() => controller.abort()` as cleanup
- Sets `{ loading: true }` on mount and on parameter change
- Catches errors into the `error` state

Re-export all types from `@skyscribe-sdk/core` so consumers only need to import one package.

## `@skyscribe-sdk/react-router-framework` — loader factories

```
packages/react-router-framework/src/
  loaders.ts        — createSiteLoader(), createArticleLoader()
  index.ts          — re-exports loaders and all types from core
```

Factories return a loader function compatible with React Router v7/v8 framework mode. Each factory:
- Accepts `author` and `siteSlug`/`articleSlug` at configuration time
- Returns a loader that extracts `request.signal` and passes it to the core fetch function

## `@skyscribe-sdk/angular` — service and injection functions

```
packages/angular/src/
  scribe.service.ts     — ScribeService (@Injectable providedIn: 'root') — Observable API
  inject-site.ts        — injectSite() — Signals API
  inject-article.ts     — injectArticle() — Signals API
  index.ts              — re-exports everything public
```

Ships two APIs. `ScribeService` returns cold Observables; the fetch is cancelled on unsubscribe. `injectSite`/`injectArticle` return readonly signals and abort on `DestroyRef.onDestroy`. Requires `experimentalDecorators: true` and `useDefineForClassFields: false` in tsconfig.

## `@skyscribe-sdk/next` — Next.js App Router adapter

```
packages/next/src/
  create-scribe-site.ts — createScribeSite(author, siteSlug) factory
  index.ts              — re-exports factory and all types from core
```

`createScribeSite` returns an object with six async functions assigned directly to Next.js named exports:
- `generateGroupParams`, `generateArticleParams`, `generateGroupArticleParams` — for `generateStaticParams`
- `generateSiteMetadata`, `generateGroupMetadata`, `generateArticleMetadata` — for `generateMetadata`

Metadata is opinionated (complete OpenGraph by default). Uses `ArticleRef` snapshots from the site record — no per-article fetch at build time. ISR is handled by Next.js route segment config (`export const revalidate`), not by the SDK.

## `@skyscribe-sdk/vue` — Vue 3 composables

```
packages/vue/src/
  useScribeSite.ts    — useScribeSite(author, siteSlug) → { site, loading, error } (Refs)
  useScribeArticle.ts — useScribeArticle(author, articleSlug) → { article, loading, error } (Refs)
  SiteAnalytics.ts    — <SiteAnalytics /> component — adds the beacon on mount, renders nothing
  index.ts            — re-exports composables and all types from core
```

Composables use `onUnmounted` for `AbortController` cleanup. Named with `Scribe` prefix (`useScribeSite` not `useSite`) to avoid collision in Nuxt's auto-import context.

## `@skyscribe-sdk/nuxt` — Nuxt 3 module

```
packages/nuxt/src/
  module.ts                        — defineNuxtModule, registers auto-imports
  composables/useScribeSite.ts     — wraps fetchSite with useAsyncData
  composables/useScribeArticle.ts  — wraps fetchArticle with useAsyncData
  composables/useScribeArticleBySlug.ts — wraps fetchArticleBySlug with useAsyncData (slug from the URL)
  composables/useSiteAnalytics.ts  — puts the Site Analytics beacon in the head via useHead (server-rendered)
  index.ts                         — re-exports module and all types from core
```

Full Nuxt module — registered in `nuxt.config.ts` as `modules: ['@skyscribe-sdk/nuxt']`. Auto-imports everything in `src/composables/` globally. **Packaging:** `module.ts` points `addImportsDir` at `./composables` next to the built entry, so `tsup.config.ts` builds each composable into `dist/composables/` (ESM only; a CJS copy would register each twice). Before 1.3.0 only `src/index.ts` was built and no composables shipped at all. A new composable needs no config change (the tsup config reads the folder), but check `npm pack --dry-run` lists it. Returns Nuxt conventions (`data`, `pending`, `error`). Accepts optional `useAsyncData` options as third argument. Calls `fetchSite`/`fetchArticle` from core directly (not the vue composables) to let `useAsyncData` own the SSR lifecycle.

## Relationship to scribe-cms.app

`scribe-cms.app` currently has an `app/hooks/` directory with the original versions of these hooks (without PDS resolution). Once this SDK is published:

- `scribe-cms.app`'s `app/hooks/` directory can be removed
- The CMS's public-read routes can import from `@skyscribe-sdk/core`
- The `ArticleRef` and `SiteGroup` types used throughout the CMS already live in `app/hooks/types.ts` — these become the canonical definitions in `@skyscribe-sdk/core`

During development, use `npm link` or workspace references to test against the CMS before publishing.

## Build setup (per package)

`tsup.config.ts`:
```ts
import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["peer-dep-name"], // list peer deps here
});
```

`package.json` exports map:
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

## Testing

Tests live alongside source in each package (`src/fetch.test.ts`, etc.).

**Core tests** — mock `fetch` globally with `vi.stubGlobal("fetch", ...)` and assert the correct URLs are constructed for each DID type. Test the PDS resolution cache (call `resolvePds` twice with the same DID, verify only one fetch).

**React hook tests** — use `@testing-library/react`'s `renderHook`. Mock the core fetch functions with `vi.mock("@skyscribe-sdk/core")` to isolate hook logic from network behaviour.

**Vue composable tests** — use `@vue/test-utils` `mount` with a minimal wrapper component. Mock `@skyscribe-sdk/core` with `vi.mock`. Test: loading state, data on resolve, error on reject, abort on unmount.

**Angular tests** — require `zone.js` and `TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting())` in `test-setup.ts`. Use `TestBed.runInInjectionContext()` to test injection functions. `tsconfig.check.json` requires `experimentalDecorators: true` and `useDefineForClassFields: false`.

**Nuxt composable tests** — mock both `@skyscribe-sdk/core` and `#app` with `vi.mock`. The `#app` alias is resolved via a Vitest alias pointing to `packages/nuxt/node_modules/nuxt/dist/app/index.mjs`. Use `(mockUseAsyncData as any).mockImplementation(...)` to avoid fighting nuxt's complex overload types in tests.

## Key commands

```bash
npm install              # install all workspace deps
npm run build            # build all packages (tsup)
npm run test             # run all tests (vitest)
npm run typecheck        # tsc --noEmit across all packages
npm -w packages/core run build   # build a single package
```

## Publishing

Packages publish to npm under `@skyscribe-sdk/` through **npm staged publishing** (ADR 0003). Versions are independent (each package has its own semver). `NPM_TOKEN` is a stage-only granular token: CI can upload a version, but it only goes live once a maintainer approves it with 2FA. **Never call `npm publish` or `npx changeset publish` in CI.** The token is refused with `E_STAGE_REQUIRED`.

**Workflow:**
1. Create a changeset: `npx changeset` — select affected packages and bump type
2. Run `npx changeset version` — updates `package.json` versions and `CHANGELOG.md` files
3. Commit the version bump: `chore: version packages — <package>@<version>`
4. Merge to main and trigger the manual `publish` job in CI. It runs `scripts/stage-publish.sh`, which runs `npm stage publish` in each package whose version isn't on npm yet.
5. Approve each stage locally (npm CLI 11.15+): `npm login`, `npm stage list`, then `npm stage approve <stage-id> --otp=<code>`

New packages (never published) do not need a changeset: the script stages any version that isn't on npm yet.

Granular write tokens last 90 days at most (the current one expires 2027-01-03). A sudden E401/E403 from the publish job usually means the token has expired.

## Docs app (`apps/docs`, sdk.skyscribe.app)

A private workspace (ADR 0003): React Router, fully prerendered (`ssr: false`), served by an assets-only Cloudflare Worker. Its look is copied from skyscribe-app (styles, shell, Omnibar matcher); each copied file says where it came from.

- **Pages:** `app/docs/nav.ts` is the single list (side menu, sidebar, prev/next, prerender list, sitemap, search index). Content is `app/content/<slug>.mdx`. URLs are permanent; two older URL schemes redirect into them.
- **Commands:** `npm run docs:dev`, `npm run docs:build` (pre: search index; post: `scripts/postbuild.ts`), `npm run check-links -w apps/docs`. Preview the real Cloudflare behaviour with `npm run preview -w apps/docs` (`wrangler dev`). `vite preview` serves the root index.html for every path, which looks like a hydration bug but isn't one.
- **Search:** `scripts/build-search-index.ts` → `public/search-index.json` (generated, gitignored): titles, h2/h3 headings, and API names from inline code.
- **CSP:** a per-page `<meta>` with hashes of that page's inline scripts, added by `postbuild.ts`. Never add an inline `<script>` that differs between build and runtime. `frame-ancestors` and other headers live in `public/_headers`.
- **Vite 7, not 8:** vitest 3 hoists Vite 7 and `@react-router/dev` must use the same copy.
- **Deploy:** the manual `docs:deploy` CI job on `main` (needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`). It's separate from `publish`, so docs for a new API can wait until the package is on npm.
- **Docs rule:** an API change and its docs go in the same MR.

## Branch protection

`main` is a protected branch. All changes require a feature branch and MR. No direct pushes to main.

## Branding context

- **SkyScribe** (`skyscribe.app`) — the authoring app and site builder (`skyscribe-app` repo)
- **SkyScribe SDK** — this repo; the developer toolkit for building an SDK-driven website. npm org `@skyscribe-sdk` (`@skyscribe` was taken by an unrelated npm user). Docs are moving to `sdk.skyscribe.app`.
- **Scribe ATP** — the original umbrella project, being folded into SkyScribe (ADR 0003). Its packages (`@scribe-atp/*`) get deprecated once the new docs site is live.
- **Scribe CMS** (`scribe-cms.app`) — the original authoring tool (separate repo). Stays on `@scribe-atp/*` until it's retired.

See `scribe-cms.app`'s CLAUDE.md for the full Scribe CMS architecture, AT Protocol collection schemas, and OAuth patterns.
