import "server-only";

import { env } from "~/env";

const FOLDER_NAME = "Spark Scheduler";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";

export type DrivePost = {
  id: string;
  caption: string;
  hashtags: string[];
  status: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

export class DriveError extends Error {}

export async function refreshAccessToken(refreshToken: string) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new DriveError("Drive sync needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new DriveError("Google access expired. Use Reconnect Drive in the top bar.");
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

async function call(token: string, url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init?.headers },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok && res.status !== 404) {
    throw new DriveError(`Drive request failed (${res.status}).`);
  }
  return res;
}

async function ensureFolder(token: string) {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const found = (await (
    await call(token, `${API}/files?q=${q}&fields=files(id)&spaces=drive`)
  ).json()) as { files: Array<{ id: string }> };
  if (found.files[0]) return found.files[0].id;

  const created = (await (
    await call(token, `${API}/files?fields=id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      }),
    })
  ).json()) as { id: string };
  return created.id;
}

function multipart(metadata: object, body: string) {
  const boundary = "spark" + Math.random().toString(36).slice(2);
  return {
    contentType: `multipart/related; boundary=${boundary}`,
    body:
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`,
  };
}

/** Creates or updates the JSON file for a post. Returns the Drive file id. */
export async function upsertPostFile(
  token: string,
  post: DrivePost,
  existingFileId: string | null,
) {
  const content = JSON.stringify(
    {
      id: post.id,
      caption: post.caption,
      hashtags: post.hashtags,
      text: `${post.caption}\n\n${post.hashtags.join(" ")}`,
      status: post.status,
      scheduled_at: post.scheduled_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
    },
    null,
    2,
  );

  if (existingFileId) {
    const m = multipart({}, content);
    const res = await call(
      token,
      `${UPLOAD}/files/${existingFileId}?uploadType=multipart&fields=id`,
      { method: "PATCH", headers: { "Content-Type": m.contentType }, body: m.body },
    );
    if (res.status !== 404) return existingFileId;
    // The file was deleted in Drive. Fall through and create it again.
  }

  const folderId = await ensureFolder(token);
  const m = multipart(
    {
      name: `post-${post.id}.json`,
      mimeType: "application/json",
      parents: [folderId],
    },
    content,
  );
  const created = (await (
    await call(token, `${UPLOAD}/files?uploadType=multipart&fields=id`, {
      method: "POST",
      headers: { "Content-Type": m.contentType },
      body: m.body,
    })
  ).json()) as { id: string };
  return created.id;
}

/** Creates or updates an image file in the app folder. Returns the Drive file id. */
export async function upsertImageFile(
  token: string,
  name: string,
  bytes: Buffer,
  mimeType: string,
  existingFileId: string | null,
) {
  const boundary = "spark" + Math.random().toString(36).slice(2);
  const build = (metadata: object) =>
    Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      ),
      bytes,
      Buffer.from(`\r\n--${boundary}--`),
    ]);
  const contentType = `multipart/related; boundary=${boundary}`;

  if (existingFileId) {
    const res = await call(
      token,
      `${UPLOAD}/files/${existingFileId}?uploadType=multipart&fields=id`,
      {
        method: "PATCH",
        headers: { "Content-Type": contentType },
        body: new Uint8Array(build({ name, mimeType })),
      },
    );
    if (res.status !== 404) return existingFileId;
  }

  const folderId = await ensureFolder(token);
  const created = (await (
    await call(token, `${UPLOAD}/files?uploadType=multipart&fields=id`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: new Uint8Array(build({ name, mimeType, parents: [folderId] })),
    })
  ).json()) as { id: string };
  return created.id;
}

export async function deletePostFile(token: string, fileId: string) {
  await call(token, `${API}/files/${fileId}`, { method: "DELETE" });
}
