import type { LoaderFunctionArgs } from "react-router";
import {
  fetchPublication,
  fetchDocumentBySlug,
  fetchArticleBySlug,
  resolvePublicationUri,
} from "@skyscribe-sdk/core";
import type { StandardPublication, StandardDocument } from "@skyscribe-sdk/core";

export function createPublicationLoader(
  author: string,
  publicationUrl: string,
  deps?: { fetchPublication?: typeof fetchPublication }
): (args: LoaderFunctionArgs) => Promise<StandardPublication> {
  const _fetchPublication = deps?.fetchPublication ?? fetchPublication;
  return ({ request }) => _fetchPublication(author, publicationUrl, request.signal);
}

function readSlug(params: LoaderFunctionArgs["params"], slugParam: string): string {
  const slug = params[slugParam];
  if (!slug) {
    throw new Error(
      `Missing route param: ${slugParam}. Name the route segment :${slugParam}, or pass its name as the slugParam argument.`
    );
  }
  return slug;
}

/** Reads the Document's slug from `params.documentSlug` (or `slugParam`)
 * and returns the Document, which carries its own `uri`. */
export function createDocumentRouteLoader(
  author: string,
  publicationUrl: string,
  slugParam = "documentSlug",
  deps?: { fetchDocumentBySlug?: typeof fetchDocumentBySlug }
): (args: LoaderFunctionArgs) => Promise<StandardDocument> {
  const _fetchDocumentBySlug = deps?.fetchDocumentBySlug ?? fetchDocumentBySlug;
  return async ({ request, params }) =>
    _fetchDocumentBySlug(author, publicationUrl, readSlug(params, slugParam), request.signal);
}

export function createWellKnownLoader(
  author: string,
  publicationUrl: string,
  deps?: { resolvePublicationUri?: typeof resolvePublicationUri }
): (args: LoaderFunctionArgs) => Promise<Response> {
  const _resolvePublicationUri = deps?.resolvePublicationUri ?? resolvePublicationUri;
  return async ({ request }) => {
    const uri = await _resolvePublicationUri(author, publicationUrl, request.signal);
    return new Response(uri, { headers: { "Content-Type": "text/plain" } });
  };
}

// ── Deprecated names (ADR 0005): removed in the next major ──────────────

/** @deprecated Use `createPublicationLoader`. */
export function createSiteLoader(
  author: string,
  publicationUrl: string,
  deps?: { fetchSite?: typeof fetchPublication }
): (args: LoaderFunctionArgs) => Promise<StandardPublication> {
  return createPublicationLoader(author, publicationUrl, { fetchPublication: deps?.fetchSite });
}

/** @deprecated `createDocumentRouteLoader` returns the `StandardDocument`,
 * whose `uri` replaces `documentUri`. */
export interface ArticleWithUri extends StandardDocument {
  documentUri: string;
}

/** @deprecated Use `createDocumentRouteLoader`, which reads
 * `params.documentSlug` by default: rename the route segment when you switch.
 * This one still reads `params.articleSlug`. */
export function createArticleRouteLoader(
  author: string,
  publicationUrl: string,
  slugParam = "articleSlug",
  deps?: { fetchArticleBySlug?: typeof fetchArticleBySlug }
): (args: LoaderFunctionArgs) => Promise<ArticleWithUri> {
  const _fetchArticleBySlug = deps?.fetchArticleBySlug ?? fetchArticleBySlug;
  return async ({ request, params }) => {
    const { article, uri } = await _fetchArticleBySlug(
      author,
      publicationUrl,
      readSlug(params, slugParam),
      request.signal
    );
    return { ...article, documentUri: uri };
  };
}
