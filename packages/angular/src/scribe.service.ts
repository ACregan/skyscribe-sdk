import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  fetchPublication,
  fetchDocument,
  fetchDocumentBySlug,
  fetchArticleBySlug,
  resolvePublicationUri,
} from "@skyscribe-sdk/core";
import type { StandardPublication, StandardDocument, ArticleResult } from "@skyscribe-sdk/core";

// A cold Observable over one fetch: it starts on subscribe and aborts on
// unsubscribe.
function fromFetch<T>(run: (signal: AbortSignal) => Promise<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    const controller = new AbortController();
    run(controller.signal)
      .then((value) => {
        subscriber.next(value);
        subscriber.complete();
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        subscriber.error(err);
      });
    return () => controller.abort();
  });
}

@Injectable({ providedIn: "root" })
export class ScribeService {
  getPublication(author: string, publicationUrl: string): Observable<StandardPublication> {
    return fromFetch((signal) => fetchPublication(author, publicationUrl, signal));
  }

  // Fetches by record key (rkey). Use getDocumentBySlug when you have the
  // human-readable slug from a URL.
  getDocument(author: string, rkey: string): Observable<StandardDocument> {
    return fromFetch((signal) => fetchDocument(author, rkey, signal));
  }

  // Looks the Document up by its human-readable slug in the Publication at
  // `publicationUrl`. The Document carries its own `uri`.
  getDocumentBySlug(
    author: string,
    publicationUrl: string,
    documentSlug: string
  ): Observable<StandardDocument> {
    return fromFetch((signal) => fetchDocumentBySlug(author, publicationUrl, documentSlug, signal));
  }

  getPublicationUri(author: string, publicationUrl: string): Observable<string> {
    return fromFetch((signal) => resolvePublicationUri(author, publicationUrl, signal));
  }

  getDocumentUri(author: string, publicationUrl: string, documentSlug: string): Observable<string> {
    return fromFetch((signal) =>
      fetchDocumentBySlug(author, publicationUrl, documentSlug, signal).then((d) => d.uri)
    );
  }

  // ── Deprecated names (ADR 0005): removed in the next major ────────────

  /** @deprecated Use `getPublication`. */
  getSite(author: string, publicationUrl: string): Observable<StandardPublication> {
    return this.getPublication(author, publicationUrl);
  }

  /** @deprecated Use `getDocument`. */
  getArticle(author: string, rkey: string): Observable<StandardDocument> {
    return this.getDocument(author, rkey);
  }

  /** @deprecated Use `getDocumentBySlug`, which emits the Document itself
   * (it carries its own `uri`). This one still emits `{ article, uri }`. */
  getArticleBySlug(
    author: string,
    publicationUrl: string,
    articleSlug: string
  ): Observable<ArticleResult> {
    return fromFetch((signal) => fetchArticleBySlug(author, publicationUrl, articleSlug, signal));
  }
}
