// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { SITE_ANALYTICS_SCRIPT_SRC } from "@skyscribe-sdk/core";
import { SiteAnalytics } from "./SiteAnalytics.js";

const beacons = () => document.querySelectorAll(`script[src="${SITE_ANALYTICS_SCRIPT_SRC}"]`);

beforeEach(() => {
  document.head.innerHTML = "";
});

describe("SiteAnalytics", () => {
  it("adds the beacon to the page when mounted", () => {
    mount(SiteAnalytics);
    expect(beacons()).toHaveLength(1);
  });

  it("adds the beacon once even when mounted twice", () => {
    mount(SiteAnalytics);
    mount(SiteAnalytics);
    expect(beacons()).toHaveLength(1);
  });

  it("adds nothing when disabled", () => {
    mount(SiteAnalytics, { props: { disabled: true } });
    expect(beacons()).toHaveLength(0);
  });
});
