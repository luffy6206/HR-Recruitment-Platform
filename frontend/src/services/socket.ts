import { io, Socket } from "socket.io-client";
import { tokenStore } from "./http";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Set<(notification: any) => void> = new Set();

  connect() {
    if (this.socket?.connected) {
      console.log("[Socket] Already connected, skipping connect()");
      return;
    }

    const token = tokenStore.access;
    if (!token) {
      console.warn("[Socket] No access token found, cannot connect");
      return;
    }

    console.log("[Socket] Initializing connection to:", SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Re-attach all existing listeners to the new socket instance
    this.listeners.forEach(callback => {
      console.log("[Socket] Re-attaching listener to new socket instance");
      this.socket?.on("notification:received", (data) => {
        console.log("[Socket] Received event 'notification:received':", data);
        callback(data);
      });
    });

    this.socket.on("connect", () => {
      console.log("[Socket] Connected to server. Socket ID:", this.socket?.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
      if (error.message === "Authentication error") {
        console.warn("[Socket] Authentication failed. Disconnecting...");
        this.disconnect();
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected from server. Reason:", reason);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log("[Socket] Manually disconnecting...");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onNotificationReceived(callback: (notification: any) => void) {
    console.log("[Socket] Registering listener for 'notification:received'");
    this.listeners.add(callback);
    
    if (this.socket) {
      console.log("[Socket] Socket exists, attaching listener immediately");
      this.socket.on("notification:received", (data) => {
        console.log("[Socket] Received event 'notification:received':", data);
        callback(data);
      });
    } else {
      console.log("[Socket] Socket not initialized yet. Listener queued.");
    }
  }

  offNotificationReceived() {
    console.log("[Socket] Removing all 'notification:received' listeners");
    if (this.socket) {
      this.socket.off("notification:received");
    }
    this.listeners.clear();
  }
}

export const socketService = new SocketService();
