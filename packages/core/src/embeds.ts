// Embeds (skyscribe-app ADR 0078). An Embed is stored in a Document's HTML
// as a working link, marked with its kind:
//
//   <figure data-embed="youtube">
//     <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Title</a>
//   </figure>
//
// Anything that doesn't know about Embeds shows the link. renderEmbeds
// swaps each one for its kind's player. The stored HTML is never trusted
// to say what to load: each kind has a strict pattern for its page URL
// (and `data-embed-ref`, where it has one), the player's address is built
// only from the parts that match, and anything else stays the link.

/** The kinds of Embed this version can show. Any other `data-embed` is
 * left as its fallback link. */
export const EMBED_KINDS = [
  "link",
  "bluesky",
  "youtube",
  "spotify",
  "bandcamp",
  "vimeo",
  "codepen",
  "soundcloud",
] as const;

export type EmbedKind = (typeof EMBED_KINDS)[number];

/** Hosts a page with Embeds loads players from: what a strict
 * Content-Security-Policy's `frame-src` needs to allow. */
export const EMBED_FRAME_HOSTS = [
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://open.spotify.com",
  "https://bandcamp.com",
  "https://codepen.io",
  "https://w.soundcloud.com",
  "https://embed.bsky.app",
] as const;

interface Player {
  src: string;
  /** CSS aspect-ratio for players that scale with their width, or a fixed
   * height in pixels. */
  size: { aspectRatio: string } | { height: number };
  allow?: string;
  /** Bluesky: the id its iframe reports its height with. */
  blueskyId?: string;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function youtube(url: URL): Player | null {
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1);
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const path = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/);
    id = path ? path[1] : url.pathname === "/watch" ? url.searchParams.get("v") : null;
  }
  if (!id || !YOUTUBE_ID.test(id)) return null;
  const start = seconds(url.searchParams.get("t") ?? url.searchParams.get("start"));
  return {
    src: `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`,
    size: { aspectRatio: "16 / 9" },
    allow: "accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
  };
}

// "90", "90s" or "1m30s" → 90.
function seconds(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!match || !match[0]) return null;
  const total = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  return total > 0 ? total : null;
}

function vimeo(url: URL): Player | null {
  const host = url.hostname.replace(/^www\./, "");
  const match =
    host === "vimeo.com"
      ? url.pathname.match(/^\/(\d+)(?:\/([0-9a-f]+))?\/?$/)
      : host === "player.vimeo.com"
        ? url.pathname.match(/^\/video\/(\d+)\/?$/)
        : null;
  if (!match) return null;
  // An unlisted video's privacy hash, from the path or ?h=.
  const hash = match[2] ?? url.searchParams.get("h");
  const query = new URLSearchParams({ dnt: "1" });
  if (hash && /^[0-9a-f]+$/.test(hash)) query.set("h", hash);
  return {
    src: `https://player.vimeo.com/video/${match[1]}?${query}`,
    size: { aspectRatio: "16 / 9" },
    allow: "fullscreen; picture-in-picture; clipboard-write",
  };
}

function spotify(url: URL): Player | null {
  if (url.hostname !== "open.spotify.com") return null;
  const match = url.pathname.match(
    /^\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]{22})\/?$/,
  );
  if (!match) return null;
  const single = match[1] === "track" || match[1] === "episode";
  return {
    src: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
    size: { height: single ? 152 : 352 },
    allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
  };
}

// Bandcamp's player needs the album or track number, which isn't in the
// page URL; it's stored in data-embed-ref when the Embed is added.
function bandcamp(url: URL, ref: string | null): Player | null {
  if (!/^[a-z0-9-]+\.bandcamp\.com$/.test(url.hostname) && url.hostname !== "bandcamp.com") {
    return null;
  }
  const match = ref?.match(/^(album|track)=(\d+)$/);
  if (!match) return null;
  return {
    src: `https://bandcamp.com/EmbeddedPlayer/${match[1]}=${match[2]}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/`,
    size: { height: 120 },
  };
}

function codepen(url: URL): Player | null {
  if (url.hostname !== "codepen.io") return null;
  const match = url.pathname.match(/^\/([A-Za-z0-9_-]+)\/(?:pen|full|details|embed)\/([A-Za-z0-9]+)\/?$/);
  if (!match) return null;
  return {
    src: `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`,
    size: { height: 400 },
  };
}

function soundcloud(url: URL): Player | null {
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  if (host !== "soundcloud.com") return null;
  // A track (user/track) or a playlist (user/sets/name).
  const match = url.pathname.match(/^\/([A-Za-z0-9_-]+)\/(sets\/)?([A-Za-z0-9_-]+)\/?$/);
  if (!match) return null;
  const page = `https://soundcloud.com/${match[1]}/${match[2] ?? ""}${match[3]}`;
  return {
    src: `https://w.soundcloud.com/player/?${new URLSearchParams({ url: page, visual: "false" })}`,
    size: { height: match[2] ? 450 : 166 },
    allow: "autoplay",
  };
}

// The post's at:// URI, in data-embed-ref: the web URL's handle can change.
function bluesky(_url: URL, ref: string | null, id: string): Player | null {
  const match = ref?.match(/^at:\/\/(did:(?:plc:[a-z2-7]{24}|web:[a-zA-Z0-9.-]+))\/app\.bsky\.feed\.post\/([a-z2-7]{13})$/);
  if (!match) return null;
  return {
    src: `https://embed.bsky.app/embed/${match[1]}/app.bsky.feed.post/${match[2]}?id=${id}`,
    // Until it reports its real height (listenForEmbedResize).
    size: { height: 400 },
    blueskyId: id,
  };
}

const PLAYERS: Record<Exclude<EmbedKind, "link">, (url: URL, ref: string | null, id: string) => Player | null> = {
  youtube,
  vimeo,
  spotify,
  bandcamp,
  codepen,
  soundcloud,
  bluesky,
};

// ── Reading the stored HTML ─────────────────────────────────────────────

const FIGURE = /<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi;

function attribute(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? decodeEntities(match[1] ?? match[2] ?? "") : null;
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi, (_, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower === "amp") return "&";
    if (lower === "lt") return "<";
    if (lower === "gt") return ">";
    if (lower === "quot") return '"';
    if (lower === "apos" || lower === "#39") return "'";
    const code = lower.startsWith("#x") ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : "";
  });
}

function escapeAttribute(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// The player's accessible title: the link's text, kept short (a Bluesky
// snapshot's excerpt can run long).
function titleOf(html: string): string {
  const text = decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return text.length > 120 ? `${text.slice(0, 119)}…` : text;
}

function pageUrl(inner: string): URL | null {
  const href = inner.match(/<a\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  if (!href) return null;
  try {
    const url = new URL(decodeEntities(href[1] ?? href[2] ?? ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function iframe(kind: string, player: Player, title: string): string {
  const style =
    "size" in player && "aspectRatio" in player.size
      ? `display:block;width:100%;aspect-ratio:${player.size.aspectRatio};border:0`
      : `display:block;width:100%;height:${(player.size as { height: number }).height}px;border:0`;
  const attrs = [
    `src="${escapeAttribute(player.src)}"`,
    `title="${escapeAttribute(title)}"`,
    `loading="lazy"`,
    `referrerpolicy="strict-origin-when-cross-origin"`,
    `style="${style}"`,
    player.allow ? `allow="${player.allow}"` : null,
    kind === "youtube" || kind === "vimeo" ? "allowfullscreen" : null,
    player.blueskyId ? `data-bluesky-id="${player.blueskyId}" scrolling="no"` : null,
  ].filter(Boolean);
  return `<figure class="scribe-embed scribe-embed-${kind}" data-embed="${kind}"><iframe ${attrs.join(" ")}></iframe></figure>`;
}

/**
 * Turns every Embed in a Document's HTML into its kind's player (a lazy
 * iframe from the provider). A link card keeps its stored card, with the
 * `scribe-embed` classes added. Anything that isn't a valid Embed of a
 * known kind is left exactly as it was.
 */
export function renderEmbeds(html: string): string {
  if (!html.includes("data-embed")) return html;
  let count = 0;
  return html.replace(FIGURE, (whole, attrs: string, inner: string) => {
    const kind = attribute(attrs, "data-embed");
    if (!kind || !(EMBED_KINDS as readonly string[]).includes(kind)) return whole;
    if (kind === "link") {
      return `<figure class="scribe-embed scribe-embed-link" data-embed="link">${inner}</figure>`;
    }
    const url = pageUrl(inner);
    if (!url) return whole;
    const player = PLAYERS[kind as Exclude<EmbedKind, "link">](url, attribute(attrs, "data-embed-ref"), `scribe-embed-${++count}`);
    return player ? iframe(kind, player, titleOf(inner) || kind) : whole;
  });
}

// The parts of a browser window listenForEmbedResize uses. Typed here
// rather than with the DOM library, which core doesn't depend on.
interface EmbedMessage {
  origin: string;
  data: unknown;
  source: unknown;
}

export interface EmbedWindow {
  addEventListener(type: "message", listener: (event: EmbedMessage) => void): void;
  removeEventListener(type: "message", listener: (event: EmbedMessage) => void): void;
  document: {
    querySelectorAll(selector: string): ArrayLike<{ contentWindow: unknown; style: { height: string } }>;
  };
}

/**
 * Lets Bluesky post Embeds grow to their real height: Bluesky's player
 * reports it with postMessage. Call once in the browser with `window`;
 * returns a function that stops listening. Without it, a Bluesky Embed
 * stays 400px tall.
 */
export function listenForEmbedResize(target: EmbedWindow): () => void {
  const onMessage = (event: EmbedMessage) => {
    if (event.origin !== "https://embed.bsky.app") return;
    const data = event.data as { id?: unknown; height?: unknown } | null;
    if (typeof data?.id !== "string" || typeof data.height !== "number") return;
    if (!/^scribe-embed-\d+$/.test(data.id)) return;
    const frames = target.document.querySelectorAll(`iframe[data-bluesky-id="${data.id}"]`);
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) frames[i].style.height = `${Math.ceil(data.height)}px`;
    }
  };
  target.addEventListener("message", onMessage);
  return () => target.removeEventListener("message", onMessage);
}
