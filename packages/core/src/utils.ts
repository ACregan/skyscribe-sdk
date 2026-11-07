import type { DocumentRef } from "./types.js";

export function toSlug(domain: string): string {
  return domain.replace(/\./g, "-").replace(/[^a-z0-9-]/g, "");
}

export function slugFromUri(uri: string): string {
  return uri.split("/").at(-1) ?? "";
}

// A DocumentRef's `uri` names the Document's own repo — usually the
// Publication owner's, but Scribe CMS's Contributors feature (sync-later publish) can
// point it at a different account's repo entirely. Callers that need to
// fetch the actual document must resolve from this DID, not assume it's
// the same as whichever identifier was used to look up the Publication.
export function didFromUri(uri: string): string {
  const match = uri.match(/^at:\/\/([^/]+)\//);
  if (!match) throw new Error(`Malformed at:// URI: ${uri}`);
  return match[1];
}

export function flattenDocuments(
  categories: Array<{ documents: DocumentRef[] }>
): DocumentRef[] {
  return categories.flatMap((c) => c.documents);
}

/** @deprecated Use `flattenDocuments`. */
export const flattenArticles = flattenDocuments;
