import type { StandardPublication, DocumentRef, DocumentContributor } from "./types.js";
import { toPublication, type RawPublication } from "./record.js";
import { resolveIdentifier, resolvePds } from "./resolve.js";
import { slugFromUri } from "./utils.js";
import { PdsFetchError } from "./errors.js";
import { pdsFetch } from "./http.js";
import { readDocumentSeo } from "./seo.js";

// listRecords returns more legacy shapes than getRecord callers see.
interface RawListedDocument {
  title: string;
  path?: string;
  site: string;
  publishedAt?: string;
  description?: string | null;
  tags?: string[];
  contributors?: DocumentContributor[];
  updatedAt?: string;
  // Scribe-specific fields live in the `scribe` extension object.
  scribe?: { createdAt?: string; coverImageUrl?: string; seo?: unknown };
  // Legacy top-level fields, written by older Scribe versions.
  createdAt?: string;
  splashImageUrl?: string | null;
}

// The human-readable slug is the last segment of the document's `path`
// ("/blog/essays/my-post" → "my-post"). Records without a path (older
// drafts) fall back to the rkey.
function slugForDocument(uri: string, path: string | undefined): string {
  const fromPath = path?.split("/").filter(Boolean).at(-1);
  return fromPath ?? slugFromUri(uri);
}

interface ListRecordsPage<T> {
  records: Array<{ uri: string; cid: string; value: T }>;
  cursor?: string;
}

async function listAllRecords<T>(
  pdsUrl: string,
  did: string,
  collection: string,
  signal?: AbortSignal
): Promise<Array<{ uri: string; value: T }>> {
  const results: Array<{ uri: string; value: T }> = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.listRecords`);
    url.searchParams.set("repo", did);
    url.searchParams.set("collection", collection);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await pdsFetch(url, { signal });
    if (!res.ok) throw new PdsFetchError(`Failed to list ${collection}: ${res.statusText}`);

    const page = (await res.json()) as ListRecordsPage<T>;
    for (const record of page.records) {
      results.push({ uri: record.uri, value: record.value });
    }
    cursor = page.cursor;
  } while (cursor);

  return results;
}

export async function listPublications(
  author: string,
  signal?: AbortSignal
): Promise<StandardPublication[]> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const records = await listAllRecords<RawPublication>(pdsUrl, did, "site.standard.publication", signal);

  // Only records with the Scribe extension: other site.standard apps'
  // Publications lack the domain, base path and Categories.
  return records
    .filter(({ value }) => value.scribe != null)
    .map(({ uri, value }) => toPublication(uri, value));
}

export async function listDocuments(
  author: string,
  signal?: AbortSignal
): Promise<DocumentRef[]> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const records = await listAllRecords<RawListedDocument>(pdsUrl, did, "site.standard.document", signal);

  return records.map(({ uri, value }) => ({
    uri,
    title: value.title,
    slug: slugForDocument(uri, value.path),
    coverImageUrl: value.scribe?.coverImageUrl ?? value.splashImageUrl ?? null,
    description: value.description,
    tags: value.tags,
    contributors: value.contributors,
    createdAt: value.scribe?.createdAt ?? value.createdAt ?? value.publishedAt ?? "",
    publishedAt: value.publishedAt,
    updatedAt: value.updatedAt,
    ...(readDocumentSeo(value.scribe?.seo)?.noindex ? { noindex: true as const } : {}),
  }));
}

// ── Deprecated names (ADR 0005): removed in the next major ──────────────

/** @deprecated Use `listPublications`. */
export const listSites = listPublications;
/** @deprecated Use `listDocuments`. */
export const listArticles = listDocuments;
