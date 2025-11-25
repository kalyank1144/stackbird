import { spawn } from "child_process";
import { WorkspaceManager } from "./workspace";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

export interface ExecutionOptions {
  projectId: number;
  filePath: string;
  timeout?: number; // in milliseconds, default 30s
}

/**
 * Execute code in a sandboxed environment
 * Supports multiple languages based on file extension
 */
export async function executeCode(
  options: ExecutionOptions,
  onOutput?: (data: string, type: "stdout" | "stderr") => void
): Promise<ExecutionResult> {
  const { projectId, filePath, timeout = 30000 } = options;

  const projectPath = WorkspaceManager.getProjectPath(projectId);
  const fullPath = `${projectPath}/${filePath}`;

  // Determine execution command based on file extension
  const ext = filePath.split(".").pop()?.toLowerCase();
  const command = getExecutionCommand(ext, filePath);

  if (!command) {
    return {
      stdout: "",
      stderr: `Unsupported file type: .${ext}`,
      exitCode: 1,
      error: "Unsupported file type",
    };
  }

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const proc = spawn(command.cmd, command.args, {
      cwd: projectPath,
      timeout,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1", // Disable Python output buffering
      },
    });

    // Timeout handler
    const timeoutId = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      stderr += `\n[Execution timeout after ${timeout}ms]`;
    }, timeout);

    proc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      if (onOutput) {
        onOutput(text, "stdout");
      }
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      if (onOutput) {
        onOutput(text, "stderr");
      }
    });

    proc.on("close", (code) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: timedOut ? 124 : code,
        error: timedOut ? "Execution timeout" : undefined,
      });
    });

    proc.on("error", (error) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr: stderr + `\n[Execution error: ${error.message}]`,
        exitCode: 1,
        error: error.message,
      });
    });
  });
}

interface ExecutionCommand {
  cmd: string;
  args: string[];
}

function getExecutionCommand(ext: string | undefined, filePath: string): ExecutionCommand | null {
  switch (ext) {
    case "js":
      return { cmd: "node", args: [filePath] };
    case "ts":
      return { cmd: "npx", args: ["tsx", filePath] };
    case "py":
      return { cmd: "python3", args: [filePath] };
    case "sh":
      return { cmd: "bash", args: [filePath] };
    case "rb":
      return { cmd: "ruby", args: [filePath] };
    default:
      return null;
  }
}
