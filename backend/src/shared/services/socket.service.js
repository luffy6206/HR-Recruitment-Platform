import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../../modules/auth/auth.model.js";

class SocketService {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"],
      },
      pingTimeout: 60000,
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.id).select("-passwordHash");

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket) => {
      const userId = socket.user._id.toString();
      const roomName = `user:${userId}`;
      console.log(`[Socket] User connected: ${socket.user.name} (Socket ID: ${socket.id}, User ID: ${userId})`);
      
      // Join a room specific to the user
      socket.join(roomName);
      console.log(`[Socket] User ${socket.user.name} joined room: ${roomName}`);

      socket.on("disconnect", (reason) => {
        console.log(`[Socket] User disconnected: ${socket.user.name} (Reason: ${reason})`);
      });

      socket.on("error", (error) => {
        console.error(`[Socket] Socket error for user ${socket.user.name}:`, error);
      });
    });

    console.log("[Socket] Socket.IO initialized");
  }

  emitToUser(userId, event, data) {
    if (this.io) {
      const targetRoom = `user:${userId.toString()}`;
      console.log(`[Socket] Attempting to emit ${event} to ${targetRoom}`);
      this.io.to(targetRoom).emit(event, data);
      console.log(`[Socket] Emission command sent for ${event} to ${targetRoom}`);
    } else {
      console.warn("[Socket] Socket.IO not initialized, cannot emit event");
    }
  }

  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`[Socket] Emitted ${event} to all`);
    }
  }
}

export const socketService = new SocketService();
