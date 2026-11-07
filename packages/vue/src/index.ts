export { SiteAnalytics } from "./SiteAnalytics.js";
export { useScribePublication } from "./useScribePublication.js";
export type { UseScribePublicationResult } from "./useScribePublication.js";
export { useScribeDocument } from "./useScribeDocument.js";
export type { UseScribeDocumentResult } from "./useScribeDocument.js";
export { useScribeDocumentBySlug } from "./useScribeDocumentBySlug.js";
export type { UseScribeDocumentBySlugResult } from "./useScribeDocumentBySlug.js";
export { useScribePublicationUri } from "./useScribePublicationUri.js";
export type { UseScribePublicationUriResult } from "./useScribePublicationUri.js";
export { useScribeDocumentUri } from "./useScribeDocumentUri.js";
export type { UseScribeDocumentUriResult } from "./useScribeDocumentUri.js";
export type {
  StandardPublication,
  StandardDocument,
  Category,
  DocumentRef,
  DocumentContributor,
} from "@skyscribe-sdk/core";

// Deprecated names (ADR 0005): removed in the next major.
export { useScribeSite, useScribeArticle, useScribeArticleBySlug } from "./deprecated.js";
export type {
  UseScribeSiteResult,
  UseScribeArticleResult,
  UseScribeArticleBySlugResult,
} from "./deprecated.js";
export type { Site, Article, ArticleRef, SiteGroup } from "@skyscribe-sdk/core";
