export { createPublicationLoader, createDocumentRouteLoader, createWellKnownLoader } from "./loaders.js";
export { documentMeta, publicationMeta, standardSiteLinks } from "./meta.js";
export type {
  StandardPublication,
  StandardDocument,
  Category,
  DocumentRef,
  DocumentContributor,
} from "@skyscribe-sdk/core";

// Deprecated names (ADR 0005): removed in the next major.
export { createSiteLoader, createArticleRouteLoader } from "./loaders.js";
export type { ArticleWithUri } from "./loaders.js";
export { articleMeta, siteMeta } from "./meta.js";
export type { ArticleRef, SiteGroup, Site, Article } from "@skyscribe-sdk/core";
