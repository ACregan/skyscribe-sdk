import type { Site, Article, ArticleResult } from "./types.js";
import { resolveIdentifier, resolvePds, _clearCaches as _clearResolveCaches } from "./resolve.js";
import { slugFromUri, didFromUri } from "./utils.js";
import { NotFoundError, PdsFetchError } from "./errors.js";
import { pdsFetch } from "./http.js";
import { readDocumentSeo } from "./seo.js";

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
  if (!record) throw new NotFoundError(`Site not found: ${publicationUrl}`);
  return record;
}

interface ScribeManifest {
  domain: string;
  basePath: string;
  title: string;
  description?: string;
  splashImageUrl?: string;
  logoImageUrl?: string;
  groups?: Site["groups"];
  ungroupedArticles?: Site["ungroupedArticles"];
}

interface RawPublication {
  url?: string;
  name?: string;
  description?: string;
  scribe: ScribeManifest;
}

interface RawDocumentScribe {
  coverImageUrl?: string;
  createdAt?: string;
  canonicalUrl?: string;
  seo?: unknown;
}

interface RawDocument {
  title: string;
  path: string;
  site: string;
  publishedAt: string;
  description?: string;
  content?: { $type: string; html?: string } | unknown;
  textContent?: string;
  bskyPostRef?: { uri: string; cid: string };
  tags?: string[];
  contributors?: { did: string; role?: string; displayName?: string }[];
  updatedAt: string;
  scribe?: RawDocumentScribe;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function extractHtml(content: RawDocument["content"]): string {
  if (
    content !== null &&
    typeof content === "object" &&
    (content as Record<string, unknown>)["$type"] === "app.scribe.content.html"
  ) {
    return String((content as Record<string, unknown>)["html"] ?? "");
  }
  return "";
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

export async function fetchSite(
  author: string,
  publicationUrl: string,
  signal?: AbortSignal
): Promise<Site> {
  const normalizedUrl = normalizeUrl(publicationUrl);
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const cacheKey = `${did}:${normalizedUrl}`;

  let record = await fetchCachedPublicationRecord(pdsUrl, did, cacheKey, signal);
  if (!record) {
    record = await lookupPublicationRecord(pdsUrl, did, normalizedUrl, publicationUrl, signal);
    setCachedPublicationUri(cacheKey, record.uri);
  }

  const scribe = record.value.scribe;

  return {
    uri: record.uri,
    title: scribe.title,
    url: scribe.domain,
    urlPrefix: scribe.basePath,
    // Spec puts description at the top level (site.standard.publication);
    // scribe.description is a legacy location a prior CMS version wrote
    // instead — kept as a fallback until existing records are migrated.
    description: record.value.description ?? scribe.description,
    splashImageUrl: scribe.splashImageUrl,
    logoImageUrl: scribe.logoImageUrl,
    groups: scribe.groups ?? [],
    ungroupedArticles: scribe.ungroupedArticles ?? [],
  };
}

// Fetches by record key (rkey). Current articles have opaque TID rkeys, so
// a human-readable slug only matches very old records: use
// fetchArticleBySlug for slugs.
export async function fetchArticle(
  author: string,
  rkey: string,
  signal?: AbortSignal
): Promise<Article> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);

  const url = new URL(`${pdsUrl}/xrpc/com.atproto.repo.getRecord`);
  url.searchParams.set("repo", did);
  url.searchParams.set("collection", "site.standard.document");
  url.searchParams.set("rkey", rkey);

  const res = await pdsFetch(url, { signal });
  if (!res.ok) throw new PdsFetchError(`Failed to fetch article: ${res.statusText}`);

  const data = (await res.json()) as { value: RawDocument };
  const raw = data.value;
  return {
    title: raw.title,
    content: extractHtml(raw.content),
    path: raw.path,
    site: raw.site,
    canonicalUrl: raw.scribe?.canonicalUrl,
    textContent: raw.textContent,
    publishedAt: raw.publishedAt,
    description: raw.description,
    coverImageUrl: raw.scribe?.coverImageUrl,
    tags: raw.tags,
    contributors: raw.contributors,
    bskyPostRef: raw.bskyPostRef,
    seo: readDocumentSeo(raw.scribe?.seo),
    createdAt: raw.scribe?.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function fetchArticleBySlug(
  author: string,
  publicationUrl: string,
  articleSlug: string,
  signal?: AbortSignal
): Promise<ArticleResult> {
  const site = await fetchSite(author, publicationUrl, signal);

  const allRefs = [
    ...site.ungroupedArticles,
    ...site.groups.flatMap((g) => g.articles),
  ];

  const ref = allRefs.find(
    (r) => r.slug === articleSlug || slugFromUri(r.uri) === articleSlug
  );

  if (!ref) throw new NotFoundError(`Article not found: ${articleSlug}`);

  // ref.uri names the document's own repo — usually the site owner's, but
  // Scribe CMS's Contributors feature (sync-later publish) can point it at
  // a Contributor's repo instead. Resolve from that URI's own DID, not the
  // site's `author`, so a Contributor-authored article on someone else's
  // site resolves from the repo it actually lives in.
  const documentDid = didFromUri(ref.uri);
  const rkey = slugFromUri(ref.uri);
  const article = await fetchArticle(documentDid, rkey, signal);
  return { article, uri: ref.uri };
}
