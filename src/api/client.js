import axios from "axios";

// Backend wraps every payload as { success, message, data, timestamp } — see
// com.chatapp.dto.response.ApiResponse. We unwrap `data` in each api/*.js call
// site rather than here, so callers can still see `message` on errors.

const client = axios.create({
  baseURL: "/api",
});

function getTokens() {
  return {
    accessToken: localStorage.getItem("accessToken"),
    refreshToken: localStorage.getItem("refreshToken"),
  };
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

client.interceptors.request.use((config) => {
  const { accessToken } = getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Queue concurrent requests while a refresh is in flight so we only
// hit POST /api/auth/refresh once.
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!response || response.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh the refresh call itself, or auth endpoints.
    if (config.url?.includes("/auth/")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        config._retry = true;
        config.headers.Authorization = `Bearer ${token}`;
        return client(config);
      });
    }

    config._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = getTokens();
      if (!refreshToken) throw error;

      const refreshResponse = await axios.post("/api/auth/refresh", {
        refreshToken,
      });
      const auth = refreshResponse.data.data;
      setTokens({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });

      resolveQueue(null, auth.accessToken);
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
      return client(config);
    } catch (refreshError) {
      resolveQueue(refreshError, null);
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
