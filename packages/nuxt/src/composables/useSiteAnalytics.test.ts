import { describe, it, expect, vi, beforeEach } from "vitest";
import { useHead } from "#app";
import { siteAnalyticsScript } from "@skyscribe-sdk/core";
import { useSiteAnalytics } from "./useSiteAnalytics.js";

vi.mock("#app", () => ({ useHead: vi.fn() }));

beforeEach(() => {
  vi.mocked(useHead).mockReset();
});

describe("useSiteAnalytics", () => {
  it("adds the beacon to the head", () => {
    useSiteAnalytics();
    const { src, attributes } = siteAnalyticsScript();
    expect(useHead).toHaveBeenCalledWith({
      script: [{ src, ...attributes, key: "skyscribe-site-analytics" }],
    });
  });

  it("adds nothing when disabled", () => {
    useSiteAnalytics({ disabled: true });
    expect(useHead).not.toHaveBeenCalled();
  });
});
