import type { DocumentRef, StandardPublication } from "./types.js";

export interface FeedOptions {
  baseUrl: string;
  feedUrl?: string;
  language?: string;
  limit?: number;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(text: string): string {
  return `<![CDATA[${text}]]>`;
}

function channelUrl(baseUrl: string, basePath: string): string {
  if (!basePath) return baseUrl;
  return `${baseUrl}/${basePath}`;
}

function documentLink(
  baseUrl: string,
  basePath: string,
  categorySlug: string,
  documentSlug: string
): string {
  const prefix = basePath ? `${basePath}/` : "";
  return `${baseUrl}/${prefix}${categorySlug}/${documentSlug}`;
}

export function generateFeed(publication: StandardPublication, options: FeedOptions): string {
  const language = options.language ?? "en";
  const channelLink = channelUrl(options.baseUrl, publication.basePath ?? "");
  const description = publication.description ?? publication.name;

  // Every published Document, with the Category it's in
  const allItems: Array<{ categorySlug: string; ref: DocumentRef }> = [];
  for (const category of publication.categories) {
    for (const ref of category.documents) {
      allItems.push({ categorySlug: category.slug, ref });
    }
  }

  const limitedItems =
    options.limit !== undefined ? allItems.slice(0, options.limit) : allItems;

  const atomNs = options.feedUrl
    ? ' xmlns:atom="http://www.w3.org/2005/Atom"'
    : "";

  const atomLink = options.feedUrl
    ? `<atom:link href="${escapeXml(options.feedUrl)}" rel="self" type="application/rss+xml"/>`
    : "";

  const items = limitedItems
    .map(({ categorySlug, ref }) => {
      const link = documentLink(
        options.baseUrl,
        publication.basePath ?? "",
        categorySlug,
        ref.slug ?? ""
      );
      const pubDate = ref.publishedAt ?? ref.createdAt;
      return [
        "<item>",
        `<title>${cdata(ref.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<description>${cdata(ref.description ?? "")}</description>`,
        `<pubDate>${new Date(pubDate).toUTCString()}</pubDate>`,
        `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
        "</item>",
      ].join("");
    })
    .join("");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0"${atomNs}>`,
    "<channel>",
    `<title>${cdata(publication.name)}</title>`,
    `<link>${escapeXml(channelLink)}</link>`,
    `<description>${cdata(description)}</description>`,
    `<language>${escapeXml(language)}</language>`,
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    atomLink,
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
