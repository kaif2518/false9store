import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Adds the saved login token to every request
api.interceptors.request.use((config) => {
  try {
    const saved = JSON.parse(localStorage.getItem("false9-user"));
    if (saved?.token) {
      config.headers.Authorization = `Bearer ${saved.token}`;
    }
  } catch {
    // no saved login: send the request without a token
  }
  return config;
});

export default api;