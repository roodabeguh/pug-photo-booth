// GET /photo/<event>/<id>.jpg — serves one saved photo.
// <id>.jpg is the original, <id>-post.jpg is 4:5, <id>-story.jpg is 9:16.

import { getStore } from "@netlify/blobs";

const EVENT_PATTERN = /^[a-z0-9-]{3,60}$/;
const ID_PATTERN = /^\d{13}-[0-9a-f]{8}(?:-post|-story)?\.jpg$/;

export default async (req, context) => {
  const { event, id } = context.params || {};
  if (!EVENT_PATTERN.test(event || "") || !ID_PATTERN.test(id || "")) {
    return new Response("Not found", { status: 404 });
  }

  const data = await getStore("booth-photos").get(`${event}/${id}`, { type: "arrayBuffer" });
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": 'inline; filename="secret-pug-photo.jpg"',
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = { path: "/photo/:event/:id" };
