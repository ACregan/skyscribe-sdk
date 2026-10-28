import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SubscribeButton } from "./SubscribeButton.js";

const PUB_URI = "at://did:plc:abc/site.standard.publication/test-pub";
const SERVICE_URL = "https://social.skyscribe.app";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("open", vi.fn().mockReturnValue(null));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SubscribeButton", () => {
  it("renders 'Follow' when not yet following", () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" />);
    const btn = screen.getByRole("button", { name: "Follow" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Follow")).toBeInTheDocument();
  });

  it("renders 'Following ✓' and is pressed when localStorage indicates already subscribed", () => {
    localStorage.setItem(`scribe:subscribed:${PUB_URI}`, "1");
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" />);
    const btn = screen.getByRole("button", { name: "Unfollow" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).not.toBeDisabled();
    expect(screen.getByText("Following ✓")).toBeInTheDocument();
  });

  it("renders in pressed state immediately when defaultSubscribed is true", () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" defaultSubscribed={true} />);
    const btn = screen.getByRole("button", { name: "Unfollow" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).not.toBeDisabled();
  });

  it("opens the popup on click", () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/follow?"),
      "scribe-social",
      expect.any(String),
    );
  });

  it("calls the SkyScribe Social service by default", () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" />);
    fireEvent.click(screen.getByRole("button"));
    const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url.startsWith("https://social.skyscribe.app/follow?")).toBe(true);
  });

  it("popup URL includes publication, origin, and title params", () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    const params = new URL(url).searchParams;
    expect(params.get("publication")).toBe(PUB_URI);
    expect(params.get("title")).toBe("My Site");
    expect(params.get("origin")).toBe(window.location.origin);
  });

  it("opens the unsubscribe popup when already subscribed", () => {
    localStorage.setItem(`scribe:subscribed:${PUB_URI}`, "1");
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/unfollow?"),
      "scribe-social",
      expect.any(String),
    );
  });

  it("sets subscribed state and updates localStorage on valid postMessage", async () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "subscribe" },
        }),
      );
    });

    const btn = screen.getByRole("button", { name: "Unfollow" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).not.toBeDisabled();
    expect(localStorage.getItem(`scribe:subscribed:${PUB_URI}`)).toBe("1");
  });

  it("calls onSuccess after a valid postMessage", async () => {
    const onSuccess = vi.fn();
    render(
      <SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL} onSuccess={onSuccess} />
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "subscribe" },
        }),
      );
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("does not call onSuccess for ignored postMessages", async () => {
    const onSuccess = vi.fn();
    render(
      <SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL} onSuccess={onSuccess} />
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example.com",
          data: { ok: true, action: "subscribe" },
        }),
      );
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("ignores postMessages from a different origin", async () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example.com",
          data: { ok: true, action: "subscribe" },
        }),
      );
    });

    expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute("aria-pressed", "false");
  });

  it("ignores postMessages with wrong action", async () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "like" },
        }),
      );
    });

    expect(screen.getByRole("button", { name: "Follow" })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders static children instead of default label", () => {
    render(
      <SubscribeButton publicationUri={PUB_URI} title="My Site">
        Follow this site
      </SubscribeButton>,
    );
    expect(screen.getByText("Follow this site")).toBeInTheDocument();
    expect(screen.queryByText("Follow")).not.toBeInTheDocument();
  });

  it("passes isSubscribed state to render-prop children", async () => {
    render(
      <SubscribeButton publicationUri={PUB_URI} title="My Site" serviceUrl={SERVICE_URL}>
        {(isSubscribed) => (isSubscribed ? "Following ✓" : "Follow this site")}
      </SubscribeButton>,
    );

    expect(screen.getByText("Follow this site")).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "subscribe" },
        }),
      );
    });

    expect(screen.getByText("Following ✓")).toBeInTheDocument();
  });

  it("applies className alongside the base class", () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" className="my-btn" />);
    expect(screen.getByRole("button").className).toBe("scribe-atp-subscribe-button my-btn");
  });

  it("omits extra class when className is not provided", () => {
    render(<SubscribeButton publicationUri={PUB_URI} title="My Site" />);
    expect(screen.getByRole("button").className).toBe("scribe-atp-subscribe-button");
  });
});
