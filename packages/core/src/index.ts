export type {
  StandardPublication,
  StandardDocument,
  Category,
  DocumentRef,
  DocumentContributor,
} from "./types.js";
export { fetchPublication, fetchDocument, fetchDocumentBySlug, resolvePublicationUri } from "./fetch.js";
export { listPublications, listDocuments } from "./list.js";
export { toSlug, slugFromUri, flattenDocuments } from "./utils.js";
export { generateFeed } from "./feed.js";
export type { FeedOptions } from "./feed.js";
export { readDocumentSeo, SEO_TITLE_MAX, SEO_DESCRIPTION_MAX } from "./seo.js";
export type { DocumentSeo } from "./seo.js";
export { getSitemapEntries } from "./sitemap.js";
export type { SitemapEntry, GetSitemapEntriesOptions } from "./sitemap.js";
export {
  generateDocumentMeta,
  generatePublicationMeta,
  generateDocumentJsonLd,
  generatePublicationJsonLd,
  buildCanonicalUrl,
  buildPublicationUrl,
  standardSiteLinks,
} from "./meta.js";
export type { ScribeMetaTag, JsonLdObject, StandardSiteLink } from "./meta.js";
export { crossPostToBluesky } from "./crosspost.js";
export type { CrossPostParams, StrongRef } from "./crosspost.js";
export { fetchProfile } from "./profile.js";
export type { Profile, ProfileAssociated, ProfileVerification, ProfileStatus } from "./profile.js";
export { NotFoundError, PdsFetchError, PdsUnreachableError } from "./errors.js";
export { withRetry } from "./retry.js";
export type { RetryOptions } from "./retry.js";
export {
  renderEmbeds,
  hasEmbedPlayer,
  listenForEmbedResize,
  listenForEmbedClicks,
  enhanceEmbeds,
  EMBED_KINDS,
  EMBED_FRAME_HOSTS,
} from "./embeds.js";
export type { EmbedKind, EmbedWindow, EmbedClickWindow, RenderEmbedsOptions } from "./embeds.js";
export {
  siteAnalyticsScript,
  siteAnalyticsScriptTag,
  loadSiteAnalytics,
  SITE_ANALYTICS_SCRIPT_SRC,
} from "./analytics.js";
export type { SiteAnalyticsScript, SiteAnalyticsDocument } from "./analytics.js";

// Deprecated names (ADR 0005): removed in the next major.
export type { Site, SiteGroup, ArticleRef, Article, ArticleContributor, ArticleResult } from "./types.js";
export { fetchSite, fetchArticle, fetchArticleBySlug } from "./fetch.js";
export { listSites, listArticles } from "./list.js";
export { flattenArticles } from "./utils.js";
export {
  generateArticleMeta,
  generateSiteMeta,
  generateArticleJsonLd,
  generateSiteJsonLd,
  buildSiteUrl,
} from "./meta.js";
