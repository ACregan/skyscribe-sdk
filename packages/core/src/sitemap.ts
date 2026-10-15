import type { Site } from "./types.js";

export interface SitemapEntry {
  url: string;
  lastmod?: string;
}

export interface GetSitemapEntriesOptions {
  baseUrl: string;
}

function groupUrl(baseUrl: string, urlPrefix: string, groupSlug: string): string {
  const prefix = urlPrefix ? `${urlPrefix}/` : "";
  return `${baseUrl}/${prefix}${groupSlug}`;
}

function articleUrl(
  baseUrl: string,
  urlPrefix: string,
  groupSlug: string,
  articleSlug: string
): string {
  const prefix = urlPrefix ? `${urlPrefix}/` : "";
  return `${baseUrl}/${prefix}${groupSlug}/${articleSlug}`;
}

export function getSitemapEntries(
  site: Site,
  options: GetSitemapEntriesOptions
): SitemapEntry[] {
  const prefix = site.urlPrefix ?? "";
  const entries: SitemapEntry[] = [];

  // Homepage
  entries.push({ url: options.baseUrl });

  // Blog index (only when the blog lives at a sub-path, not the root)
  if (prefix) {
    entries.push({ url: `${options.baseUrl}/${prefix}` });
  }

  // Group pages and article pages
  for (const group of site.groups) {
    entries.push({ url: groupUrl(options.baseUrl, prefix, group.slug) });

    for (const article of group.articles) {
      // Its canonical URL is another site's (an imported article whose
      // author kept the original as canonical): this site's copy isn't
      // the page to offer search engines.
      if (article.canonicalElsewhere) continue;
      const url = articleUrl(options.baseUrl, prefix, group.slug, article.slug ?? "");
      const lastmod =
        article.updatedAt && article.updatedAt.length > 0
          ? new Date(article.updatedAt).toISOString().split("T")[0]
          : undefined;
      entries.push({ url, ...(lastmod && { lastmod }) });
    }
  }

  return entries;
}
