import { fetchPublication, fetchDocumentBySlug, resolvePublicationUri } from "@skyscribe-sdk/core";
import type { Metadata } from "next";

export function createScribePublication(author: string, publicationUrl: string) {
  const load = () => fetchPublication(author, publicationUrl);

  return {
    /** For `app/[categorySlug]/page.tsx`. */
    generateCategoryParams: async (): Promise<{ categorySlug: string }[]> => {
      const publication = await load();
      return publication.categories.map((c) => ({ categorySlug: c.slug }));
    },

    /** For `app/[documentSlug]/page.tsx`. */
    generateDocumentParams: async (): Promise<{ documentSlug: string }[]> => {
      const publication = await load();
      return publication.categories
        .flatMap((c) => c.documents)
        .filter((d) => !!d.slug)
        .map((d) => ({ documentSlug: d.slug! }));
    },

    /** For `app/[categorySlug]/[documentSlug]/page.tsx`. */
    generateCategoryDocumentParams: async (): Promise<
      { categorySlug: string; documentSlug: string }[]
    > => {
      const publication = await load();
      return publication.categories.flatMap((c) =>
        c.documents
          .filter((d) => !!d.slug)
          .map((d) => ({ categorySlug: c.slug, documentSlug: d.slug! }))
      );
    },

    generatePublicationMetadata: async (): Promise<Metadata> => {
      const publication = await load();
      return {
        title: publication.name,
        description: publication.description ?? undefined,
        openGraph: {
          title: publication.name,
          description: publication.description ?? undefined,
          ...(publication.splashImageUrl ? { images: [publication.splashImageUrl] } : {}),
        },
      };
    },

    generateCategoryMetadata: async (categorySlug: string): Promise<Metadata> => {
      const publication = await load();
      const category = publication.categories.find((c) => c.slug === categorySlug);
      const title = category ? `${category.title} — ${publication.name}` : publication.name;
      return {
        title,
        openGraph: { title },
      };
    },

    generateDocumentMetadata: async (documentSlug: string): Promise<Metadata> => {
      const publication = await load();
      const ref = publication.categories
        .flatMap((c) => c.documents)
        .find((d) => d.slug === documentSlug);
      // The Publication's snapshot has no SEO title or description (core
      // ADR 0004), so read them from the Document itself. Metadata falls
      // back to the snapshot if that fetch fails.
      const seo = ref
        ? await fetchDocumentBySlug(author, publicationUrl, documentSlug)
            .then((full) => full.seo)
            .catch(() => undefined)
        : undefined;
      const title = ref ? `${seo?.title ?? ref.title} — ${publication.name}` : publication.name;
      const description = seo?.description ?? ref?.description ?? undefined;
      return {
        title,
        description,
        ...(ref?.noindex || seo?.noindex ? { robots: { index: false } } : {}),
        openGraph: {
          title,
          description,
          ...(ref?.coverImageUrl ? { images: [ref.coverImageUrl] } : {}),
        },
      };
    },

    getDocumentUri: (documentSlug: string): Promise<string> =>
      fetchDocumentBySlug(author, publicationUrl, documentSlug).then((d) => d.uri),
  };
}

export function createWellKnownHandler(
  author: string,
  publicationUrl: string
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const uri = await resolvePublicationUri(author, publicationUrl, request.signal);
    return new Response(uri, { headers: { "Content-Type": "text/plain" } });
  };
}

// ── Deprecated names (ADR 0005): removed in the next major ──────────────

/** @deprecated Use `createScribePublication`. Its `generate*Params` return
 * `{ categorySlug, documentSlug }`, so rename the route folders when you
 * switch. These still return `{ groupSlug, articleSlug }`. */
export function createScribeSite(author: string, publicationUrl: string) {
  const p = createScribePublication(author, publicationUrl);
  return {
    generateGroupParams: async (): Promise<{ groupSlug: string }[]> =>
      (await p.generateCategoryParams()).map(({ categorySlug }) => ({ groupSlug: categorySlug })),
    generateArticleParams: async (): Promise<{ articleSlug: string }[]> =>
      (await p.generateDocumentParams()).map(({ documentSlug }) => ({ articleSlug: documentSlug })),
    generateGroupArticleParams: async (): Promise<{ groupSlug: string; articleSlug: string }[]> =>
      (await p.generateCategoryDocumentParams()).map(({ categorySlug, documentSlug }) => ({
        groupSlug: categorySlug,
        articleSlug: documentSlug,
      })),
    generateSiteMetadata: p.generatePublicationMetadata,
    generateGroupMetadata: p.generateCategoryMetadata,
    generateArticleMetadata: p.generateDocumentMetadata,
    getDocumentUri: p.getDocumentUri,
  };
}
