import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SHARE_CARD, shareMeta } from "./shareCard";

const content = (
  tags: Array<Record<string, string | undefined>>,
  key: string
) => tags.find((t) => t.property === key || t.name === key)?.content;

describe("the docs' share card", () => {
  it("exists, where the tags point", () => {
    const file = fileURLToPath(
      new URL(`../../public${SHARE_CARD.path}`, import.meta.url)
    );
    expect(existsSync(file)).toBe(true);
  });

  it("carries the page's own title, description and URL, with an absolute image", () => {
    const tags = shareMeta({
      origin: "https://sdk.skyscribe.app",
      title: "Quick start — SkyScribe SDK",
      description: "Install and fetch.",
      url: "https://sdk.skyscribe.app/quick-start",
    });
    expect(content(tags, "og:title")).toBe("Quick start — SkyScribe SDK");
    expect(content(tags, "og:description")).toBe("Install and fetch.");
    expect(content(tags, "og:url")).toBe(
      "https://sdk.skyscribe.app/quick-start"
    );
    expect(content(tags, "og:image")).toBe(
      "https://sdk.skyscribe.app/images/share/share-card.jpg"
    );
    expect(content(tags, "twitter:card")).toBe("summary_large_image");
  });
});
