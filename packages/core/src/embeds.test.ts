// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderEmbeds, listenForEmbedResize, EMBED_KINDS } from "./embeds.js";

const embed = (kind: string, href: string, extra = "", text = "Title") =>
  `<figure data-embed="${kind}"${extra}><a href="${href}">${text}</a></figure>`;
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
      expect(srcOf(renderEmbeds(embed("youtube", href)))).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      );
    });

    it("keeps a start time", () => {
      expect(srcOf(renderEmbeds(embed("youtube", "https://youtu.be/dQw4w9WgXcQ?t=1m30s")))).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90",
      );
    });

    it("renders a lazy, full-width 16:9 player titled from the link", () => {
      const html = renderEmbeds(embed("youtube", "https://youtu.be/dQw4w9WgXcQ", "", "Never &amp; Gonna"));
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
    expect(srcOf(renderEmbeds(embed(kind, href)))).toBe(src);
  });

  it("plays Bandcamp from the album number in data-embed-ref", () => {
    const html = renderEmbeds(
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
    });

    it("escapes the title it copies from the link text", () => {
      const html = renderEmbeds(embed("youtube", "https://youtu.be/dQw4w9WgXcQ", "", '"><script>x</script>'));
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
