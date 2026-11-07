import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useScribeDocumentUri } from "./useScribeDocumentUri.js";

vi.mock("@skyscribe-sdk/core", () => ({
  fetchDocumentBySlug: vi.fn(),
}));

import { fetchDocumentBySlug } from "@skyscribe-sdk/core";
const mockFetchArticleBySlug = vi.mocked(fetchDocumentBySlug);

const DOCUMENT_URI = "at://did:plc:abc/site.standard.document/3jxtctq7kqm2y";

function makeWrapper(author: string, publicationUrl: string, documentSlug: string) {
  let result: ReturnType<typeof useScribeDocumentUri>;
  const Component = defineComponent({
    setup() {
      result = useScribeDocumentUri(author, publicationUrl, documentSlug);
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

describe("useScribeDocumentUri", () => {
  it("starts with loading true and uri null", () => {
    mockFetchArticleBySlug.mockReturnValue(new Promise(() => {}));
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social", "hello");
    expect(getResult().loading.value).toBe(true);
    expect(getResult().uri.value).toBeNull();
    expect(getResult().error.value).toBeNull();
  });

  it("sets uri and clears loading on resolve", async () => {
    mockFetchArticleBySlug.mockResolvedValueOnce({ uri: DOCUMENT_URI } as never);
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social", "hello");
    await nextTick();
    await nextTick();
    expect(getResult().uri.value).toBe(DOCUMENT_URI);
    expect(getResult().loading.value).toBe(false);
  });

  it("sets error and clears loading on reject", async () => {
    mockFetchArticleBySlug.mockRejectedValueOnce(new Error("failed"));
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social", "hello");
    await nextTick();
    await nextTick();
    expect(getResult().error.value?.message).toBe("failed");
    expect(getResult().loading.value).toBe(false);
  });

  it("aborts the request on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;
    mockFetchArticleBySlug.mockImplementation((_a, _ss, _s, signal) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });
    const { wrapper } = makeWrapper("alice.bsky.social", "https://alice.bsky.social", "hello");
    await wrapper.unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("ignores AbortError on unmount", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    mockFetchArticleBySlug.mockRejectedValueOnce(abortError);
    const { getResult } = makeWrapper("alice.bsky.social", "https://alice.bsky.social", "hello");
    await nextTick();
    await nextTick();
    expect(getResult().error.value).toBeNull();
  });
});
