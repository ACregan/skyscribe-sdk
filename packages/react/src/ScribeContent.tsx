import { useEffect, useMemo, type HTMLAttributes } from "react";
import { enhanceEmbeds, renderEmbeds, type EmbedClickWindow, type EmbedWindow } from "@skyscribe-sdk/core";

type ScribeContentProps = Omit<HTMLAttributes<HTMLDivElement>, "dangerouslySetInnerHTML"> & {
  html: string;
  /** Show Embeds (videos, music, Bluesky posts, link cards) as players.
   * Default true; false leaves them as the links they're stored as. */
  embeds?: boolean;
  /** Show video and music Embeds as Posters that load their player when
   * clicked (ADR 0080). Default true; false loads every player with the
   * page. */
  clickToLoad?: boolean;
};

export function ScribeContent({ html, className, embeds = true, clickToLoad = true, ...props }: ScribeContentProps) {
  const rendered = useMemo(
    () => (embeds ? renderEmbeds(html, { clickToLoad }) : html),
    [html, embeds, clickToLoad],
  );
  const needsScript =
    embeds && (rendered.includes("data-bluesky-id") || rendered.includes("scribe-embed-poster"));

  // Posters load their player on click; Bluesky's player reports its
  // height (without this it stays 400px).
  useEffect(() => {
    if (!needsScript) return;
    // Effects only run in the browser, where globalThis is the window.
    return enhanceEmbeds(globalThis as unknown as EmbedWindow & EmbedClickWindow);
  }, [needsScript]);

  return (
    <div
      {...props}
      className={className ? `scribe-content ${className}` : "scribe-content"}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
