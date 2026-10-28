# @skyscribe-sdk/social

[![npm](https://img.shields.io/npm/v/@skyscribe-sdk/social)](https://www.npmjs.com/package/@skyscribe-sdk/social)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)

React components for adding social interactions — likes, shares, and follows — to [SkyScribe](https://skyscribe.app) articles. Works with any React-based framework (React Router, Next.js, etc.).

Interactions are powered by the AT Protocol via `social.skyscribe.app`. When a user clicks a button, a popup opens for them to sign in with their Bluesky account. The result is written to their AT Protocol repository and reported back to the originating page. A button only works on its own Publication's website (the Publication's `url`, or a SkyScribe Site showing it). `SubscribeButton` is the **Follow** button.

## Installation

```bash
npm install @skyscribe-sdk/social
```

Requires React 18 or later as a peer dependency.

## Components

### `LikeButton`

Creates an AT Protocol `app.bsky.feed.like` record ("recommend") for an article when clicked.

```tsx
import { LikeButton } from "@skyscribe-sdk/social";

<LikeButton
  documentUri="at://did:plc:abc123/site.standard.document/3jxtctq7kqm2y"
  publicationUri="at://did:plc:abc123/site.standard.publication/3mp4nd46xwr2h"
  title="My Article Title"
/>
```

| Prop | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `documentUri` | `string` | ✓ | AT URI of the `site.standard.document` record |
| `publicationUri` | `string` | ✓ | AT URI of the `site.standard.publication` record |
| `title` | `string` | ✓ | Article title — shown in the like popup |
| `serviceUrl` | `string` | — | Override the social service URL. Defaults to `https://social.skyscribe.app` |
| `className` | `string` | — | Additional CSS class appended to the base `scribe-atp-like-button` class |
| `children` | `ReactNode \| ((isLiked: boolean) => ReactNode)` | — | Custom button label. Omit to use the defaults `"Like"` / `"Liked ✓"` |
| `onSuccess` | `() => void` | — | Called after a successful like |
| `defaultLiked` | `boolean` | — | Initial liked state. Pass `true` from an SSR loader to avoid a flash of unconfirmed state on first render |

#### Customising the label

Pass a **render prop** to access the internal liked state:

```tsx
<LikeButton documentUri={documentUri} publicationUri={publicationUri} title={title}>
  {(isLiked) => (isLiked ? "Loved it ✓" : "Did you enjoy this?")}
</LikeButton>
```

Or pass a **static node** to replace the label entirely:

```tsx
<LikeButton documentUri={documentUri} publicationUri={publicationUri} title={title}>
  ♥ Recommend this article
</LikeButton>
```

### `ShareButton`

Opens a popup for the user to share the article via their Bluesky account.

```tsx
import { ShareButton } from "@skyscribe-sdk/social";

<ShareButton
  documentUri="at://did:plc:abc123/site.standard.document/3jxtctq7kqm2y"
  publicationUri="at://did:plc:abc123/site.standard.publication/3xyz789"
  title="My Article Title"
/>
```

| Prop | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `documentUri` | `string` | ✓ | AT URI of the `site.standard.document` record |
| `publicationUri` | `string` | ✓ | AT URI of the `site.standard.publication` record |
| `title` | `string` | ✓ | Article title — shown in the share popup |
| `canonicalUrl` | `string` | — | Canonical URL of the article. Defaults to `window.location.href` |
| `serviceUrl` | `string` | — | Override the social service URL. Defaults to `https://social.skyscribe.app` |
| `className` | `string` | — | Additional CSS class appended to the base `scribe-atp-share-button` class |
| `children` | `ReactNode \| ((isShared: boolean) => ReactNode)` | — | Custom button label. Omit to use the defaults `"Share"` / `"Shared ✓"` |
| `onSuccess` | `() => void` | — | Called after a successful share |

#### Customising the label

```tsx
<ShareButton documentUri={documentUri} publicationUri={publicationUri} title={title}>
  {(isShared) => (isShared ? "Thanks for sharing! ✓" : "Share this article")}
</ShareButton>
```

Note: after a successful share the button briefly enters its confirmed state before resetting, allowing the user to share again.

### `SubscribeButton`

Follows the author's publication on the AT Protocol when clicked.

```tsx
import { SubscribeButton } from "@skyscribe-sdk/social";

<SubscribeButton
  publicationUri="at://did:plc:abc123/site.standard.publication/3xyz789"
  title="My Site"
/>
```

| Prop | Type | Required | Description |
| ---- | ---- | -------- | ----------- |
| `publicationUri` | `string` | ✓ | AT URI of the `site.standard.publication` record |
| `title` | `string` | ✓ | Publication name — shown in the subscribe popup |
| `serviceUrl` | `string` | — | Override the social service URL. Defaults to `https://social.skyscribe.app` |
| `className` | `string` | — | Additional CSS class appended to the base `scribe-atp-subscribe-button` class |
| `children` | `ReactNode \| ((isSubscribed: boolean) => ReactNode)` | — | Custom button label. Omit to use the defaults `"Follow"` / `"Following ✓"` |
| `onSuccess` | `() => void` | — | Called after a successful subscription |
| `defaultSubscribed` | `boolean` | — | Initial subscribed state. Pass `true` from an SSR loader to avoid a flash of unconfirmed state on first render |

#### Customising the label

```tsx
<SubscribeButton publicationUri={publicationUri} title={title}>
  {(isSubscribed) => (isSubscribed ? "Following ✓" : "Follow this site")}
</SubscribeButton>
```

## Reacting to success

All three buttons accept an `onSuccess` callback fired after the action completes. Use it to show a toast, fire an analytics event, or update surrounding UI:

```tsx
<LikeButton
  documentUri={documentUri}
  publicationUri={publicationUri}
  title={article.title}
  onSuccess={() => toast("Thanks for the like!")}
/>

<SubscribeButton
  publicationUri={publicationUri}
  title="My Site"
  onSuccess={() => analytics.track("subscribe")}
/>
```

## SSR / avoiding flash of unconfirmed state

On SSR frameworks (React Router, Next.js, Nuxt), `LikeButton` and `SubscribeButton` initialise in their unconfirmed state because `localStorage` is unavailable at render time. If you can determine the state server-side (e.g. from a cookie), pass it via `defaultLiked` / `defaultSubscribed` to skip the client-side flash:

```tsx
// app/routes/blog.$slug.tsx (React Router loader)
export async function loader({ request, params }) {
  const cookies = parseCookies(request.headers.get("Cookie") ?? "");
  const defaultLiked = cookies[`scribe:recommended:${documentUri}`] === "1";
  const defaultSubscribed = cookies[`scribe:subscribed:${publicationUri}`] === "1";
  return { ..., defaultLiked, defaultSubscribed };
}

// In your component:
<LikeButton
  documentUri={documentUri}
  publicationUri={publicationUri}
  title={article.title}
  defaultLiked={defaultLiked}
/>
```

When `defaultLiked` / `defaultSubscribed` is provided, the component uses it as the initial state and skips the `localStorage` read on mount.

## How it works

1. The user clicks a button. A popup window opens at `social.skyscribe.app` with the relevant AT URI and a one-time token.
2. The user signs in with their Bluesky account via AT Protocol OAuth.
3. On success, the service writes the like, share, or follow record, then notifies the originating page — via `postMessage` if the popup has access to `window.opener`, or via polling `/status/:token` as a fallback.
4. The button updates to its confirmed state. For `LikeButton` and `SubscribeButton` the result is persisted to `localStorage`; for `ShareButton` the confirmed state resets after 3 seconds.

## Accessibility

`LikeButton` and `SubscribeButton` use `aria-pressed` to communicate their confirmed state. The button remains focusable and in the tab order after being activated — screen readers will announce the pressed state without the button needing to disappear or become disabled.

`ShareButton` uses `disabled` during its brief 3-second confirmed window since the state is transient rather than a toggle.

## Getting the AT URIs

Use `fetchArticleBySlug` and `fetchSite` from `@skyscribe-sdk/core` to obtain the URIs needed by the components:

```ts
import { fetchArticleBySlug, fetchSite } from "@skyscribe-sdk/core";

const [{ uri: documentUri }, site] = await Promise.all([
  fetchArticleBySlug(author, siteUrl, articleSlug, signal),
  fetchSite(author, siteUrl, signal),
]);

// documentUri → LikeButton, ShareButton
// site.uri    → LikeButton, ShareButton, SubscribeButton
```

## Storage utilities

Exported for cases where you need to read or set liked/subscribed state outside the components:

```ts
import { isRecommended, markRecommended, isSubscribed, markSubscribed } from "@skyscribe-sdk/social";

isRecommended("at://...");  // → boolean
markRecommended("at://...");

isSubscribed("at://...");   // → boolean
markSubscribed("at://...");
```

`localStorage` access is wrapped in a try/catch — safe to call during SSR where storage is unavailable.

State is stored under the keys `scribe:recommended:{documentUri}` and `scribe:subscribed:{publicationUri}`.

## License

[MIT](https://github.com/ACregan/skyscribe-sdk/blob/main/LICENSE)
