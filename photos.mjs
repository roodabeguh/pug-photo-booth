// GET /api/photos?event=<event> — lists each photo's id, newest first (one per photo).

import { getStore } from "@netlify/blobs";

const EVENT_PATTERN = /^[a-z0-9-]{3,60}$/;
const BASE_ID = /^\d{13}-[0-9a-f]{8}\.jpg$/;

export default async (req) => {
  const event = new URL(req.url).searchParams.get("event") || "";
  if (!EVENT_PATTERN.test(event)) {
    return Response.json({ ok: false, error: "Unknown event." }, { status: 400 });
  }

  const { blobs } = await getStore("booth-photos").list({ prefix: `${event}/` });
  const photos = blobs
    .map((b) => b.key.slice(event.length + 1))
    .filter((id) => BASE_ID.test(id))
    .sort()
    .reverse();

  return Response.json({ ok: true, photos }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/photos" };
