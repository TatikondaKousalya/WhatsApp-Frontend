import client from "./client";

// Maps to com.chatapp.controller.AttachmentController

export async function uploadFile(userId, file) {
  const form = new FormData();
  form.append("userId", userId);
  form.append("file", file);
  const res = await client.post("/files/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data; // Attachment entity, has .id used as attachmentId elsewhere
}

export function downloadUrl(id) {
  return `/api/files/download/${id}`;
}
