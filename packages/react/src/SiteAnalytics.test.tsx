// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { SITE_ANALYTICS_SCRIPT_SRC } from "@skyscribe-sdk/core";
import { SiteAnalytics } from "./SiteAnalytics.js";

const beacons = () => document.querySelectorAll(`script[src="${SITE_ANALYTICS_SCRIPT_SRC}"]`);

beforeEach(() => {
  document.head.innerHTML = "";
});

describe("SiteAnalytics", () => {
  it("adds the beacon to the page and renders nothing", () => {
    const { container } = render(<SiteAnalytics />);
    expect(container.innerHTML).toBe("");
    expect(beacons()).toHaveLength(1);
  });

  it("adds the beacon once even when rendered twice", () => {
    render(
      <>
        <SiteAnalytics />
        <SiteAnalytics />
      </>,
    );
    expect(beacons()).toHaveLength(1);
  });

  it("adds nothing when disabled", () => {
    render(<SiteAnalytics disabled />);
    expect(beacons()).toHaveLength(0);
  });
});
