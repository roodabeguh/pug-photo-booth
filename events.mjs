// GET /api/events — lists every event folder with its photo count (one per photo).
// Header: x-booth-key: <BOOTH_KEY>

import { getStore } from "@netlify/blobs";

const BASE_ID = /^\d{13}-[0-9a-f]{8}\.jpg$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  if (!process.env.BOOTH_KEY || req.headers.get("x-booth-key") !== process.env.BOOTH_KEY) {
    return json(401, { ok: false, error: "Wrong booth key." });
  }

  const store = getStore("booth-photos");
  const { directories = [] } = await store.list({ directories: true });

  const events = [];
  for (const dir of directories) {
    const name = String(dir).replace(/\/$/, "");
    const { blobs } = await store.list({ prefix: `${name}/` });
    const ids = blobs.map((b) => b.key.split("/").pop()).filter((id) => BASE_ID.test(id)).sort();
    events.push({
      event: name,
      photos: ids.length,
      lastPhotoMs: ids.length ? Number(ids[ids.length - 1].slice(0, 13)) : 0,
    });
  }

  events.sort((a, b) => b.lastPhotoMs - a.lastPhotoMs);
  return json(200, { ok: true, events });
};

export const config = { path: "/api/events" };
