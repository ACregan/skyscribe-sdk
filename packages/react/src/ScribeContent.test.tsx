import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ScribeContent } from "./ScribeContent.js";

describe("ScribeContent", () => {
  it("renders the given HTML via dangerouslySetInnerHTML", () => {
    const { container } = render(<ScribeContent html="<p>Hello <strong>world</strong></p>" />);
    expect(container.querySelector("p")?.innerHTML).toBe("Hello <strong>world</strong>");
  });

  it("applies the scribe-content class with no className prop", () => {
    const { container } = render(<ScribeContent html="<p>Hi</p>" />);
    expect(container.firstElementChild?.className).toBe("scribe-content");
  });

  it("appends a custom className alongside scribe-content", () => {
    const { container } = render(<ScribeContent html="<p>Hi</p>" className="custom" />);
    expect(container.firstElementChild?.className).toBe("scribe-content custom");
  });

  it("forwards other HTML attributes to the wrapping div", () => {
    const { container } = render(<ScribeContent html="<p>Hi</p>" id="article-body" data-testid="content" />);
    const div = container.firstElementChild;
    expect(div?.getAttribute("id")).toBe("article-body");
    expect(div?.getAttribute("data-testid")).toBe("content");
  });

  it("shows Embeds as players by default", () => {
    const { container } = render(
      <ScribeContent html='<figure data-embed="youtube"><a href="https://youtu.be/dQw4w9WgXcQ">Video</a></figure>' />,
    );
    expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("leaves Embeds as links with embeds={false}", () => {
    const { container } = render(
      <ScribeContent
        embeds={false}
        html='<figure data-embed="youtube"><a href="https://youtu.be/dQw4w9WgXcQ">Video</a></figure>'
      />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("lets a Bluesky Embed take the height its player reports", () => {
    const { container, unmount } = render(
      <ScribeContent html='<figure data-embed="bluesky" data-embed-ref="at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3mxovjfvv4s2f"><a href="https://bsky.app/profile/bsky.app/post/3mxovjfvv4s2f">Post</a></figure>' />,
    );
    const frame = container.querySelector("iframe")!;
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://embed.bsky.app",
        data: { id: "scribe-embed-1", height: 300 },
        source: frame.contentWindow,
      }),
    );
    expect(frame.style.height).toBe("300px");
    unmount();
  });
});
