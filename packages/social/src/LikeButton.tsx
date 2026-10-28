import { useState, useEffect, type ReactNode } from "react";
import { isRecommended, markRecommended } from "./storage.js";
import { useSocialAction } from "./useSocialAction.js";
import { DEFAULT_SERVICE_URL } from "./config.js";

export interface LikeButtonProps {
  documentUri: string;
  publicationUri: string;
  title: string;
  serviceUrl?: string;
  className?: string;
  children?: ReactNode | ((isLiked: boolean) => ReactNode);
  onSuccess?: () => void;
  defaultLiked?: boolean;
}

export function LikeButton({
  documentUri,
  publicationUri,
  title,
  serviceUrl = DEFAULT_SERVICE_URL,
  className,
  children,
  onSuccess,
  defaultLiked,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(defaultLiked ?? false);

  useEffect(() => {
    if (defaultLiked === undefined) setLiked(isRecommended(documentUri));
  }, [documentUri, defaultLiked]);

  const { handleClick } = useSocialAction({
    isActive: liked,
    action: "recommend",
    endpoint: "/recommend",
    serviceUrl,
    onActivated: () => {
      markRecommended(documentUri);
      setLiked(true);
      onSuccess?.();
    },
    buildParams: (token) =>
      new URLSearchParams({
        document: documentUri,
        publication: publicationUri,
        origin: window.location.origin,
        title,
        token,
      }),
  });

  const label =
    typeof children === "function"
      ? children(liked)
      : (children ?? (liked ? "Liked ✓" : "Like"));

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label="Like this article"
      className={`scribe-atp-like-button${className ? ` ${className}` : ""}`}
    >
      {label}
    </button>
  );
}
