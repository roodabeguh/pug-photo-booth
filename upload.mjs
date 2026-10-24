// POST /api/upload
// Header: x-booth-key: <BOOTH_KEY>
// Body:   { event: "...", images: { original: "<base64 JPEG>", post: "<base64>", story: "<base64>" } }
// Saves all three versions of one photo and returns the link the guest's QR code points to.

import { getStore } from "@netlify/blobs";

const EVENT_PATTERN = /^[a-z0-9-]{3,60}$/;
const MAX_BYTES = 4 * 1024 * 1024;
const VERSIONS = ["original", "post", "story"];

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "Use POST." });

  if (!process.env.BOOTH_KEY || req.headers.get("x-booth-key") !== process.env.BOOTH_KEY) {
    return json(401, { ok: false, error: "Booth key is missing or wrong. Open Settings on the iPad." });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { ok: false, error: "Request wasn't valid JSON." });
  }

  const event = String(payload.event || "");
  if (!EVENT_PATTERN.test(event)) {
    return json(400, { ok: false, error: "Event name must be 3–60 lowercase letters, numbers or dashes." });
  }

  const images = payload.images || {};
  const bytes = {};
  for (const v of VERSIONS) {
    const b64 = images[v];
    if (typeof b64 !== "string" || b64.length < 100) {
      return json(400, { ok: false, error: "No photo was attached." });
    }
    bytes[v] = Buffer.from(b64, "base64");
    if (bytes[v].length > MAX_BYTES) return json(413, { ok: false, error: "Photo is over 4 MB." });
  }

  // One shared id for all three versions of the photo.
  const base = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const store = getStore("booth-photos");
  const names = { original: `${base}.jpg`, post: `${base}-post.jpg`, story: `${base}-story.jpg` };
  await Promise.all(
    VERSIONS.map((v) => store.set(`${event}/${names[v]}`, new Blob([bytes[v]], { type: "image/jpeg" })))
  );

  const origin = process.env.URL || new URL(req.url).origin;
  return json(200, {
    ok: true,
    id: names.original,
    viewUrl: `${origin}/gallery.html?event=${event}&photo=${names.original}`,
    galleryUrl: `${origin}/gallery.html?event=${event}`,
  });
};

export const config = { path: "/api/upload" };
