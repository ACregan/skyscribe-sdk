import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LikeButton } from "./LikeButton.js";

const DOC_URI = "at://did:plc:abc/site.standard.document/test-post";
const PUB_URI = "at://did:plc:abc/site.standard.publication/test-pub";
const SERVICE_URL = "https://social.skyscribe.app";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("open", vi.fn().mockReturnValue(null));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LikeButton", () => {
  it("renders 'Like' when document has not been liked", () => {
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" />);
    const btn = screen.getByRole("button", { name: "Like this article" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Like")).toBeInTheDocument();
  });

  it("renders 'Liked ✓' and is pressed when localStorage indicates already liked", () => {
    localStorage.setItem(`scribe:recommended:${DOC_URI}`, "1");
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" />);
    const btn = screen.getByRole("button", { name: "Like this article" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).not.toBeDisabled();
    expect(screen.getByText("Liked ✓")).toBeInTheDocument();
  });

  it("renders in pressed state immediately when defaultLiked is true", () => {
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" defaultLiked={true} />);
    const btn = screen.getByRole("button", { name: "Like this article" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).not.toBeDisabled();
  });

  it("opens the popup on click", () => {
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("/recommend?"),
      "scribe-social",
      expect.any(String)
    );
  });

  it("popup URL includes document, publication, origin, and title params", () => {
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="My Article" serviceUrl={SERVICE_URL} />);
    fireEvent.click(screen.getByRole("button"));
    const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    const params = new URL(url).searchParams;
    expect(params.get("document")).toBe(DOC_URI);
    expect(params.get("publication")).toBe(PUB_URI);
    expect(params.get("title")).toBe("My Article");
    expect(params.get("origin")).toBe(window.location.origin);
  });

  it("does not open a popup when already liked", () => {
    localStorage.setItem(`scribe:recommended:${DOC_URI}`, "1");
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" />);
    fireEvent.click(screen.getByRole("button"));
    expect(window.open).not.toHaveBeenCalled();
  });

  it("sets liked state and updates localStorage on valid postMessage", async () => {
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "recommend" },
        })
      );
    });

    const btn = screen.getByRole("button", { name: "Like this article" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).not.toBeDisabled();
    expect(localStorage.getItem(`scribe:recommended:${DOC_URI}`)).toBe("1");
  });

  it("calls onSuccess after a valid postMessage", async () => {
    const onSuccess = vi.fn();
    render(
      <LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} onSuccess={onSuccess} />
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "recommend" },
        })
      );
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("does not call onSuccess for ignored postMessages", async () => {
    const onSuccess = vi.fn();
    render(
      <LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} onSuccess={onSuccess} />
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example.com",
          data: { ok: true, action: "recommend" },
        })
      );
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("ignores postMessages from a different origin", async () => {
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://evil.example.com",
          data: { ok: true, action: "recommend" },
        })
      );
    });

    expect(screen.getByRole("button", { name: "Like this article" })).toHaveAttribute("aria-pressed", "false");
  });

  it("ignores postMessages with wrong action", async () => {
    render(<LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL} />);

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "subscribe" },
        })
      );
    });

    expect(screen.getByRole("button", { name: "Like this article" })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders static children instead of default label", () => {
    render(
      <LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post">
        ♥ Recommend
      </LikeButton>
    );
    expect(screen.getByText("♥ Recommend")).toBeInTheDocument();
    expect(screen.queryByText("Like")).not.toBeInTheDocument();
  });

  it("passes isLiked state to render-prop children", async () => {
    render(
      <LikeButton documentUri={DOC_URI} publicationUri={PUB_URI} title="Test Post" serviceUrl={SERVICE_URL}>
        {(isLiked) => (isLiked ? "LOVED IT" : "DO YOU LIKE THIS?")}
      </LikeButton>
    );

    expect(screen.getByText("DO YOU LIKE THIS?")).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: SERVICE_URL,
          data: { ok: true, action: "recommend" },
        })
      );
    });

    expect(screen.getByText("LOVED IT")).toBeInTheDocument();
  });
});
