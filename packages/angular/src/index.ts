export { ScribeService } from "./scribe.service.js";
export { injectPublication } from "./inject-publication.js";
export type { InjectPublicationResult } from "./inject-publication.js";
export { injectDocument } from "./inject-document.js";
export type { InjectDocumentResult } from "./inject-document.js";
export { injectDocumentBySlug } from "./inject-document-by-slug.js";
export type { InjectDocumentBySlugResult } from "./inject-document-by-slug.js";
export { injectPublicationUri } from "./inject-publication-uri.js";
export { injectDocumentUri } from "./inject-document-uri.js";
export type {
  StandardPublication,
  StandardDocument,
  Category,
  DocumentRef,
  DocumentContributor,
} from "@skyscribe-sdk/core";

// Deprecated names (ADR 0005): removed in the next major.
export { injectSite, injectArticle, injectArticleBySlug } from "./deprecated.js";
export type { Site, Article, ArticleRef, SiteGroup, ArticleResult } from "@skyscribe-sdk/core";
