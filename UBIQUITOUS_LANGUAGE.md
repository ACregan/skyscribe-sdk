# Ubiquitous Language — SkyScribe SDK

This document defines the shared vocabulary used across the SDK codebase,
documentation, and conversations. When a term appears in code, tests, or
discussion, it should match the definition here.

---

## Project & Brand

**SkyScribe** (`skyscribe.app`)
: The authoring app and site builder where writers create and publish
  their content. Separate repo; not part of this SDK.

**Scribe CMS** (`scribe-cms.app`)
: The original authoring tool. Writes the same records as SkyScribe and is
  being retired. Separate repo.

**SkyScribe SDK** (this repo)
: The developer toolkit for showing SkyScribe content on an SDK-driven
  website. Published to npm under the `@skyscribe-sdk/` scope.
  _Avoid_: "Scribe ATP SDK", "Scribe SDK" (pre-migration names).

**SDK-driven website**
: A website a developer builds themselves with the SkyScribe SDK, not via
  SkyScribe's site design wizard (that makes a SkyScribe Site).
  _Avoid_: "self-hosted", "your own website".

**`@skyscribe-sdk/core`**
: The framework-agnostic package. Pure TypeScript fetch functions, PDS
  resolution logic, and shared types. No runtime dependencies.

**`@skyscribe-sdk/react`**
: The React adapter. Thin hooks wrapping `@skyscribe-sdk/core` with
  idiomatic React state management and cleanup.

**`@skyscribe-sdk/react-router-framework`**
: Loader factories for React Router v7 framework mode. Wraps core fetch
  functions in the loader/signal conventions of React Router's server-side
  data loading model.

**`@skyscribe-sdk/angular`**
: The Angular adapter. Provides `ScribeService` (Observable API) and
  `injectSite` / `injectArticle` (Signals API) wrapping `@skyscribe-sdk/core`
  with idiomatic Angular reactivity and cleanup.

---

## AT Protocol Concepts

**AT Protocol (ATP)**
: The open social networking protocol on which Scribe is built. Defines
  how identity, data storage, and record fetching work.

**DID (Decentralized Identifier)**
: A stable, globally unique identifier for an author (e.g.
  `did:plc:abc123`). Handles are human-readable aliases; DIDs are the
  canonical identity that never changes.

**`did:plc`**
: A DID managed by the PLC directory (`plc.directory`). The most common
  type for accounts on bsky.social.

**`did:web`**
: A DID derived from a domain name. The DID document is fetched from
  `https://{domain}/.well-known/did.json`. Used by self-hosted instances.

**Handle**
: A human-readable username (e.g. `alice.bsky.social`). Must be resolved
  to a DID before any data can be fetched. Not stable — authors can change
  their handle; DIDs cannot change.

**PDS (Personal Data Server)**
: The server that hosts an author's AT Protocol repository. All Scribe
  content records are stored on and served from the author's PDS. May be
  self-hosted or a shared provider (e.g. bsky.social).

**PDS resolution**
: The process of discovering the correct PDS URL for a given DID.
  Involves fetching the DID document and reading the `#atproto_pds` service
  endpoint. See `packages/core/src/resolve.ts`.

**DID document**
: A JSON document that maps a DID to its service endpoints. The relevant
  field is the service entry with `id === "#atproto_pds"`.

**XRPC**
: The HTTP-based RPC protocol used by AT Protocol. Calls take the form
  `GET {pdsUrl}/xrpc/{method}?{params}`.

**AT URI**
: A URI that fully addresses a record in the AT Protocol network.
  Format: `at://{did}/{collection}/{rkey}`.
  Example: `at://did:plc:abc123/site.standard.document/3mp4hfovqib2h`.

**rkey (Record Key)**
: The unique key for a record within a collection on a PDS. For Scribe,
  the rkey is typically the slug (e.g. the site slug or article slug).

**Collection**
: A namespaced bucket of records on a PDS. Scribe uses two:
  `site.standard.publication` and `site.standard.document`.

---

## Scribe Domain Concepts

**Site**
: An author's publication — the top-level container for all their
  articles. Stored as a record in the `site.standard.publication` collection.
  Carries metadata (title, description, logo) and the full list of articles
  via `groups` and `ungroupedArticles`.

**Site URL (`url`)**
: The domain (TLD) of the site, e.g. `anthonycregan.co.uk`. Does not
  include a protocol or path.

**URL prefix (`urlPrefix`)**
: An optional path segment under which all site content lives. A prefix
  of `blog` means the site root is `anthonycregan.co.uk/blog` and all
  groups and articles are children of that path:
  `{url}/{urlPrefix}/{group-slug}/{article-slug}`.
  When blank, groups are immediate children of the domain:
  `{url}/{group-slug}/{article-slug}`.

**Site slug**
: The `rkey` used to fetch a site record. Derived automatically from the
  site's domain at creation time — not entered or editable by the author.
  Derivation rule: replace every `.` with `-`, then strip all remaining
  non-alphanumeric characters.
  Example: `norobots.blog` → `norobots-blog`.
  Defined in Scribe CMS as `url.replace(/\./g, "-").replace(/[^a-z0-9-]/g, "")`.

**Article**
: A single piece of written content. Stored as a `site.standard.document`
  record on the author's PDS. In the Draft state, `publishedAt` is absent
  and the record is not referenced by any Site record at all — assigning
  an article to a Site and placing it in a named group happen together,
  in one atomic Publish step (Scribe CMS ADR 0013). There is no
  intermediate "assigned but ungrouped" state.

**Article slug**
: The human-readable URL segment for an article (e.g. `my-first-post`).
  Stored in the `slug` field of the `site.standard.document` record.
  Distinct from the article's AT Protocol rkey, which is a TID.

**`publishedAt`**
: The timestamp of the instant an article is first published — i.e. when
  its article ref is first moved from `ungroupedArticles` into a named group.
  Set once at publish time; never updated thereafter. Absent on articles that
  have not yet been published.

**`createdAt`**
: A Scribe extension field on `site.standard.document` records. Records
  the instant the article was first created. Stored in `scribe.createdAt`.
  Set once; never changed. Distinct from `publishedAt` — an article may
  remain unpublished for days or weeks before being published.

**ArticleRef**
: The internal schema type for a lightweight article snapshot cached
  inside the site record. Contains enough metadata (title, slug, synopsis,
  splash image) to render an article list without fetching each article
  individually. Avoids N+1 fetch patterns. A code-level concept intended
  for developers; not surfaced in the Scribe CMS UI.

**SEO Settings**
: An author's optional search-engine settings for one article, set in
  SkyScribe and stored as `scribe.seo` on the record: an SEO title and SEO
  description (used in the head instead of the article's own) and
  noindex. Exposed as `Article.seo` (type `DocumentSeo`); an ArticleRef
  carries only `noindex`. The meta helpers and `getSitemapEntries` apply
  them (ADR 0004).

**Group (SiteGroup)**
: A named collection of articles within a site, used to organise content
  into sections or categories. Each group has a `slug` and `title` and
  carries an array of `ArticleRef`s.

**Ungrouped articles**
: The `ungroupedArticles` field on the site record. Legacy — under the
  current (ADR 0013) model no article can ever end up here, since Publish
  assigns a Site and places the article in a named group in the same
  step. The field remains in the schema and the `Site` type for backwards
  compatibility with older content; expect it to always be an empty array.
  Do not build features that assume it is populated.

**Article's `site` field**
: Identifies which Site (if any) a `site.standard.document` record
  belongs to. Holds one of two shapes (ADR 0013, the sole loose-vs-published
  signal): a plain `https://` reader URL
  (`https://reader.scribe-atp.app/{did}/site.standard.document/{rkey}`)
  when the article is a Draft, or the owning Site's own `at://` record URI
  (`at://{did}/site.standard.publication/{rkey}`) once published. Never a
  bare domain string, and never set independently of Group placement.

**Publication states**
: The two states an article can be in, from the perspective of
  visibility and site assignment (revised by ADR 0013 — previously
  described as three states, with a "Draft" that was already assigned to
  a site via `ungroupedArticles`; that middle state no longer exists):
  - **Draft** — the article exists as a `site.standard.document` record
    but is not referenced in any Site record. `publishedAt` is absent.
  - **Published** — the article is referenced in a named group within a
    Site record. `publishedAt` is set, `site` holds that Site's `at://`
    URI, and it has a canonical URL on the author's consumer site.

  An article belongs to at most one Site at a time — there is no
  "published to multiple sites with a nominated canonical one" case.
  The old **Canonical Site** concept (nominating one of several sites an
  article was cross-posted to) no longer exists; site membership and
  canonical identity are now the same thing, since there is only ever
  one site.

---

## SDK Concepts

**Author**
: The person who created the content. Identified by a DID or handle.
  Passed as the first argument to all core fetch functions and hooks.

**Developer**
: A person using this SDK to display Scribe content in their own
  application or site. The intended audience of all public API surfaces,
  documentation, and error messages.

**AbortSignal**
: Passed as an optional argument to core fetch functions, and wired up
  automatically by framework adapters, to cancel in-flight requests when a
  component unmounts, parameters change, or a subscription is cancelled.

**PDS cache**
: An in-memory `Map` inside `packages/core/src/resolve.ts` that stores
  resolved PDS endpoints keyed by DID. Prevents redundant DID document
  fetches within a single page load.

**Publication URI cache**
: An in-memory `Map` inside `packages/core/src/fetch.ts` that stores each
  resolved `site.standard.publication` AT URI keyed by DID + publication
  URL, avoiding a `listRecords` call on every `fetchSite` request. Entries
  expire after 60 seconds, and `fetchSite` self-heals immediately if a
  cached entry's `getRecord` call fails (e.g. the record was deleted and
  recreated) by dropping it and falling back to a fresh `listRecords`
  lookup — so a long-running consumer process never needs a manual restart
  to recover.

**Injection function**
: An Angular-idiomatic function (e.g. `injectSite`, `injectArticle`) that
  uses Angular's `inject()` API internally. Must be called within an
  injection context (constructor, field initialiser, or
  `runInInjectionContext()`). Returns reactive signals and registers cleanup
  via `DestroyRef`.

**Observable**
: An RxJS lazy data stream returned by `ScribeService` methods. Cold —
  the fetch does not start until subscribe is called. Cancels the underlying
  request when unsubscribed.

**Signal**
: An Angular reactive primitive (Angular 16+) returned by injection
  functions. Synchronously readable via `signal()` call syntax. Updated
  in-place as the fetch resolves.
