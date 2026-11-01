import type { Site, SiteRecord, ArticleRef, ArticleContributor } from "./types.js";
import { resolveIdentifier, resolvePds } from "./resolve.js";
import { slugFromUri } from "./utils.js";
import { PdsFetchError } from "./errors.js";
import { pdsFetch } from "./http.js";
import { readDocumentSeo } from "./seo.js";

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
  // Spec-compliant top-level field (site.standard.publication#description).
  // Prefer this over scribe.description below — see listSites() mapping.
  // Optional because plenty of existing records still only have the
  // scribe.description a prior version wrote instead of this field.
  description?: string;
  scribe: ScribeManifest;
}

interface RawDocument {
  title: string;
  path?: string;
  site: string;
  publishedAt?: string;
  description?: string | null;
  tags?: string[];
  contributors?: ArticleContributor[];
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

export async function listSites(
  author: string,
  signal?: AbortSignal
): Promise<SiteRecord[]> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const records = await listAllRecords<RawPublication>(pdsUrl, did, "site.standard.publication", signal);

  return records
    .filter(({ value }) => value.scribe != null)
    .map(({ uri, value }) => ({
      uri,
      title: value.scribe.title,
      url: value.scribe.domain,
      urlPrefix: value.scribe.basePath,
      // Spec puts description at the top level (site.standard.publication);
      // scribe.description is a legacy location a prior CMS version wrote
      // instead — kept as a fallback until existing records are migrated.
      description: value.description ?? value.scribe.description,
      splashImageUrl: value.scribe.splashImageUrl,
      logoImageUrl: value.scribe.logoImageUrl,
      groups: value.scribe.groups ?? [],
      ungroupedArticles: value.scribe.ungroupedArticles ?? [],
    }));
}

export async function listArticles(
  author: string,
  signal?: AbortSignal
): Promise<ArticleRef[]> {
  const did = await resolveIdentifier(author, signal);
  const pdsUrl = await resolvePds(did, signal);
  const records = await listAllRecords<RawDocument>(pdsUrl, did, "site.standard.document", signal);

  return records.map(({ uri, value }) => ({
    uri,
    title: value.title,
    slug: slugForDocument(uri, value.path),
    splashImageUrl: value.scribe?.coverImageUrl ?? value.splashImageUrl ?? null,
    description: value.description,
    tags: value.tags,
    contributors: value.contributors,
    createdAt: value.scribe?.createdAt ?? value.createdAt ?? value.publishedAt ?? "",
    publishedAt: value.publishedAt,
    updatedAt: value.updatedAt,
    ...(readDocumentSeo(value.scribe?.seo)?.noindex ? { noindex: true as const } : {}),
  }));
}
