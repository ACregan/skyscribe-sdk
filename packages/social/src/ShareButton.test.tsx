import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ShareButton } from "./ShareButton.js";

const DOC_URI = "at://did:plc:abc/site.standard.document/test-post";
const PUB_URI = "at://did:plc:abc/site.standard.publication/test-pub";
const SERVICE_URL = "https://social.skyscribe.app";

beforeEach(() => {
  vi.stubGlobal("open", vi.fn().mockReturnValue(null));
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("ShareButton", () => {
  it("renders 'Share' when not yet shared", () => {
    render(<ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" />);
    expect(screen.getByRole("button", { name: "Share this article" })).toBeInTheDocument();
    expect(screen.getByText("Share")).toBeInTheDocument();
  });

  it("opens the popup on click", () => {
    render(<ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/share?"),
      "scribe-social",
      expect.any(String)
    );
  });

  it("popup URL includes document, publication, origin, and title params", () => {
    render(<ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="My Article" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    const params = new URL(url).searchParams;
    expect(params.get("document")).toBe(DOC_URI);
    expect(params.get("publication")).toBe(PUB_URI);
    expect(params.get("title")).toBe("My Article");
    expect(params.get("origin")).toBe(window.location.origin);
  });

  it("sets shared state on valid postMessage and resets after timeout", async () => {
    render(<ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "share" },
        })
      );
    });

    expect(screen.getByRole("button", { name: "Shared" })).toBeDisabled();
    expect(screen.getByText("Shared ✓")).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(3000); });

    expect(screen.getByRole("button", { name: "Share this article" })).not.toBeDisabled();
  });

  it("calls onSuccess after a valid postMessage", async () => {
    const onSuccess = vi.fn();
    render(
      <ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} onSuccess={onSuccess} />
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "share" },
        })
      );
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("does not call onSuccess for ignored postMessages", async () => {
    const onSuccess = vi.fn();
    render(
      <ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} onSuccess={onSuccess} />
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example.com",
          data: { ok: true, action: "share" },
        })
      );
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("ignores postMessages from a different origin", async () => {
    render(<ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example.com",
          data: { ok: true, action: "share" },
        })
      );
    });

    expect(screen.getByRole("button", { name: "Share this article" })).not.toBeDisabled();
  });

  it("renders static children instead of default label", () => {
    render(
      <ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post">
        Share on Bluesky
      </ShareButton>
    );
    expect(screen.getByText("Share on Bluesky")).toBeInTheDocument();
    expect(screen.queryByText("Share")).not.toBeInTheDocument();
  });

  it("passes isShared state to render-prop children", async () => {
    render(
      <ShareButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL}>
        {(isShared) => (isShared ? "Thanks for sharing!" : "Share this")}
      </ShareButton>
    );

    expect(screen.getByText("Share this")).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "share" },
        })
      );
    });

    expect(screen.getByText("Thanks for sharing!")).toBeInTheDocument();
  });
});
