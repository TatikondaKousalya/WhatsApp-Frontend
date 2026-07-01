import client from "./client";

// Maps to com.chatapp.controller.MessageController
// MessageResponse: { id, senderId, senderName, receiverId, groupId, message,
//                     messageType, attachmentUrl, messageStatus, createdAt, updatedAt }
// Note: these REST endpoints are mainly for loading history. New messages in
// real time go over the WebSocket (see hooks/useChatSocket.js), which is what
// the backend's STOMP controller (chat.send) expects.

export async function getPrivateHistory(roomId) {
  const res = await client.get(`/messages/private/${roomId}`);
  return res.data.data;
}

export async function getGroupHistory(groupId) {
  const res = await client.get(`/messages/group/${groupId}`);
  return res.data.data;
}

export async function sendPrivateMessageRest(senderId, receiverId, text, attachmentId) {
  const params = new URLSearchParams({ senderId, receiverId, text });
  if (attachmentId) params.append("attachmentId", attachmentId);
  const res = await client.post(`/messages/private?${params.toString()}`);
  return res.data.data;
}

export async function sendGroupMessageRest(senderId, groupId, text, attachmentId) {
  const params = new URLSearchParams({ senderId, groupId, text });
  if (attachmentId) params.append("attachmentId", attachmentId);
  const res = await client.post(`/messages/group?${params.toString()}`);
  return res.data.data;
}

export async function markDelivered(id) {
  return client.put(`/messages/${id}/delivered`);
}

export async function markRead(id) {
  return client.put(`/messages/${id}/read`);
}

export async function deleteMessage(id) {
  return client.delete(`/messages/${id}`);
}
