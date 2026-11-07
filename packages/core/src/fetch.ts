import type { StandardPublication, StandardDocument, ArticleResult } from "./types.js";
import { toDocument, toPublication, type RawDocument, type RawPublication } from "./record.js";
import { resolveIdentifier, resolvePds, _clearCaches as _clearResolveCaches } from "./resolve.js";
import { slugFromUri, didFromUri } from "./utils.js";
import { NotFoundError, PdsFetchError } from "./errors.js";
import { pdsFetch } from "./http.js";

const PUBLICATION_URI_CACHE_TTL_MS = 60_000;

interface CachedPublicationUri {
  uri: string;
  expiresAt: number;
}

const publicationUriCache = new Map<string, CachedPublicationUri>();

export function _clearAllCaches(): void {
  publicationUriCache.clear();
  _clearResolveCaches();
}

function getCachedPublicationUri(cacheKey: string): string | undefined {
  const cached = publicationUriCache.get(cacheKey);
  if (!cached) return undefined;
  if (cached.expiresAt <= Date.now()) {
    publicationUriCache.delete(cacheKey);
    return undefined;
  }
  return cached.uri;
}

function setCachedPublicationUri(cacheKey: string, uri: string): void {
  publicationUriCache.set(cacheKey, {
    uri,
    expiresAt: Date.now() + PUBLICATION_URI_CACHE_TTL_MS,
  });
}

async function lookupPublicationRecord(
  pdsUrl: string,
  did: string,
  normalizedUrl: string,
  publicationUrl: string,
  signal?: AbortSignal
): Promise<{ uri: string; value: RawPublication }> {
  const listUrl = new URL(`${pdsUrl}/xrpc/com.atproto.repo.listRecords`);
  listUrl.searchParams.set("repo", did);
  listUrl.searchParams.set("collection", "site.standard.publication");
  listUrl.searchParams.set("limit", "100");
  const res = await pdsFetch(listUrl, { signal });
  if (!res.ok) throw new PdsFetchError(`Failed to fetch publications: ${res.statusText}`);
  const data = (await res.json()) as {
    records: Array<{ uri: string; value: RawPublication }>;
  };
  const record = data.records.find(
    (r) => normalizeUrl(r.value.url ?? "") === normalizedUrl
  );
  if (!record) throw new NotFoundError(`Publication not found: ${publicationUrl}`);
  return record;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function resolvePublicationUri(
  author: string,
  publicationUrl: string,
  signal?: AbortSignal
): Promise<string> {
  const normalizedUrl = normalizeUrl(publicationUrl);
  const did = await resolveIdentifier(author, signal);
  const cacheKey = `${did}:${normalizedUrl}`;
  const cached = getCachedPublicationUri(cacheKey);
  if (cached) return cached;

  const pdsUrl = await resolvePds(did, signal);
  const record = await lookupPublicationRecord(pdsUrl, did, normalizedUrl, publicationUrl, signal);
  setCachedPublicationUri(cacheKey, record.uri);
  return record.uri;
}

async function fetchCachedPublicationRecord(
  pdsUrl: string,
  did: string,
  cacheKey: string,
  signal?: AbortSignal
): Promise<{ uri: string; value: RawPublication } | undefined> {
  const cachedUri = getCachedPublicationUri(cacheKey);
  if (!cachedUri) return undefined;

  const rkey = cachedUri.split("/").pop()!;
  const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.getRecord`);
  url.searchParams.set("repo", did);
  url.searchParams.set("collection", "site.standard.publication");
  url.searchParams.set("rkey", rkey);
  const res = await pdsFetch(url, { signal });
  if (!res.ok) {
    // Cached URI no longer resolves (record deleted/recreated elsewhere) — drop it
    // so the caller falls back to a fresh listRecords lookup instead of failing.
    publicationUriCache.delete(cacheKey);
    return undefined;
  }
  const data = (await res.json()) as { value: RawPublication };
  return { uri: cachedUri, value: data.value };
}

export async function fetchPublication(
  author: string,
  publicationUrl: string,
  signal?: AbortSignal
): Promise<StandardPublication> {
  const normalizedUrl = normalizeUrl(publicationUrl);
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const cacheKey = `${did}:${normalizedUrl}`;

  let record = await fetchCachedPublicationRecord(pdsUrl, did, cacheKey, signal);
  if (!record) {
    record = await lookupPublicationRecord(pdsUrl, did, normalizedUrl, publicationUrl, signal);
    setCachedPublicationUri(cacheKey, record.uri);
  }
  return toPublication(record.uri, record.value);
}

// Fetches by record key (rkey). Current Documents have opaque TID rkeys,
// so a human-readable slug only matches very old records: use
// fetchDocumentBySlug for slugs.
export async function fetchDocument(
  author: string,
  rkey: string,
  signal?: AbortSignal
): Promise<StandardDocument> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);

  const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.getRecord`);
  url.searchParams.set("repo", did);
  url.searchParams.set("collection", "site.standard.document");
  url.searchParams.set("rkey", rkey);

  const res = await pdsFetch(url, { signal });
  if (!res.ok) throw new PdsFetchError(`Failed to fetch document: ${res.statusText}`);

  const data = (await res.json()) as { value: RawDocument };
  return toDocument(`at://${did}/site.standard.document/${rkey}`, data.value);
}

export async function fetchDocumentBySlug(
  author: string,
  publicationUrl: string,
  documentSlug: string,
  signal?: AbortSignal
): Promise<StandardDocument> {
  const publication = await fetchPublication(author, publicationUrl, signal);

  const ref = publication.categories
    .flatMap((c) => c.documents)
    .find((r) => r.slug === documentSlug || slugFromUri(r.uri) === documentSlug);

  if (!ref) throw new NotFoundError(`Document not found: ${documentSlug}`);

  // ref.uri names the Document's own repo: usually the Publication owner's,
  // but a Contributor's when Scribe CMS's Contributors feature published it
  // there. Resolve from that URI's own DID, not the Publication's `author`.
  return fetchDocument(didFromUri(ref.uri), slugFromUri(ref.uri), signal);
}

// ── Deprecated names (ADR 0005): removed in the next major ──────────────

/** @deprecated Use `fetchPublication`. */
export const fetchSite = fetchPublication;
/** @deprecated Use `fetchDocument`. */
export const fetchArticle = fetchDocument;
/** @deprecated Use `fetchDocumentBySlug`, which returns the
 * `StandardDocument` itself (it carries its own `uri`). */
export async function fetchArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string,
  signal?: AbortSignal
): Promise<ArticleResult> {
  const article = await fetchDocumentBySlug(author, publicationUrl, articleSlug, signal);
  return { article, uri: article.uri };
}
