import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { parse } from "cookie";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "../../shared/const";
import type { User } from "../../drizzle/schema";

export interface AuthenticatedSocket extends Socket {
  user?: User;
}

let io: SocketIOServer | null = null;

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "development" 
        ? ["http://localhost:3000", "http://localhost:5173"]
        : true,
      credentials: true,
    },
    path: "/socket.io",
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Create a mock request object with cookies
      const mockReq = {
        headers: socket.handshake.headers,
        cookies: parse(socket.handshake.headers.cookie || ""),
      } as any;

      const user = await sdk.authenticateRequest(mockReq);
      if (!user) {
        return next(new Error("Authentication required"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[Socket.io] User connected: ${socket.user?.email} (${socket.id})`);

    // Join user-specific room
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
    }

    socket.on("disconnect", () => {
      console.log(`[Socket.io] User disconnected: ${socket.user?.email} (${socket.id})`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`[Socket.io] Socket error for ${socket.user?.email}:`, error);
    });
  });

  console.log("[Socket.io] WebSocket server initialized");
  return io;
}

export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io not initialized. Call setupSocketIO first.");
  }
  return io;
}

// Helper to emit to a specific user
export function emitToUser(userId: number, event: string, data: any) {
  if (!io) {
    console.warn("[Socket.io] Cannot emit: Socket.io not initialized");
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
}

// Helper to emit to a specific project room
export function emitToProject(projectId: number, event: string, data: any) {
  if (!io) {
    console.warn("[Socket.io] Cannot emit: Socket.io not initialized");
    return;
  }
  io.to(`project:${projectId}`).emit(event, data);
}
