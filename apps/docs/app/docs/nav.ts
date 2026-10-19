// Single source of truth for the docs: the side menu's sections, each
// section's page list, every page's title/description (also used for
// <title>/<meta>), prev/next order, and the prerender list
// (react-router.config.ts). Adding a page = add an entry here + a matching
// `.mdx` file under `app/content/` (see `contentKeyForSlug` in route.tsx).
//
// URLs are permanent (ADR 0003): two older URL schemes redirect into them.
// API pages are named after the exact package (`/api/react-router-framework`).
// Type-only: react-router.config.ts imports this file at build time,
// outside Vite, so it must not pull in components or the `~` alias.
import type { SvgImageListTypes } from "../components/SvgIcon";

export interface DocsPage {
  /** Path below `/`. The home page is the empty string. */
  slug: string;
  title: string;
  /** One line — used for <meta name="description">. */
  description: string;
}

export interface DocsSection {
  title: string;
  /** Side menu label: shorter than the title, which wraps there. */
  menuLabel: string;
  /** Side menu icon. */
  icon: SvgImageListTypes;
  pages: DocsPage[];
}

export const docsSections: DocsSection[] = [
  {
    title: "Getting started",
    menuLabel: "Introduction",
    icon: "Home",
    pages: [
      {
        slug: "",
        title: "Introduction",
        description:
          "What the SkyScribe SDK is, and which @skyscribe-sdk package to install for your stack.",
      },
      {
        slug: "concepts",
        title: "Concepts",
        description:
          "The AT Protocol identity model and the content model, as the SDK exposes them.",
      },
      {
        slug: "quickstart",
        title: "Quickstart",
        description:
          "Fetch a Site and an Article in under five minutes with @skyscribe-sdk/core.",
      },
      {
        slug: "migrating",
        title: "Migrating from @scribe-atp",
        description:
          "Moving from the old @scribe-atp/* packages to @skyscribe-sdk/*: only the import paths change.",
      },
    ],
  },
  {
    title: "Frameworks",
    menuLabel: "Frameworks",
    icon: "Tiles",
    pages: [
      {
        slug: "frameworks/core",
        title: "Vanilla TypeScript",
        description:
          "The framework-agnostic package: fetchSite, fetchArticle, and the types.",
      },
      {
        slug: "frameworks/react",
        title: "React",
        description: "useSite and useArticle hooks for client-rendered React.",
      },
      {
        slug: "frameworks/react-router",
        title: "React Router",
        description:
          "Loader factories for React Router framework mode, with request cancellation wired up.",
      },
      {
        slug: "frameworks/next",
        title: "Next.js",
        description:
          "App Router integration: generateStaticParams and generateMetadata factories.",
      },
      {
        slug: "frameworks/vue",
        title: "Vue",
        description:
          "useScribeSite and useScribeArticle composables for Vue 3.",
      },
      {
        slug: "frameworks/nuxt",
        title: "Nuxt",
        description:
          "The Nuxt module: auto-imports and useAsyncData integration.",
      },
      {
        slug: "frameworks/angular",
        title: "Angular",
        description:
          "ScribeService (Observables) and injectSite / injectArticle (Signals).",
      },
      {
        slug: "frameworks/styles",
        title: "Styles",
        description:
          "Themeable CSS for rendering Document content: code blocks, quotes, lists.",
      },
      {
        slug: "frameworks/other",
        title: "Other frameworks",
        description:
          "SvelteKit, Astro, and any meta-framework with server-side data loading.",
      },
    ],
  },
  {
    title: "API reference",
    menuLabel: "API Reference",
    icon: "List",
    pages: [
      {
        slug: "api/core",
        title: "@skyscribe-sdk/core",
        description: "Full API: functions, types, and errors.",
      },
      {
        slug: "api/react",
        title: "@skyscribe-sdk/react",
        description: "Hooks and their return shapes.",
      },
      {
        slug: "api/react-router-framework",
        title: "@skyscribe-sdk/react-router-framework",
        description: "Loader factories and their options.",
      },
      {
        slug: "api/next",
        title: "@skyscribe-sdk/next",
        description: "Factories for the App Router.",
      },
      {
        slug: "api/vue",
        title: "@skyscribe-sdk/vue",
        description: "Composables and their reactive return values.",
      },
      {
        slug: "api/nuxt",
        title: "@skyscribe-sdk/nuxt",
        description: "Module options, composables, and auto-imports.",
      },
      {
        slug: "api/angular",
        title: "@skyscribe-sdk/angular",
        description: "ScribeService, inject functions, and provider setup.",
      },
      {
        slug: "api/styles",
        title: "@skyscribe-sdk/styles",
        description: "Stylesheets, class names, and theming variables.",
      },
      {
        slug: "api/social",
        title: "@skyscribe-sdk/social",
        description: "Components, props, and the events API.",
      },
    ],
  },
  {
    title: "Guides",
    menuLabel: "Guides",
    icon: "Documents",
    pages: [
      {
        slug: "guides/building-urls",
        title: "Building URLs",
        description:
          "Constructing canonical Site, Category, and Article URLs from a Site record.",
      },
      {
        slug: "guides/rss",
        title: "RSS feeds",
        description: "Generating an RSS 2.0 feed from a Site with generateFeed.",
      },
      {
        slug: "guides/sitemaps",
        title: "Sitemaps",
        description: "Building an XML sitemap with getSitemapEntries.",
      },
      {
        slug: "guides/meta-tags",
        title: "Meta tags",
        description:
          "Open Graph, Twitter Card, and canonical tags for Sites and Articles.",
      },
      {
        slug: "guides/errors-and-retries",
        title: "Errors & retries",
        description:
          "The SDK's error types, and retrying transient PDS failures with withRetry.",
      },
      {
        slug: "guides/cancellation",
        title: "Request cancellation",
        description: "Passing AbortSignals through fetchSite and fetchArticle.",
      },
      {
        slug: "guides/engagement-data",
        title: "Engagement data",
        description:
          "Reading like, subscribe, and share counts from the Social service.",
      },
      {
        slug: "guides/social",
        title: "Social buttons",
        description:
          "Adding Like, Subscribe, and Share buttons with @skyscribe-sdk/social.",
      },
      {
        slug: "guides/site-analytics",
        title: "Site Analytics",
        description:
          "Visit figures on SkyScribe's Insights tab for your SDK-driven website: the component and the verification file.",
      },
      {
        slug: "guides/cross-posted-articles",
        title: "Cross-posted articles",
        description: "Linking an Article back to its Bluesky post via bskyPostRef.",
      },
    ],
  },
];

export const allDocsPages: DocsPage[] = docsSections.flatMap((s) => s.pages);

export function findDocsPage(slug: string): DocsPage | undefined {
  return allDocsPages.find((p) => p.slug === slug);
}

export function docsHref(slug: string): string {
  return `/${slug}`;
}

export function sectionForSlug(slug: string): DocsSection | undefined {
  return docsSections.find((s) => s.pages.some((p) => p.slug === slug));
}

export function adjacentDocsPages(slug: string): {
  prev: DocsPage | null;
  next: DocsPage | null;
} {
  const i = allDocsPages.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? allDocsPages[i - 1] : null,
    next: i < allDocsPages.length - 1 ? allDocsPages[i + 1] : null,
  };
}
