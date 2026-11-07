import type { StandardPublication } from "./types.js";

export interface SitemapEntry {
  url: string;
  lastmod?: string;
}

export interface GetSitemapEntriesOptions {
  baseUrl: string;
}

function categoryUrl(baseUrl: string, basePath: string, categorySlug: string): string {
  const prefix = basePath ? `${basePath}/` : "";
  return `${baseUrl}/${prefix}${categorySlug}`;
}

function documentUrl(
  baseUrl: string,
  basePath: string,
  categorySlug: string,
  documentSlug: string
): string {
  const prefix = basePath ? `${basePath}/` : "";
  return `${baseUrl}/${prefix}${categorySlug}/${documentSlug}`;
}

export function getSitemapEntries(
  publication: StandardPublication,
  options: GetSitemapEntriesOptions
): SitemapEntry[] {
  const prefix = publication.basePath ?? "";
  const entries: SitemapEntry[] = [];

  // Homepage
  entries.push({ url: options.baseUrl });

  // Blog index (only when the blog lives at a sub-path, not the root)
  if (prefix) {
    entries.push({ url: `${options.baseUrl}/${prefix}` });
  }

  // Category pages and Document pages
  for (const category of publication.categories) {
    entries.push({ url: categoryUrl(options.baseUrl, prefix, category.slug) });

    for (const ref of category.documents) {
      // Its canonical URL is another website's (an imported Document whose
      // author kept the original as canonical): this copy isn't the page
      // to offer search engines.
      if (ref.canonicalElsewhere) continue;
      // Its SEO Settings ask search engines to leave it out.
      if (ref.noindex) continue;
      const url = documentUrl(options.baseUrl, prefix, category.slug, ref.slug ?? "");
      const lastmod =
        ref.updatedAt && ref.updatedAt.length > 0
          ? new Date(ref.updatedAt).toISOString().split("T")[0]
          : undefined;
      entries.push({ url, ...(lastmod && { lastmod }) });
    }
  }

  return entries;
}
