import { describe, it, expect } from "vitest";
import { toSlug, slugFromUri, flattenDocuments, didFromUri } from "./utils.js";

describe("toSlug", () => {
  it("replaces dots with hyphens", () => {
    expect(toSlug("norobots.blog")).toBe("norobots-blog");
  });

  it("strips non-alphanumeric characters other than hyphens", () => {
    expect(toSlug("my_site.co.uk")).toBe("mysite-co-uk");
  });

  it("handles a domain with no dots", () => {
    expect(toSlug("localhost")).toBe("localhost");
  });
});

describe("slugFromUri", () => {
  it("returns the last segment of an AT URI", () => {
    expect(slugFromUri("at://did:plc:abc/site.standard.document/my-post")).toBe(
      "my-post"
    );
  });

  it("returns empty string for an empty URI", () => {
    expect(slugFromUri("")).toBe("");
  });
});

describe("didFromUri", () => {
  it("extracts the DID from an AT URI", () => {
    expect(didFromUri("at://did:plc:abc/site.standard.document/my-post")).toBe(
      "did:plc:abc"
    );
  });

  it("throws on a malformed URI", () => {
    expect(() => didFromUri("not-a-uri")).toThrow("Malformed at:// URI");
  });
});

describe("flattenDocuments", () => {
  it("combines Documents from all Categories into a single array", () => {
    const categories = [
      {
        documents: [
          { uri: "at://1", title: "A", coverImageUrl: null, createdAt: "" },
        ],
      },
      {
        documents: [
          { uri: "at://2", title: "B", coverImageUrl: null, createdAt: "" },
        ],
      },
    ];
    const result = flattenDocuments(categories);
    expect(result).toHaveLength(2);
    expect(result[0].uri).toBe("at://1");
    expect(result[1].uri).toBe("at://2");
  });

  it("returns an empty array when there are no Categories", () => {
    expect(flattenDocuments([])).toEqual([]);
  });
});
