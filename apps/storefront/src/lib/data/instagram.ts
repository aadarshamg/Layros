import "server-only";
import { createClient } from "next-sanity";
import { sha256Hex } from "@/lib/auth/crypto";

export interface InstagramPost {
  id: string;
  image: string;
  caption?: string;
  permalink: string;
  isVideo: boolean;
}

interface RawMedia {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
}

interface StoredToken {
  token?: string;
  refreshedAt?: string;
  seededFrom?: string;
}

const GRAPH = "https://graph.instagram.com";
// Dotted id = outside the root path, so it never shows in Studio lists and is
// only readable with a token (the dataset itself is private too).
const TOKEN_DOC_ID = "secrets.instagram";
const REFRESH_EVERY_MS = 7 * 24 * 60 * 60 * 1000;

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const sanityToken = process.env.SANITY_API_TOKEN;
const secretsClient =
  projectId && sanityToken ? createClient({ projectId, dataset, apiVersion: "2025-01-01", token: sanityToken, useCdn: false }) : null;

/**
 * Instagram long-lived tokens expire after 60 days unless refreshed. The token
 * pasted into INSTAGRAM_ACCESS_TOKEN seeds a Sanity copy, which is renewed
 * weekly here — so nobody has to re-paste it. Pasting a new env token
 * (e.g. after reconnecting the account) replaces the stored one.
 */
async function getAccessToken(): Promise<string | null> {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!secretsClient) return envToken || null;

  const stored = await secretsClient.fetch<StoredToken | null>(`*[_id == $id][0]{token, refreshedAt, seededFrom}`, { id: TOKEN_DOC_ID });
  const envHash = envToken ? sha256Hex(envToken) : undefined;

  if (envToken && (!stored?.token || stored.seededFrom !== envHash)) {
    // Age of a freshly pasted token is unknown; date it in the past so it gets renewed on the next visit after a day.
    await secretsClient.createOrReplace({ _id: TOKEN_DOC_ID, _type: "secret", token: envToken, seededFrom: envHash, refreshedAt: new Date(Date.now() - REFRESH_EVERY_MS + 24 * 60 * 60 * 1000).toISOString() });
    return envToken;
  }
  if (!stored?.token) return null;

  const age = Date.now() - new Date(stored.refreshedAt ?? 0).getTime();
  if (age > REFRESH_EVERY_MS) {
    try {
      const response = await fetch(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(stored.token)}`, { cache: "no-store" });
      const body = (await response.json()) as { access_token?: string };
      if (response.ok && body.access_token) {
        await secretsClient.patch(TOKEN_DOC_ID).set({ token: body.access_token, refreshedAt: new Date().toISOString() }).commit();
        return body.access_token;
      }
      console.error("Instagram token refresh failed:", response.status);
    } catch (error) {
      console.error("Instagram token refresh failed:", error);
    }
  }
  return stored.token;
}

/** Latest posts from the connected Instagram professional account; [] when not connected or on any API error. */
export async function getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];
    const url = `${GRAPH}/v21.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=${limit * 2}&access_token=${encodeURIComponent(token)}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      console.error("Instagram feed request failed:", response.status);
      return [];
    }
    const body = (await response.json()) as { data?: RawMedia[] };
    return (body.data ?? [])
      .map((media) => ({
        id: media.id,
        image: (media.media_type === "VIDEO" ? media.thumbnail_url : media.media_url) ?? "",
        caption: media.caption?.trim() || undefined,
        permalink: media.permalink ?? "https://www.instagram.com/leyrosperfume/",
        isVideo: media.media_type === "VIDEO",
      }))
      .filter((post) => post.image)
      .slice(0, limit);
  } catch (error) {
    console.error("getInstagramPosts failed:", error);
    return [];
  }
}
