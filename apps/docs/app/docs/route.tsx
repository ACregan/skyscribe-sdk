import { lazy, Suspense, type ComponentType } from "react";
import type { Route } from "./+types/route";
import {
  adjacentDocsPages,
  docsHref,
  findDocsPage,
  sectionForSlug,
  type DocsPage,
} from "./nav";
import type { TocEntry } from "./mdx/remark-toc";
import { DocsArticle } from "./components/DocsArticle";
import { mdxComponents } from "./components/mdx-components";
import { shareMeta } from "./shareCard";
import "./docs.css";

// Production URL for <link rel="canonical">, whatever origin served it.
const CANONICAL_ORIGIN = "https://sdk.skyscribe.app";

interface ContentModule {
  default: ComponentType<{
    components?: Record<string, ComponentType<unknown>>;
  }>;
  tableOfContents?: TocEntry[];
}

// Lazy: each page's MDX is its own chunk, so a page only downloads its own
// content. The static HTML still has the full page, because the build
// waits for lazy content before writing it (entry.server.tsx).
const contentLoaders = import.meta.glob<ContentModule>("../content/**/*.mdx");

function contentKeyForSlug(slug: string): string {
  return slug === "" ? "../content/index.mdx" : `../content/${slug}.mdx`;
}

interface PageBodyProps {
  slug: string;
  page: DocsPage;
}

// One lazy component per page, created once. It renders the whole article
// (not just the prose) because the "On this page" rail needs the module's
// tableOfContents export.
const pageBodies = new Map<string, ComponentType<PageBodyProps>>();

function pageBodyFor(slug: string): ComponentType<PageBodyProps> {
  const key = contentKeyForSlug(slug);
  let body = pageBodies.get(key);
  if (!body) {
    const load = contentLoaders[key];
    body = lazy(async () => {
      const mod = load ? await load() : null;
      return {
        default: ({ slug, page }: PageBodyProps) => (
          <Article slug={slug} page={page} mod={mod} />
        ),
      };
    });
    pageBodies.set(key, body);
  }
  return body;
}

function Article({
  slug,
  page,
  mod,
}: PageBodyProps & { mod: ContentModule | null }) {
  const { prev, next } = adjacentDocsPages(slug);
  return (
    <DocsArticle
      slug={slug}
      sectionTitle={sectionForSlug(slug)?.title}
      toc={mod?.tableOfContents ?? []}
      prev={prev}
      next={next}
    >
      {mod ? (
        <mod.default components={mdxComponents} />
      ) : (
        // Pages listed in nav.ts whose content hasn't been written yet.
        <>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <p className="docs-stub">This page is being written.</p>
        </>
      )}
    </DocsArticle>
  );
}

function slugFromParams(params: Record<string, string | undefined>): string {
  return (params["*"] ?? "").replace(/\/$/, "");
}

export function meta({ params }: Route.MetaArgs) {
  const slug = slugFromParams(params);
  const page = findDocsPage(slug);
  if (!page) {
    return [{ title: "Page not found — SkyScribe SDK" }];
  }
  const title = slug === "" ? "SkyScribe SDK" : `${page.title} — SkyScribe SDK`;
  const url = `${CANONICAL_ORIGIN}${docsHref(slug)}`;
  return [
    { title },
    { name: "description", content: page.description },
    { tagName: "link", rel: "canonical", href: url },
    ...shareMeta({
      origin: CANONICAL_ORIGIN,
      title,
      description: page.description,
      url,
    }),
  ];
}

export default function DocsRoute({ params }: Route.ComponentProps) {
  const slug = slugFromParams(params);
  const page = findDocsPage(slug);

  if (!page) {
    return (
      <DocsArticle slug={slug} toc={[]} prev={null} next={null}>
        <h1>Page not found</h1>
        <p>
          There's no docs page at this address. Use the menu or the search bar
          to find what you're looking for.
        </p>
      </DocsArticle>
    );
  }

  const PageBody = pageBodyFor(slug);
  return (
    // Only seen if a page's chunk is slow on a client-side navigation;
    // React Router's transitions normally keep the previous page up.
    <Suspense
      fallback={
        <DocsArticle slug={slug} toc={[]} prev={null} next={null}>
          <h1>{page.title}</h1>
        </DocsArticle>
      }
    >
      <PageBody slug={slug} page={page} />
    </Suspense>
  );
}
