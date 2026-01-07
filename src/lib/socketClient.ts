import { io, Socket } from "socket.io-client";
import apiClient from "./apiClient";

let socket: Socket | null = null;
let lastToken: string | null = null;

const getBaseUrl = () => {
  // Always use API base for sockets (backend), not the web app origin
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return base.replace(/\/$/, "");
};

export const getSocket = (): Socket | null => {
  const token = apiClient.getAccessToken();
  if (!token) return null;

  if (socket && socket.connected && token === lastToken) {
    return socket;
  }

  const url = getBaseUrl();
  socket = io(url, {
    transports: ["websocket", "polling"], // allow polling fallback if wss is blocked
    auth: { token },
    withCredentials: true,
    path: "/socket.io/",
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  lastToken = token;

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

