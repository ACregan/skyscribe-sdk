import type { MetaDescriptor } from "react-router";
import type { StandardDocument, StandardPublication } from "@skyscribe-sdk/core";
import {
  generateDocumentMeta,
  generatePublicationMeta,
  standardSiteLinks as coreStandardSiteLinks,
} from "@skyscribe-sdk/core";

export function documentMeta(
  document: StandardDocument,
  publication: StandardPublication
): MetaDescriptor[] {
  return generateDocumentMeta(document, publication) as MetaDescriptor[];
}

export function publicationMeta(publication: StandardPublication): MetaDescriptor[] {
  return generatePublicationMeta(publication) as MetaDescriptor[];
}

/** Just the site.standard link tags, for routes that don't use
 * documentMeta / publicationMeta (Category pages, custom heads). */
export function standardSiteLinks(
  publication: StandardPublication,
  document?: StandardDocument
): MetaDescriptor[] {
  return coreStandardSiteLinks(publication, document) as MetaDescriptor[];
}

// ── Deprecated names (ADR 0005): removed in the next major ──────────────

/** @deprecated Use `documentMeta`. */
export const articleMeta = documentMeta;
/** @deprecated Use `publicationMeta`. */
export const siteMeta = publicationMeta;
