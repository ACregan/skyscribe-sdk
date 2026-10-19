// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  siteAnalyticsScript,
  siteAnalyticsScriptTag,
  loadSiteAnalytics,
  SITE_ANALYTICS_SCRIPT_SRC,
} from "./analytics.js";

const beacons = () => document.querySelectorAll(`script[src="${SITE_ANALYTICS_SCRIPT_SRC}"]`);

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("siteAnalyticsScript", () => {
  it("describes the Cloudflare beacon with SkyScribe's token, counting client-side navigations", () => {
    const { src, attributes } = siteAnalyticsScript();
    expect(src).toBe("https://static.cloudflareinsights.com/beacon.min.js");
    expect(attributes.defer).toBe(true);
    expect(JSON.parse(attributes["data-cf-beacon"])).toEqual({
      token: "02a51b1a213d484da7ec7accff28eaff",
      spa: true,
    });
  });
});

describe("siteAnalyticsScriptTag", () => {
  it("is HTML a browser parses back into the same beacon", () => {
    document.body.innerHTML = siteAnalyticsScriptTag();
    const script = document.querySelector("script")!;
    expect(script.getAttribute("src")).toBe(SITE_ANALYTICS_SCRIPT_SRC);
    expect(script.defer).toBe(true);
    expect(script.getAttribute("data-cf-beacon")).toBe(siteAnalyticsScript().attributes["data-cf-beacon"]);
  });
});

describe("loadSiteAnalytics", () => {
  it("adds the beacon to the head", () => {
    loadSiteAnalytics();
    expect(beacons()).toHaveLength(1);
    const script = beacons()[0] as HTMLScriptElement;
    expect(script.parentElement).toBe(document.head);
    expect(script.defer).toBe(true);
    expect(script.getAttribute("data-cf-beacon")).toBe(siteAnalyticsScript().attributes["data-cf-beacon"]);
  });

  it("adds it only once however often it's called", () => {
    loadSiteAnalytics();
    loadSiteAnalytics();
    expect(beacons()).toHaveLength(1);
  });

  it("does nothing when the page already has the tag from siteAnalyticsScriptTag", () => {
    document.body.innerHTML = siteAnalyticsScriptTag();
    loadSiteAnalytics();
    expect(beacons()).toHaveLength(1);
  });

  it("does nothing without a document (on the server)", () => {
    expect(() => loadSiteAnalytics(undefined)).not.toThrow();
  });
});
