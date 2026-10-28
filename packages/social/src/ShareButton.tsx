import { useState, type ReactNode } from "react";
import { useSocialAction } from "./useSocialAction.js";
import { DEFAULT_SERVICE_URL } from "./config.js";

const SUCCESS_RESET_MS = 3000;

export interface ShareButtonProps {
  documentUri: string;
  publicationUri: string;
  title: string;
  canonicalUrl?: string;
  serviceUrl?: string;
  className?: string;
  children?: ReactNode | ((isShared: boolean) => ReactNode);
  onSuccess?: () => void;
  /** Let the reader write the post before sharing (the default). `false`
   * posts the title and link straight after sign-in. */
  confirm?: boolean;
}

export function ShareButton({
  documentUri,
  publicationUri,
  title,
  canonicalUrl,
  serviceUrl = DEFAULT_SERVICE_URL,
  className,
  children,
  onSuccess,
  confirm = true,
}: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  const { handleClick } = useSocialAction({
    isActive: shared,
    action: "share",
    endpoint: "/share",
    serviceUrl,
    onActivated: () => {
      setShared(true);
      onSuccess?.();
    },
    resetAfterMs: SUCCESS_RESET_MS,
    setInactive: () => setShared(false),
    buildParams: (token) =>
      new URLSearchParams({
        document: documentUri,
        publication: publicationUri,
        canonicalUrl: canonicalUrl ?? window.location.href,
        origin: window.location.origin,
        title,
        token,
        ...(confirm ? {} : { quick: "1" }),
      }),
  });

  const label =
    typeof children === "function"
      ? children(shared)
      : (children ?? (shared ? "Shared ✓" : "Share"));

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={shared}
      aria-label={shared ? "Shared" : "Share this article"}
      className={`scribe-atp-share-button${className ? ` ${className}` : ""}`}
    >
      {label}
    </button>
  );
}
