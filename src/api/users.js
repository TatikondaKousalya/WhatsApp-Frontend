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

export async function updateProfilePicture(file) {
    const formData = new FormData();
    formData.append("file", file);

    // Do NOT set Content-Type manually for FormData — the browser needs
    // to generate it itself so it can include the multipart boundary.
    // Passing FormData with no explicit Content-Type lets the browser add
    // "multipart/form-data; boundary=...".
    const response = await client.put("/users/profile-picture", formData);

    return response.data.data;
}