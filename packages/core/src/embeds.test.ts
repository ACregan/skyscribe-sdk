// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  renderEmbeds,
  hasEmbedPlayer,
  listenForEmbedResize,
  listenForEmbedClicks,
  enhanceEmbeds,
  EMBED_KINDS,
} from "./embeds.js";

const embed = (kind: string, href: string, extra = "", text = "Title") =>
  `<figure data-embed="${kind}"${extra}><a href="${href}">${text}</a></figure>`;
// The players themselves, as renderEmbeds made them before Posters.
const players = (html: string) => renderEmbeds(html, { clickToLoad: false });
const srcOf = (html: string) => html.match(/<iframe[^>]*\ssrc="([^"]*)"/)?.[1]?.replace(/&amp;/g, "&");

describe("renderEmbeds", () => {
  it("leaves HTML with no Embeds untouched", () => {
    const html = "<p>Hello <a href=\"https://youtube.com/watch?v=dQw4w9WgXcQ\">video</a></p>";
    expect(renderEmbeds(html)).toBe(html);
  });

  describe("YouTube", () => {
    it.each([
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/watch?v=dQw4w9WgXcQ&amp;list=PL1",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ])("plays %s from youtube-nocookie", (href) => {
      expect(srcOf(players(embed("youtube", href)))).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      );
    });

    it("keeps a start time", () => {
      expect(srcOf(players(embed("youtube", "https://youtu.be/dQw4w9WgXcQ?t=1m30s")))).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90",
      );
    });

    it("renders a lazy, full-width 16:9 player titled from the link", () => {
      const html = players(embed("youtube", "https://youtu.be/dQw4w9WgXcQ", "", "Never &amp; Gonna"));
      expect(html).toContain('class="scribe-embed scribe-embed-youtube"');
      expect(html).toContain('loading="lazy"');
      expect(html).toContain('title="Never &amp; Gonna"');
      expect(html).toContain("aspect-ratio:16 / 9");
      expect(html).toContain("allowfullscreen");
    });
  });

  it.each([
    ["vimeo", "https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871?dnt=1"],
    ["vimeo", "https://vimeo.com/76979871/abc123", "https://player.vimeo.com/video/76979871?dnt=1&h=abc123"],
    [
      "spotify",
      "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
      "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT",
    ],
    [
      "spotify",
      "https://open.spotify.com/intl-de/album/4cOdK2wGLETKBW3PvgPWqT?si=x",
      "https://open.spotify.com/embed/album/4cOdK2wGLETKBW3PvgPWqT",
    ],
    ["codepen", "https://codepen.io/someone/pen/abcDEF1", "https://codepen.io/someone/embed/abcDEF1?default-tab=result"],
    [
      "soundcloud",
      "https://soundcloud.com/artist/a-track",
      "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Fa-track&visual=false",
    ],
    [
      "soundcloud",
      "https://soundcloud.com/artist/sets/an-album",
      "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Fsets%2Fan-album&visual=false",
    ],
  ])("plays %s from %s", (kind, href, src) => {
    expect(srcOf(players(embed(kind, href)))).toBe(src);
  });

  it("plays Bandcamp from the album number in data-embed-ref", () => {
    const html = players(
      embed("bandcamp", "https://artist.bandcamp.com/album/name", ' data-embed-ref="album=1234567"'),
    );
    expect(srcOf(html)).toBe(
      "https://bandcamp.com/EmbeddedPlayer/album=1234567/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/",
    );
  });

  it("plays a Bluesky post from its at:// URI, with an id to report its height", () => {
    const ref = "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxovjfvv4s2f";
    const html = renderEmbeds(
      embed("bluesky", "https://bsky.app/profile/bsky.app/post/3mxovjfvv4s2f", ` data-embed-ref="${ref}"`) +
        embed("bluesky", "https://bsky.app/profile/bsky.app/post/3mxovjfvv4s2f", ` data-embed-ref="${ref}"`),
    );
    expect(srcOf(html)).toBe(
      "https://embed.bsky.app/embed/did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxovjfvv4s2f?id=scribe-embed-1",
    );
    expect(html).toContain('data-bluesky-id="scribe-embed-1"');
    expect(html).toContain('data-bluesky-id="scribe-embed-2"');
  });

  it("is the same every time, so server and browser output match", () => {
    const html = embed(
      "bluesky",
      "https://bsky.app/profile/x/post/3mxovjfvv4s2f",
      ' data-embed-ref="at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxovjfvv4s2f"',
    );
    expect(renderEmbeds(html)).toBe(renderEmbeds(html));
  });

  it("adds the Embed classes to a link card and keeps its card", () => {
    const card = '<a href="https://example.com/"><img src="https://example.com/og.jpg" alt=""><strong>Title</strong></a>';
    expect(renderEmbeds(`<figure data-embed="link">${card}</figure>`)).toBe(
      `<figure class="scribe-embed scribe-embed-link" data-embed="link">${card}</figure>`,
    );
  });

  describe("never trusts the stored HTML", () => {
    it.each([
      ["a URL on another host", embed("youtube", "https://evil.example/watch?v=dQw4w9WgXcQ")],
      ["a malformed video id", embed("youtube", "https://youtu.be/not-an-id")],
      ["a script URL", embed("youtube", "javascript:alert(1)")],
      ["Bandcamp with no number", embed("bandcamp", "https://artist.bandcamp.com/album/x")],
      ["Bandcamp with an injected ref", embed("bandcamp", "https://artist.bandcamp.com/album/x", ' data-embed-ref="album=1/../../evil"')],
      ["Bluesky with a non-post ref", embed("bluesky", "https://bsky.app/", ' data-embed-ref="at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.graph.list/3mxovjfvv4s2f"')],
      ["an unknown kind", embed("iframe", "https://evil.example/")],
      ["no link at all", '<figure data-embed="youtube"><p>No link</p></figure>'],
    ])("leaves %s as it was", (_, html) => {
      expect(renderEmbeds(html)).toBe(html);
      expect(players(html)).toBe(html);
      expect(hasEmbedPlayer(html)).toBe(false);
    });

    it("escapes the title it copies from the link text", () => {
      const html = players(embed("youtube", "https://youtu.be/dQw4w9WgXcQ", "", '"><script>x</script>'));
      expect(html).not.toContain("<script>");
      expect(html).toContain('title="&quot;&gt; x"');
    });
  });

  it("leaves everything around an Embed alone", () => {
    const html = `<p>Before</p>${embed("youtube", "https://youtu.be/dQw4w9WgXcQ")}<figure><img src="a.png"></figure><p>After</p>`;
    const out = renderEmbeds(html);
    expect(out.startsWith("<p>Before</p><figure class=\"scribe-embed")).toBe(true);
    expect(out.endsWith('<figure><img src="a.png"></figure><p>After</p>')).toBe(true);
  });

  it("lists its kinds", () => {
    expect(EMBED_KINDS).toEqual(["link", "bluesky", "youtube", "spotify", "bandcamp", "vimeo", "codepen", "soundcloud"]);
  });
});

describe("listenForEmbedResize", () => {
  function setup() {
    document.body.innerHTML = renderEmbeds(
      embed(
        "bluesky",
        "https://bsky.app/profile/x/post/3mxovjfvv4s2f",
        ' data-embed-ref="at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxovjfvv4s2f"',
      ),
    );
    const frame = document.querySelector("iframe")!;
    const stop = listenForEmbedResize(window);
    const post = (origin: string, data: unknown, source: unknown = frame.contentWindow) =>
      window.dispatchEvent(new MessageEvent("message", { origin, data, source: source as Window }));
    return { frame, stop, post };
  }

  it("sets a Bluesky Embed to the height its player reports", () => {
    const { frame, stop, post } = setup();
    post("https://embed.bsky.app", { id: "scribe-embed-1", height: 512.4 });
    expect(frame.style.height).toBe("513px");
    stop();
  });

  it("ignores messages from anywhere else, or from another frame", () => {
    const { frame, stop, post } = setup();
    post("https://evil.example", { id: "scribe-embed-1", height: 10 });
    post("https://embed.bsky.app", { id: "scribe-embed-1", height: 10 }, window);
    expect(frame.style.height).toBe("400px");
    stop();
  });

  it("stops listening", () => {
    const { frame, stop, post } = setup();
    stop();
    post("https://embed.bsky.app", { id: "scribe-embed-1", height: 10 });
    expect(frame.style.height).toBe("400px");
  });
});

describe("Posters (click-to-load, ADR 0080)", () => {
  const youtube = embed(
    "youtube",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "",
    '<img src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" alt=""><strong>Never Gonna</strong>',
  );

  it("shows a media Embed as a Poster: a link to its page, the player's size", () => {
    const html = renderEmbeds(youtube);
    expect(html).not.toContain("<iframe");
    expect(html).toContain('<a class="scribe-embed-poster" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    expect(html).toContain("aspect-ratio:16 / 9");
    expect(html).toContain('<img class="scribe-embed-poster-image" src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
    expect(html).toContain('<span class="scribe-embed-poster-kind">YouTube</span>');
    expect(html).toContain('<span class="scribe-embed-poster-title">Never Gonna</span>');
    expect(html).toContain('<span class="scribe-embed-poster-button">Play</span>');
    expect(html).toContain('aria-label="Play: Never Gonna (YouTube)"');
  });

  it("says Load player for kinds that can't start from the click", () => {
    const html = renderEmbeds(embed("spotify", "https://open.spotify.com/playlist/37i9dQZF1E39WlLD9wri6m"));
    expect(html).toContain(">Load player</span>");
    expect(html).toContain("height:352px");
  });

  it("keeps Bandcamp's ref on the figure, for the click", () => {
    const html = renderEmbeds(
      embed("bandcamp", "https://artist.bandcamp.com/album/name", ' data-embed-ref="album=1234567"'),
    );
    expect(html).toContain('data-embed-ref="album=1234567"');
    expect(html).toContain("scribe-embed-poster");
  });

  it("keeps Bluesky posts live", () => {
    const html = renderEmbeds(
      embed("bluesky", "https://bsky.app/profile/x/post/3mxovjfvv4s2f", ' data-embed-ref="at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxovjfvv4s2f"'),
    );
    expect(html).toContain("<iframe");
    expect(html).not.toContain("scribe-embed-poster");
  });

  it("gives a YouTube Embed with no stored image the video's thumbnail", () => {
    expect(renderEmbeds(embed("youtube", "https://youtu.be/dQw4w9WgXcQ"))).toContain(
      'src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"',
    );
  });

  it.each([
    ["http", "http://example.com/a.jpg"],
    ["javascript", "javascript:alert(1)"],
    ["data", "data:image/png;base64,AAAA"],
  ])("shows no image for a %s thumbnail", (_, src) => {
    const html = renderEmbeds(embed("vimeo", "https://vimeo.com/76979871", "", `<img src="${src}"><strong>T</strong>`));
    expect(html).not.toContain("<img");
  });

  it("escapes the title", () => {
    const html = renderEmbeds(embed("vimeo", "https://vimeo.com/76979871", "", '"><script>x</script>'));
    expect(html).not.toContain("<script>");
  });

  it("leaves an already rendered Embed alone", () => {
    const once = renderEmbeds(youtube);
    expect(renderEmbeds(once)).toBe(once);
  });
});

describe("hasEmbedPlayer", () => {
  it("is true for a media or Bluesky Embed whose link matches its kind", () => {
    expect(hasEmbedPlayer(embed("youtube", "https://youtu.be/dQw4w9WgXcQ"))).toBe(true);
    expect(
      hasEmbedPlayer(embed("bandcamp", "https://a.bandcamp.com/album/x", ' data-embed-ref="album=1"')),
    ).toBe(true);
  });

  it("is false for a link card or a link that doesn't match", () => {
    expect(hasEmbedPlayer('<figure data-embed="link"><a href="https://example.com/">x</a></figure>')).toBe(false);
    expect(hasEmbedPlayer(embed("vimeo", "https://vimeo.com/not-a-video"))).toBe(false);
  });
});

describe("listenForEmbedClicks", () => {
  // Clicks a link and reports whether listenForEmbedClicks took the click,
  // then stops jsdom following the link (it can't navigate).
  function clickWasTaken(link: Element, init: MouseEventInit = {}): boolean {
    let taken = false;
    const record = (event: Event) => {
      taken = event.defaultPrevented;
      event.preventDefault();
    };
    window.addEventListener("click", record);
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
    window.removeEventListener("click", record);
    return taken;
  }

  function setup(html: string) {
    document.body.innerHTML = renderEmbeds(html);
    const stop = listenForEmbedClicks(window);
    const poster = document.querySelector<HTMLAnchorElement>("a.scribe-embed-poster")!;
    return { stop, poster };
  }

  it("swaps a Poster for its player, started, and focuses it", () => {
    const { stop, poster } = setup(embed("youtube", "https://youtu.be/dQw4w9WgXcQ", "", "<strong>Never Gonna</strong>"));
    poster.querySelector("span")!.click();
    const frame = document.querySelector("iframe")!;
    expect(frame.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1");
    expect(frame.getAttribute("allow")).toMatch(/^autoplay; /);
    expect(frame.getAttribute("title")).toBe("Never Gonna");
    expect(document.activeElement).toBe(frame);
    expect(document.querySelector("figure")!.getAttribute("data-embed")).toBe("youtube");
    stop();
  });

  it("loads Spotify without autoplay", () => {
    const { stop, poster } = setup(embed("spotify", "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"));
    poster.click();
    expect(document.querySelector("iframe")!.getAttribute("src")).toBe(
      "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT",
    );
    stop();
  });

  it("builds the player from the Embed's kind and link, never from the page", () => {
    document.body.innerHTML =
      '<figure data-embed="youtube"><a class="scribe-embed-poster" href="https://evil.example/watch?v=dQw4w9WgXcQ" data-src="https://evil.example/">x</a></figure>';
    const stop = listenForEmbedClicks(window);
    expect(clickWasTaken(document.querySelector("a")!)).toBe(false);
    expect(document.querySelector("iframe")).toBeNull();
    stop();
  });

  it("leaves a click with a modifier key (a new tab) to the browser", () => {
    const { stop, poster } = setup(embed("youtube", "https://youtu.be/dQw4w9WgXcQ"));
    expect(clickWasTaken(poster, { ctrlKey: true })).toBe(false);
    expect(document.querySelector("iframe")).toBeNull();
    stop();
  });

  it("stops listening", () => {
    const { stop, poster } = setup(embed("youtube", "https://youtu.be/dQw4w9WgXcQ"));
    stop();
    expect(clickWasTaken(poster)).toBe(false);
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("enhanceEmbeds does clicks and Bluesky resizing, and stops both", () => {
    document.body.innerHTML = renderEmbeds(embed("youtube", "https://youtu.be/dQw4w9WgXcQ"));
    const stop = enhanceEmbeds(window);
    document.querySelector<HTMLAnchorElement>("a.scribe-embed-poster")!.click();
    expect(document.querySelector("iframe")).not.toBeNull();
    stop();
  });
});
