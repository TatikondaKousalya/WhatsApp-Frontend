import client from "./client";

// Maps to com.chatapp.controller.UserController

export async function getUser(id) {
  const res = await client.get(`/users/${id}`);
  return res.data.data;
}

export async function getAllUsers() {
  const res = await client.get("/users");
  return res.data.data;
}

export async function getMe() {
  const res = await client.get("/users/me");
  return res.data.data;
}

export async function updateProfile({ firstName, lastName, phoneNumber, bio }) {
  const res = await client.put("/users", { firstName, lastName, phoneNumber, bio });
  return res.data.data;
}

export async function searchUsers(keyword) {
  const res = await client.get(`/users/search?keyword=${encodeURIComponent(keyword)}`);
  return res.data.data;
}
