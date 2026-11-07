export { usePublication } from "./usePublication.js";
export type { UsePublicationResult } from "./usePublication.js";
export { useDocument } from "./useDocument.js";
export type { UseDocumentResult } from "./useDocument.js";
export { useDocumentBySlug } from "./useDocumentBySlug.js";
export type { UseDocumentBySlugResult } from "./useDocumentBySlug.js";
export { ScribeContent } from "./ScribeContent.js";
export { SiteAnalytics } from "./SiteAnalytics.js";
export type {
  StandardPublication,
  StandardDocument,
  Category,
  DocumentRef,
  DocumentContributor,
} from "@skyscribe-sdk/core";

// Deprecated names (ADR 0005): removed in the next major.
export { useSite, useArticle, useArticleBySlug } from "./deprecated.js";
export type { UseArticleBySlugResult } from "./deprecated.js";
export type { ArticleRef, SiteGroup, Site, Article, ArticleResult } from "@skyscribe-sdk/core";
