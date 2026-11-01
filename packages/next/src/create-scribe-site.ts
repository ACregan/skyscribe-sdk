import { fetchSite, fetchArticleBySlug, resolvePublicationUri } from "@skyscribe-sdk/core";
import type { Metadata } from "next";

export function createScribeSite(author: string, publicationUrl: string) {
  return {
    generateGroupParams: async (): Promise<{ groupSlug: string }[]> => {
      const site = await fetchSite(author, publicationUrl);
      return site.groups.map((g) => ({ groupSlug: g.slug }));
    },

    generateArticleParams: async (): Promise<{ articleSlug: string }[]> => {
      const site = await fetchSite(author, publicationUrl);
      return site.groups
        .flatMap((g) => g.articles)
        .filter((a) => !!a.slug)
        .map((a) => ({ articleSlug: a.slug! }));
    },

    generateGroupArticleParams: async (): Promise<
      { groupSlug: string; articleSlug: string }[]
    > => {
      const site = await fetchSite(author, publicationUrl);
      return site.groups.flatMap((g) =>
        g.articles
          .filter((a) => !!a.slug)
          .map((a) => ({ groupSlug: g.slug, articleSlug: a.slug! }))
      );
    },

    generateSiteMetadata: async (): Promise<Metadata> => {
      const site = await fetchSite(author, publicationUrl);
      return {
        title: site.title,
        description: site.description ?? undefined,
        openGraph: {
          title: site.title,
          description: site.description ?? undefined,
          ...(site.splashImageUrl ? { images: [site.splashImageUrl] } : {}),
        },
      };
    },

    generateGroupMetadata: async (groupSlug: string): Promise<Metadata> => {
      const site = await fetchSite(author, publicationUrl);
      const group = site.groups.find((g) => g.slug === groupSlug);
      const title = group ? `${group.title} — ${site.title}` : site.title;
      return {
        title,
        openGraph: { title },
      };
    },

    generateArticleMetadata: async (articleSlug: string): Promise<Metadata> => {
      const site = await fetchSite(author, publicationUrl);
      const article = site.groups
        .flatMap((g) => g.articles)
        .find((a) => a.slug === articleSlug);
      // The site record's snapshot has no SEO title or description (core
      // ADR 0004), so read them from the article itself. Metadata falls
      // back to the snapshot if that fetch fails.
      const seo = article
        ? await fetchArticleBySlug(author, publicationUrl, articleSlug)
            .then(({ article: full }) => full.seo)
            .catch(() => undefined)
        : undefined;
      const title = article
        ? `${seo?.title ?? article.title} — ${site.title}`
        : site.title;
      const description = seo?.description ?? article?.description ?? undefined;
      return {
        title,
        description,
        ...(article?.noindex || seo?.noindex ? { robots: { index: false } } : {}),
        openGraph: {
          title,
          description,
          ...(article?.splashImageUrl
            ? { images: [article.splashImageUrl] }
            : {}),
        },
      };
    },

    getDocumentUri: (articleSlug: string): Promise<string> =>
      fetchArticleBySlug(author, publicationUrl, articleSlug).then(({ uri }) => uri),
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
