# @skyscribe-sdk/social

## 1.6.0

### Minor Changes

- The buttons call the Social service at its SkyScribe address, `social.skyscribe.app` (the old `social.scribe-atp.app` redirects there, so earlier versions keep working). `SubscribeButton` is now the **Follow** button: its default label is "Follow" / "Following ✓" and it opens `/follow` and `/unfollow`. Buttons work on their Publication's own website without registering it.

## 1.5.0

### Minor Changes

- Export `clearSubscribed`, for removing a saved subscription from `localStorage` when you build your own unsubscribe UI. It already existed but wasn't exported.

## 1.4.2

### Patch Changes

- Renamed from `@scribe-atp/*` to `@skyscribe-sdk/*` as part of the move to the SkyScribe SDK. Only the package name changes: every export, hook, type and CSS class keeps its name, and version numbers continue from the old package. To migrate, replace `@scribe-atp/` with `@skyscribe-sdk/` in your imports and `package.json`.

## 1.4.1

### Patch Changes

- Fix a mangled character in the README's SubscribeButton example (a checkmark rendered as replacement bytes on the published npm page). No code changes — republishing is the only way to fix a broken README on an already-published version.

## 1.4.0

### Minor Changes

- Add unsubscribe support to SubscribeButton. When already subscribed, clicking the button now opens an unsubscribe confirmation popup instead of doing nothing. New `onUnsubscribe` callback prop mirrors the existing `onSuccess` prop.

## 1.3.1

### Patch Changes

- Internal refactoring — no public API changes.

  `@scribe-atp/social`: extract shared popup/polling/postMessage machinery into a `useSocialAction` hook. `LikeButton`, `ShareButton`, and `SubscribeButton` are now thin adapters; all behaviour is identical.

  `@scribe-atp/core`: expose `_clearAllCaches()` (consolidates `publicationUriCache`, `handleCache`, and `pdsCache` into a single test seam). Replaces the previous `_clearPublicationUriCache()`.

## 1.3.0

### Minor Changes

- Add `ShareButton` component, `children` render prop, `onSuccess` callback, `defaultLiked`/`defaultSubscribed` SSR props, and `aria-pressed` accessibility improvements to `@scribe-atp/social`.

  - **`ShareButton`** — new component for sharing articles to Bluesky via popup OAuth
  - **`children`** — all three buttons now accept a render prop `(state: boolean) => ReactNode` or static `ReactNode` to customise the button label
  - **`onSuccess`** — callback fired on all three buttons after a successful like, share, or subscription
  - **`defaultLiked` / `defaultSubscribed`** — pass initial state from an SSR loader to avoid a flash of unconfirmed state on first render
  - **`className`** — all three buttons now accept an optional class to append alongside the base `scribe-atp-*` class
  - **Accessibility** — `LikeButton` and `SubscribeButton` now use `aria-pressed` instead of `disabled`, keeping the button in the tab order after activation
  - **`publicationUri`** (breaking) — `LikeButton` now requires a `publicationUri` prop so the social service can record which publication a like belongs to; pass `site.uri` from the SDK

## 1.2.0

### Minor Changes

- Add `ShareButton` component — lets readers share articles to their own Bluesky feed via popup OAuth. Creates an `app.bsky.feed.post` with `app.bsky.embed.external` and `associatedRefs` pointing to the `site.standard.document` and `site.standard.publication` records for rich card support.

## 1.1.1

### Patch Changes

- Fix LikeButton and SubscribeButton not updating after OAuth — poll /status/:token when popup closes as fallback for COOP-blocked postMessage

## 1.1.0

### Minor Changes

- Like and Subscribe buttons
