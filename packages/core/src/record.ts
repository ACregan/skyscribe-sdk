// Internal: maps raw site.standard records (as the PDS returns them) to
// the SDK's StandardPublication / StandardDocument shapes (ADR 0005). The
// record keeps its own field names (`scribe.groups`, `articles`,
// `splashImageUrl`); only the SDK's shapes use the new names.
import type {
  Category,
  DocumentContributor,
  DocumentRef,
  StandardDocument,
  StandardPublication,
} from "./types.js";
import { readDocumentSeo } from "./seo.js";

/** A Document ref as stored in `scribe.groups[].articles[]`. */
export type RawDocumentRef = Omit<DocumentRef, "coverImageUrl"> & {
  splashImageUrl?: string | null;
};

interface RawCategory {
  slug: string;
  title: string;
  articles?: RawDocumentRef[];
}

export interface RawPublication {
  url?: string;
  name?: string;
  // Spec-compliant top-level field. Optional because older records only
  // have the scribe.description a prior version wrote instead.
  description?: string;
  scribe: {
    domain: string;
    basePath: string;
    title: string;
    description?: string;
    splashImageUrl?: string;
    logoImageUrl?: string;
    groups?: RawCategory[];
  };
}

export interface RawDocument {
  title: string;
  path: string;
  site: string;
  publishedAt: string;
  description?: string;
  content?: { $type: string; html?: string } | unknown;
  textContent?: string;
  bskyPostRef?: { uri: string; cid: string };
  tags?: string[];
  contributors?: DocumentContributor[];
  updatedAt: string;
  scribe?: {
    coverImageUrl?: string;
    createdAt?: string;
    canonicalUrl?: string;
    seo?: unknown;
  };
}

export function toDocumentRef(raw: RawDocumentRef): DocumentRef {
  const { splashImageUrl, ...rest } = raw;
  return { ...rest, coverImageUrl: splashImageUrl ?? null };
}

function toCategory(raw: RawCategory): Category {
  return {
    slug: raw.slug,
    title: raw.title,
    documents: (raw.articles ?? []).map(toDocumentRef),
  };
}

export function toPublication(uri: string, value: RawPublication): StandardPublication {
  const scribe = value.scribe;
  return {
    uri,
    // The spec's `name`; scribe.title on records written before it was set.
    name: value.name ?? scribe.title,
    domain: scribe.domain,
    basePath: scribe.basePath ?? "",
    // Spec puts description at the top level; scribe.description is a
    // legacy location a prior CMS version wrote instead.
    description: value.description ?? scribe.description,
    splashImageUrl: scribe.splashImageUrl,
    logoImageUrl: scribe.logoImageUrl,
    categories: (scribe.groups ?? []).map(toCategory),
  };
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

export function toDocument(uri: string, raw: RawDocument): StandardDocument {
  return {
    uri,
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
