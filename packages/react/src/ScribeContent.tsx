import { useEffect, useMemo, type HTMLAttributes } from "react";
import { listenForEmbedResize, renderEmbeds, type EmbedWindow } from "@skyscribe-sdk/core";

type ScribeContentProps = Omit<HTMLAttributes<HTMLDivElement>, "dangerouslySetInnerHTML"> & {
  html: string;
  /** Show Embeds (videos, music, Bluesky posts, link cards) as players.
   * Default true; false leaves them as the links they're stored as. */
  embeds?: boolean;
};

export function ScribeContent({ html, className, embeds = true, ...props }: ScribeContentProps) {
  const rendered = useMemo(() => (embeds ? renderEmbeds(html) : html), [html, embeds]);
  const hasBluesky = embeds && rendered.includes("data-bluesky-id");

  // Bluesky's player reports its height; without this it stays 400px.
  useEffect(() => {
    if (!hasBluesky) return;
    // Effects only run in the browser, where globalThis is the window.
    return listenForEmbedResize(globalThis as unknown as EmbedWindow);
  }, [hasBluesky]);

  return (
    <div
      {...props}
      className={className ? `scribe-content ${className}` : "scribe-content"}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
