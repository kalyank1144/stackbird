import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface StreamingMessage {
  conversationId: number;
  chunk?: string;
  response?: string;
  projectId?: number;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [streamingData, setStreamingData] = useState<{
    conversationId: number | null;
    content: string;
    isStreaming: boolean;
  }>({
    conversationId: null,
    content: "",
    isStreaming: false,
  });

  useEffect(() => {
    // Connect to Socket.io server
    const socket = io({
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
      setIsConnected(false);
    });

    // Listen for streaming events
    socket.on("ai:stream:start", (data: StreamingMessage) => {
      console.log("[Socket] Stream started:", data);
      setStreamingData({
        conversationId: data.conversationId,
        content: "",
        isStreaming: true,
      });
    });

    socket.on("ai:stream:chunk", (data: StreamingMessage) => {
      console.log("[Socket] Stream chunk:", data.chunk);
      setStreamingData((prev) => ({
        ...prev,
        content: prev.content + (data.chunk || ""),
      }));
    });

    socket.on("ai:stream:end", (data: StreamingMessage) => {
      console.log("[Socket] Stream ended:", data);
      setStreamingData((prev) => ({
        ...prev,
        content: data.response || prev.content,
        isStreaming: false,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    streamingData,
    clearStreamingData: () => setStreamingData({
      conversationId: null,
      content: "",
      isStreaming: false,
    }),
  };
}
