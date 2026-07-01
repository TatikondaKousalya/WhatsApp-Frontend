import client from "./client";

// Maps to com.chatapp.controller.ChatController
// ChatRoomResponse: { id, name, roomType, receiverId, groupId, profilePicture, online }

export async function getChatRooms() {
  const res = await client.get("/chats");
  return res.data.data;
}

export async function getChatRoom(id) {
  const res = await client.get(`/chats/${id}`);
  return res.data.data;
}

export async function createPrivateChat(receiverId) {
  const res = await client.post("/chats/private", { receiverId });
  return res.data.data;
}

export async function createGroupChat(name, members) {
  const res = await client.post("/chats/group", { name, members });
  return res.data.data;
}

export async function deleteChatRoom(id) {
  const res = await client.delete(`/chats/${id}`);
  return res.data;
}
