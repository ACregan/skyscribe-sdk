import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSocialAction } from "./useSocialAction.js";

const SERVICE_URL = "https://social.skyscribe.app";

function makeConfig(overrides: Partial<Parameters<typeof useSocialAction>[0]> = {}) {
  return {
    isActive: false,
    action: "recommend",
    endpoint: "/recommend",
    serviceUrl: SERVICE_URL,
    onActivated: vi.fn(),
    buildParams: vi.fn((token: string) =>
      new URLSearchParams({ doc: "at://did/col/rkey", token }),
    ),
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("open", vi.fn().mockReturnValue(null));
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useSocialAction", () => {
  describe("handleClick", () => {
    it("opens a popup at the configured endpoint", () => {
      const { result } = renderHook(() => useSocialAction(makeConfig()));
      act(() => result.current.handleClick());
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining("/recommend?"),
        "scribe-social",
        expect.any(String),
      );
    });

    it("passes buildParams output into the popup URL", () => {
      const buildParams = vi.fn((token: string) =>
        new URLSearchParams({ custom: "value", token }),
      );
      const { result } = renderHook(() =>
        useSocialAction(makeConfig({ buildParams })),
      );
      act(() => result.current.handleClick());
      const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
      const params = new URL(url).searchParams;
      expect(params.get("custom")).toBe("value");
    });

    it("does not open a popup when isActive is true", () => {
      const { result } = renderHook(() =>
        useSocialAction(makeConfig({ isActive: true })),
      );
      act(() => result.current.handleClick());
      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe("postMessage success", () => {
    it("calls onActivated on a matching message from the service origin", async () => {
      const onActivated = vi.fn();
      renderHook(() => useSocialAction(makeConfig({ onActivated })));

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: SERVICE_URL,
            data: { ok: true, action: "recommend" },
          }),
        );
      });

      expect(onActivated).toHaveBeenCalledOnce();
    });

    it("ignores messages from a different origin", async () => {
      const onActivated = vi.fn();
      renderHook(() => useSocialAction(makeConfig({ onActivated })));

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: "https://evil.example.com",
            data: { ok: true, action: "recommend" },
          }),
        );
      });

      expect(onActivated).not.toHaveBeenCalled();
    });

    it("ignores messages with a different action", async () => {
      const onActivated = vi.fn();
      renderHook(() => useSocialAction(makeConfig({ onActivated })));

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: SERVICE_URL,
            data: { ok: true, action: "subscribe" },
          }),
        );
      });

      expect(onActivated).not.toHaveBeenCalled();
    });

    it("ignores messages where ok is false", async () => {
      const onActivated = vi.fn();
      renderHook(() => useSocialAction(makeConfig({ onActivated })));

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: SERVICE_URL,
            data: { ok: false, action: "recommend" },
          }),
        );
      });

      expect(onActivated).not.toHaveBeenCalled();
    });
  });

  describe("polling fallback", () => {
    it("starts polling after the popup closes", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, action: "recommend" }),
      } as Response);

      const mockPopup = { closed: false } as unknown as Window;
      vi.mocked(window.open).mockReturnValue(mockPopup);
      const onActivated = vi.fn();

      const { result } = renderHook(() =>
        useSocialAction(makeConfig({ onActivated })),
      );

      act(() => result.current.handleClick());
      expect(window.open).toHaveBeenCalled();

      // Popup closes — triggers polling start after 500ms
      (mockPopup as unknown as { closed: boolean }).closed = true;
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // First poll fires after POLL_INTERVAL_MS
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/status/"),
      );
      expect(onActivated).toHaveBeenCalledOnce();
    });

    it("stops polling after POLL_MAX_ATTEMPTS with no success", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: false }),
      } as Response);

      const mockPopup = { closed: false } as unknown as Window;
      vi.mocked(window.open).mockReturnValue(mockPopup);

      const { result } = renderHook(() => useSocialAction(makeConfig()));
      act(() => result.current.handleClick());
      (mockPopup as unknown as { closed: boolean }).closed = true;

      await act(async () => {
        vi.advanceTimersByTime(600);
        vi.advanceTimersByTime(1500 * 21); // 20 attempts + 1 to trigger stop
      });

      // Only 20 fetch calls, not unlimited
      expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(21);
    });
  });

  describe("resetAfterMs", () => {
    it("calls setInactive after resetAfterMs on success", async () => {
      const setInactive = vi.fn();
      renderHook(() =>
        useSocialAction(
          makeConfig({ resetAfterMs: 3000, setInactive }),
        ),
      );

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: SERVICE_URL,
            data: { ok: true, action: "recommend" },
          }),
        );
      });

      expect(setInactive).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(3000));
      expect(setInactive).toHaveBeenCalledOnce();
    });

    it("does not call setInactive if resetAfterMs is not set", async () => {
      const setInactive = vi.fn();
      renderHook(() =>
        useSocialAction(makeConfig({ setInactive })),
      );

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: SERVICE_URL,
            data: { ok: true, action: "recommend" },
          }),
        );
      });

      act(() => vi.advanceTimersByTime(10000));
      expect(setInactive).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("removes the message listener on unmount", async () => {
      const onActivated = vi.fn();
      const { unmount } = renderHook(() =>
        useSocialAction(makeConfig({ onActivated })),
      );

      unmount();

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: SERVICE_URL,
            data: { ok: true, action: "recommend" },
          }),
        );
      });

      expect(onActivated).not.toHaveBeenCalled();
    });

    it("cancels the reset timer on unmount", async () => {
      const setInactive = vi.fn();
      const { unmount } = renderHook(() =>
        useSocialAction(makeConfig({ resetAfterMs: 3000, setInactive })),
      );

      await act(async () => {
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: SERVICE_URL,
            data: { ok: true, action: "recommend" },
          }),
        );
      });

      unmount();
      act(() => vi.advanceTimersByTime(5000));
      expect(setInactive).not.toHaveBeenCalled();
    });
  });
});
