import { useState, useEffect, type ReactNode } from "react";
import { isSubscribed, markSubscribed, clearSubscribed } from "./storage.js";
import { useSocialAction } from "./useSocialAction.js";
import { DEFAULT_SERVICE_URL } from "./config.js";

export interface SubscribeButtonProps {
  publicationUri: string;
  title: string;
  serviceUrl?: string;
  className?: string;
  children?: ReactNode | ((isSubscribed: boolean) => ReactNode);
  onSuccess?: () => void;
  onUnsubscribe?: () => void;
  defaultSubscribed?: boolean;
}

export function SubscribeButton({
  publicationUri,
  title,
  serviceUrl = DEFAULT_SERVICE_URL,
  className,
  children,
  onSuccess,
  onUnsubscribe,
  defaultSubscribed,
}: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(defaultSubscribed ?? false);

  useEffect(() => {
    if (defaultSubscribed === undefined) setSubscribed(isSubscribed(publicationUri));
  }, [publicationUri, defaultSubscribed]);

  const { handleClick: handleSubscribeClick } = useSocialAction({
    isActive: subscribed,
    action: "subscribe",
    endpoint: "/follow",
    serviceUrl,
    onActivated: () => {
      markSubscribed(publicationUri);
      setSubscribed(true);
      onSuccess?.();
    },
    buildParams: (token) =>
      new URLSearchParams({
        publication: publicationUri,
        origin: window.location.origin,
        title,
        token,
      }),
  });

  const { handleClick: handleUnsubscribeClick } = useSocialAction({
    isActive: !subscribed,
    action: "unsubscribe",
    endpoint: "/unfollow",
    serviceUrl,
    onActivated: () => {
      clearSubscribed(publicationUri);
      setSubscribed(false);
      onUnsubscribe?.();
    },
    buildParams: (token) =>
      new URLSearchParams({
        publication: publicationUri,
        origin: window.location.origin,
        title,
        token,
      }),
  });

  const label =
    typeof children === "function"
      ? children(subscribed)
      : (children ?? (subscribed ? "Following ✓" : "Follow"));

  return (
    <button
      type="button"
      onClick={subscribed ? handleUnsubscribeClick : handleSubscribeClick}
      aria-pressed={subscribed}
      aria-label={subscribed ? "Unfollow" : "Follow"}
      className={`scribe-atp-subscribe-button${className ? ` ${className}` : ""}`}
    >
      {label}
    </button>
  );
}
