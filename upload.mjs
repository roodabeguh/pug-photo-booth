// POST /api/upload
// Header: x-booth-key: <BOOTH_KEY>
// Body:   { event: "smith-wedding-x7k2", image: "<base64 JPEG, no data: prefix>" }
// Saves the photo and returns the link the guest's QR code points to.

import { getStore } from "@netlify/blobs";

const EVENT_PATTERN = /^[a-z0-9-]{3,60}$/;
const MAX_BYTES = 4 * 1024 * 1024;

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
  if (typeof payload.image !== "string" || payload.image.length < 100) {
    return json(400, { ok: false, error: "No photo was attached." });
  }

  const bytes = Buffer.from(payload.image, "base64");
  if (bytes.length > MAX_BYTES) {
    return json(413, { ok: false, error: "Photo is over 4 MB." });
  }

  // Timestamp first so the gallery can sort newest-first by name.
  const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
  await getStore("booth-photos").set(`${event}/${id}`, new Blob([bytes], { type: "image/jpeg" }));

  const origin = process.env.URL || new URL(req.url).origin;
  return json(200, {
    ok: true,
    id,
    viewUrl: `${origin}/gallery.html?event=${event}&photo=${id}`,
    galleryUrl: `${origin}/gallery.html?event=${event}`,
  });
};

export const config = { path: "/api/upload" };
