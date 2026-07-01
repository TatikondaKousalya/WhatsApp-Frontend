import client, { setTokens, clearTokens } from "./client";

// Maps 1:1 to com.chatapp.controller.AuthController

export async function register({ firstName, lastName, email, phoneNumber, password, confirmPassword }) {
  const res = await client.post("/auth/register", {
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    confirmPassword,
  });
  const auth = res.data.data;
  setTokens(auth);
  return auth;
}

export async function login({ email, password }) {
  const res = await client.post("/auth/login", { email, password });
  const auth = res.data.data;
  setTokens(auth);
  return auth;
}

export async function logout() {
  const refreshToken = localStorage.getItem("refreshToken");
  try {
    if (refreshToken) {
      await client.post(`/auth/logout?refreshToken=${encodeURIComponent(refreshToken)}`);
    }
  } finally {
    clearTokens();
  }
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const res = await client.put("/auth/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return res.data;
}

export async function getCurrentUser() {
  const res = await client.get("/auth/me");
  return res.data.data; // UserResponse
}
