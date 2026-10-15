export interface ArticleContributor {
  did: string;
  role?: string;
  displayName?: string;
}

export interface ArticleRef {
  uri: string;
  title: string;
  slug?: string;
  splashImageUrl: string | null;
  description?: string | null;
  tags?: string[];
  contributors?: ArticleContributor[];
  createdAt: string;
  publishedAt?: string;
  updatedAt?: string;
  /** The article's canonical URL is another site's: it was imported into
   * SkyScribe and its author chose to keep the original as canonical.
   * Sitemaps leave it out (getSitemapEntries does). Absent means this
   * site's own URL is canonical. */
  canonicalElsewhere?: true;
}

export interface SiteGroup {
  slug: string;
  title: string;
  articles: ArticleRef[];
}

export interface Site {
  uri: string;
  title: string;
  url: string;
  urlPrefix: string;
  description?: string;
  splashImageUrl?: string;
  logoImageUrl?: string;
  groups: SiteGroup[];
  ungroupedArticles: ArticleRef[];
}

export interface Article {
  title: string;
  content: string;
  path: string;
  site: string;
  canonicalUrl?: string;
  textContent?: string;
  coverImageUrl?: string;
  description?: string;
  tags?: string[];
  contributors?: ArticleContributor[];
  bskyPostRef?: { uri: string; cid: string };
  createdAt?: string;
  publishedAt: string;
  updatedAt: string;
}

export interface SiteRecord extends Site {}

export interface ArticleResult {
  article: Article;
  uri: string;
}
