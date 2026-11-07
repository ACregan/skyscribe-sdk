import { PdsFetchError } from "./errors.js";
import { pdsFetch } from "./http.js";

export interface ProfileAssociated {
  lists?: number;
  feedgens?: number;
  starterPacks?: number;
  labeler?: boolean;
}

export interface ProfileVerification {
  verifiedStatus: string;
  trustedVerifierStatus: string;
  verifications: Array<{
    issuer: string;
    uri: string;
    isValid: boolean;
    createdAt: string;
  }>;
}

export interface ProfileStatus {
  status: string;
  expiresAt?: string;
  isActive?: boolean;
  isDisabled?: boolean;
}

// Mirrors app.bsky.actor.defs#profileViewDetailed (the shape
// app.bsky.actor.getProfile returns), minus fields with no meaningful value
// here: `viewer` (relationship to the *requesting* account — always empty,
// since this calls the public unauthenticated AppView with no logged-in
// viewer), `indexedAt` (cache-freshness bookkeeping, not display data), and
// `labels`/`$type`/`debug` (moderation/internal plumbing).
export interface Profile {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  pronouns?: string;
  website?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  createdAt?: string;
  associated?: ProfileAssociated;
  pinnedPost?: { uri: string; cid: string };
  verification?: ProfileVerification;
  status?: ProfileStatus;
}

interface RawProfile {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  pronouns?: string;
  website?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  createdAt?: string;
  associated?: ProfileAssociated;
  pinnedPost?: { uri: string; cid: string };
  verification?: ProfileVerification;
  status?: ProfileStatus;
}

// `actor` accepts a handle or a DID interchangeably — Bluesky's AppView
// resolves either, so (unlike fetchPublication/fetchDocument) there's no need to
// call resolveIdentifier first.
export async function fetchProfile(
  handleOrDid: string,
  signal?: AbortSignal
): Promise<Profile> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handleOrDid)}`;
  const res = await pdsFetch(url, { signal });
  if (!res.ok) throw new PdsFetchError(`Failed to fetch profile for "${handleOrDid}": ${res.statusText}`);
  const raw = (await res.json()) as RawProfile;
  return {
    did: raw.did,
    handle: raw.handle,
    displayName: raw.displayName,
    description: raw.description,
    avatar: raw.avatar,
    banner: raw.banner,
    pronouns: raw.pronouns,
    website: raw.website,
    followersCount: raw.followersCount,
    followsCount: raw.followsCount,
    postsCount: raw.postsCount,
    createdAt: raw.createdAt,
    associated: raw.associated,
    pinnedPost: raw.pinnedPost,
    verification: raw.verification,
    status: raw.status,
  };
}
