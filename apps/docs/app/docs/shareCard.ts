// The docs' link-preview card (Open Graph and Twitter Card), on every
// docs page: links to sdk.skyscribe.app showed as a bare URL on Bluesky
// and elsewhere, and as a text-only card on standard.site.
//
// public/images/share/share-card.jpg (1200x630) is the skyscribe.app
// homepage's share card redrawn for the SDK: the same sky and type, with
// the docs header's SDK badge. One card for every page; each page's own
// title and description go in the tags beside it.
export const SHARE_CARD = {
  path: "/images/share/share-card.jpg",
  width: 1200,
  height: 630,
  alt: "SkyScribe SDK: Standard.site writing, on your own website. Over a blue sky with clouds.",
} as const;

export function shareMeta(input: {
  origin: string;
  /** The page's full <title>. */
  title: string;
  description: string;
  /** The page's canonical URL. */
  url: string;
}) {
  const image = `${input.origin}${SHARE_CARD.path}`;
  return [
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "SkyScribe SDK" },
    { property: "og:url", content: input.url },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:image", content: image },
    { property: "og:image:width", content: String(SHARE_CARD.width) },
    { property: "og:image:height", content: String(SHARE_CARD.height) },
    { property: "og:image:alt", content: SHARE_CARD.alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: image },
  ];
}
