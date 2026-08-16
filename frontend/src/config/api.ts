export const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // If running in browser on Vercel production domain
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return "/api";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
};

export const getSocketUrl = (): string => {
  if (typeof window !== "undefined") {
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return window.location.origin;
    }
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
};

export const API_URL = getBaseUrl();
export const SOCKET_URL = getSocketUrl();
