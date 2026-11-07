import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useScribePublication } from "./useScribePublication.js";
import { useScribeSite } from "./deprecated.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchPublication: vi.fn(),
}));

import { fetchPublication } from "@skyscribe-sdk/core";
const mockFetchSite = vi.mocked(fetchPublication);

const mockSite = {
  uri: "at://did:plc:test/site.standard.publication/testpubkey",
  name: "Test Site",
  domain: "test.com",
  basePath: "blog",
  categories: [],
};

function makeWrapper(author: string, publicationUrl: string) {
  let result: ReturnType<typeof useScribePublication>;
  const Component = defineComponent({
    setup() {
      result = useScribePublication(author, publicationUrl);
      return result;
    },
    template: "<div/>",
  });
  const wrapper = mount(Component);
  return { wrapper, getResult: () => result };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useScribePublication", () => {
  it("starts with loading true and site null", () => {
    mockFetchSite.mockReturnValue(new Promise(() => {}));
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    expect(getResult().loading.value).toBe(true);
    expect(getResult().publication.value).toBeNull();
    expect(getResult().error.value).toBeNull();
  });

  it("sets site and clears loading on resolve", async () => {
    mockFetchSite.mockResolvedValueOnce(mockSite);
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    await nextTick();
    await nextTick();
    expect(getResult().publication.value).toEqual(mockSite);
    expect(getResult().loading.value).toBe(false);
    expect(getResult().error.value).toBeNull();
  });

  it("sets error and clears loading on reject", async () => {
    mockFetchSite.mockRejectedValueOnce(new Error("fetch failed"));
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    await nextTick();
    await nextTick();
    expect(getResult().error.value?.message).toBe("fetch failed");
    expect(getResult().loading.value).toBe(false);
    expect(getResult().publication.value).toBeNull();
  });

  it("aborts the request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    mockFetchSite.mockImplementation((_a, _s, signal) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });
    const { wrapper } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    await wrapper.unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("ignores AbortError on unmount", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    mockFetchSite.mockRejectedValueOnce(abortError);
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    await nextTick();
    await nextTick();
    expect(getResult().error.value).toBeNull();
  });

  it("calls fetchPublication with author and publicationUrl", () => {
    mockFetchSite.mockReturnValue(new Promise(() => {}));
    makeWrapper("alice.bsky.social", "https://alice.bsky.social");
    expect(mockFetchSite).toHaveBeenCalledWith(
      "alice.bsky.social",
      "https://alice.bsky.social",
      expect.any(AbortSignal)
    );
  });
});

describe("useScribeSite (deprecated)", () => {
  it("keeps the old { site } result key", async () => {
    mockFetchSite.mockResolvedValueOnce(mockSite);
    let result!: ReturnType<typeof useScribeSite>;
    mount(defineComponent({
      setup() {
        result = useScribeSite("alice.bsky.social", "https://test.com");
        return result;
      },
      template: "<div/>",
    }));
    await new Promise((r) => setTimeout(r, 0));
    expect(result.site.value).toEqual(mockSite);
  });
});
