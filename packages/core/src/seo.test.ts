import { describe, it, expect } from "vitest";
import { readDocumentSeo, SEO_TITLE_MAX, SEO_DESCRIPTION_MAX } from "./seo.js";

describe("readDocumentSeo", () => {
  it("returns the valid fields, trimmed", () => {
    expect(
      readDocumentSeo({ title: "  Short title ", description: "Desc", noindex: true }),
    ).toEqual({ title: "Short title", description: "Desc", noindex: true });
  });

  it("is undefined when nothing is set", () => {
    expect(readDocumentSeo(undefined)).toBeUndefined();
    expect(readDocumentSeo({})).toBeUndefined();
    expect(readDocumentSeo({ title: "  ", noindex: false })).toBeUndefined();
  });

  it("ignores wrong types", () => {
    expect(readDocumentSeo("seo")).toBeUndefined();
    expect(readDocumentSeo({ title: 42, noindex: "true" })).toBeUndefined();
  });

  it("ignores over-long values rather than truncating them", () => {
    expect(
      readDocumentSeo({
        title: "t".repeat(SEO_TITLE_MAX + 1),
        description: "d".repeat(SEO_DESCRIPTION_MAX + 1),
      }),
    ).toBeUndefined();
    expect(readDocumentSeo({ title: "t".repeat(SEO_TITLE_MAX) })?.title).toHaveLength(SEO_TITLE_MAX);
  });
});
