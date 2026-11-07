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

## Domain Concepts

The SDK uses the site.standard names wherever the spec has one
(Publication, Document), and SkyScribe's name for the rest (Category), so
the SDK, SkyScribe and the records all say the same thing (decided
2026-11-07, see ADR 0005).

**Publication**
: An author's `site.standard.publication` record: the top-level container
  for their Documents. Carries metadata (title, description, logo) and the
  full list of Documents, arranged in Categories. One author can have
  several.
  _Avoid_: "Site" (in SkyScribe a Site is the hosted website built for a
  Publication), "blog".

**Publication URL**
: The spec-defined base URL of a Publication, the `url` field of its
  record, e.g. `https://anthonycregan.co.uk`. No trailing slash. The
  lookup key for a Publication.

**Domain**
: The bare domain a Publication's website lives on, e.g.
  `anthonycregan.co.uk`: no protocol, no path. Links are built from the
  domain and the base path.

**Base path**
: An optional path segment under which all of a Publication's Documents
  live. A base path of `blog` puts them at
  `{url}/blog/{category-slug}/{document-slug}`; when blank, Categories are
  immediate children of the domain.
  _Avoid_: "URL prefix".

**Publication slug**
: A stable identifier derived from a Publication's domain
  (`norobots.blog` → `norobots-blog`). Not a lookup key and not the rkey.

**Document**
: One piece of authored content: a `site.standard.document` record on the
  author's PDS. In the Draft state it is referenced by no Publication;
  assigning it to a Publication and placing it in a Category happen
  together, in one Publish step.
  _Avoid_: "Article", "post".

**Document slug**
: The human-readable URL segment for a Document (e.g. `my-first-post`).
  Distinct from the Document's rkey, which is a TID.

**`publishedAt`**
: The instant a Document is first published, i.e. first placed in a
  Category. Set once; absent on Drafts.

**`createdAt`**
: The instant a Document was first created (`scribe.createdAt`). Set once.
  A Document may stay a Draft for weeks before `publishedAt` is set.

**Document ref**
: A lightweight snapshot of a Document cached inside its Publication's
  record: enough (title, slug, description, image) to list Documents
  without fetching each one. For developers; never shown to authors.
  _Avoid_: "summary".

**SEO Settings**
: An author's optional search-engine settings for one Document, set in
  SkyScribe: an SEO title and SEO description (used in the head instead of
  the Document's own) and noindex. A Document ref carries only noindex.
  The meta helpers and sitemap entries apply them (ADR 0004).

**Category**
: A named, ordered set of Documents within a Publication: a section of
  the website. Has a slug (its URL segment) and a title. Stored inside the
  Publication record (`scribe.groups[]`), not as a record of its own; the
  spec has no equivalent.
  _Avoid_: "Group" (the old SDK and Scribe CMS name), "section",
  "collection" (an AT Protocol term).

**Uncategorised Documents (legacy)**
: The `scribe.ungroupedArticles` field on old Publication records. Under
  the current model no Document can end up there; expect it empty and
  don't build features that read it.

**Document's `site` field**
: Which Publication, if any, a Document belongs to: the Publication's
  `at://` URI once published, or a plain `https://` reader URL while a
  Draft. Never set independently of Category placement.

**Scribe extension**
: The fields SkyScribe (and Scribe CMS) add to site.standard records beyond
  the spec, kept in a `scribe` object so the top level stays spec-only:
  Categories, base path, SEO Settings, the HTML content format and so on.
  Its presence marks a record as written by SkyScribe or Scribe CMS rather
  than by another site.standard app. "Scribe" in an SDK name (e.g.
  `ScribeContent`, `useScribePublication`) means "understands the Scribe
  extension", not the old Scribe brand.
  _Avoid_: "custom fields", "extra fields".

**Publication states**
: A Document is in one of two states:
  - **Draft**: referenced by no Publication; `publishedAt` absent.
  - **Published**: in a Category of exactly one Publication;
    `publishedAt` set, and it has a canonical URL on that Publication's
    website.

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
