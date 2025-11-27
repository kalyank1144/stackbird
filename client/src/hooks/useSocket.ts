import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface StreamingMessage {
  conversationId: number;
  chunk?: string;
  response?: string;
  projectId?: number;
}

export interface BuildMessage {
  projectId: number;
  output?: string;
  error?: string;
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

  const [buildStatus, setBuildStatus] = useState<{
    projectId: number | null;
    isBuilding: boolean;
    error: string | null;
  }>({
    projectId: null,
    isBuilding: false,
    error: null,
  });

  const [buildLogs, setBuildLogs] = useState<Array<{ projectId: number; log: string }>>([]); 

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

    // Listen for code execution output
    socket.on("execution:output", (data: { projectId: number; filePath: string; type: string; data: string }) => {
      console.log("[Socket] Execution output:", data);
      // Forward to terminal
      if ((window as any).__terminalAddLine) {
        (window as any).__terminalAddLine(data.type as "stdout" | "stderr", data.data);
      }
    });

    // Listen for build events
    socket.on("build:start", (data: BuildMessage) => {
      console.log("[Socket] Build started:", data);
      setBuildStatus({
        projectId: data.projectId,
        isBuilding: true,
        error: null,
      });
      // Clear previous logs for this project
      setBuildLogs(prev => prev.filter(l => l.projectId !== data.projectId));
      if (data.output) {
        setBuildLogs(prev => [...prev, { projectId: data.projectId, log: data.output! }]);
      }
    });

    socket.on("build:success", (data: BuildMessage) => {
      console.log("[Socket] Build succeeded:", data);
      setBuildStatus({
        projectId: data.projectId,
        isBuilding: false,
        error: null,
      });
      if (data.output) {
        setBuildLogs(prev => [...prev, { projectId: data.projectId, log: data.output! }]);
      }
    });

    socket.on("build:error", (data: BuildMessage) => {
      console.log("[Socket] Build failed:", data);
      setBuildStatus({
        projectId: data.projectId,
        isBuilding: false,
        error: data.error || "Build failed",
      });
      if (data.error) {
        setBuildLogs(prev => [...prev, { projectId: data.projectId, log: `ERROR: ${data.error}` }]);
      }
    });

    // Listen for build output streaming
    socket.on("build:output", (data: BuildMessage & { output: string }) => {
      console.log("[Socket] Build output:", data.output);
      setBuildLogs(prev => [...prev, { projectId: data.projectId, log: data.output }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    streamingData,
    buildStatus,
    buildLogs,
    clearStreamingData: () => setStreamingData({
      conversationId: null,
      content: "",
      isStreaming: false,
    }),
  };
}
