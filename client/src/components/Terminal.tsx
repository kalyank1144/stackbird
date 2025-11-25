import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, X, Loader2 } from "lucide-react";

interface TerminalLine {
  type: "stdout" | "stderr" | "system";
  content: string;
  timestamp: number;
}

interface TerminalProps {
  projectId: number;
  filePath: string | null;
  onRun?: () => void;
  isRunning?: boolean;
}

export default function Terminal({ projectId, filePath, onRun, isRunning }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (type: "stdout" | "stderr" | "system", content: string) => {
    setLines((prev) => [...prev, { type, content, timestamp: Date.now() }]);
  };

  const clearTerminal = () => {
    setLines([]);
  };

  // Expose addLine method to parent via callback
  useEffect(() => {
    // Store reference for WebSocket handler
    (window as any).__terminalAddLine = addLine;
    return () => {
      delete (window as any).__terminalAddLine;
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-gray-400 text-xs ml-2">Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRun}
            disabled={!filePath || isRunning}
            className="h-7 text-xs"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1.5" />
                Run Code
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {lines.length === 0 ? (
          <div className="text-gray-500 text-xs">
            {filePath
              ? `Ready to execute ${filePath}. Click 'Run Code' to start.`
              : "Select a file to execute."}
          </div>
        ) : (
          lines.map((line, index) => (
            <div
              key={index}
              className={`whitespace-pre-wrap ${
                line.type === "stderr"
                  ? "text-red-400"
                  : line.type === "system"
                  ? "text-blue-400"
                  : "text-green-400"
              }`}
            >
              {line.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
