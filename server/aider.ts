import { spawn } from "child_process";
import { EventEmitter } from "events";
import path from "path";

export interface AiderMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiderOptions {
  projectPath: string;
  model?: string;
  apiKey?: string;
}

/**
 * Aider integration for AI-powered code generation
 * Spawns Aider CLI processes and manages communication
 */
export class AiderSession extends EventEmitter {
  private process: ReturnType<typeof spawn> | null = null;
  private projectPath: string;
  private model: string;
  private apiKey: string | undefined;
  private buffer: string = "";

  constructor(options: AiderOptions) {
    super();
    this.projectPath = options.projectPath;
    this.model = options.model || "gpt-4o-mini";
    this.apiKey = options.apiKey;
  }

  /**
   * Start Aider process
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const aiderPath = path.join(process.cwd(), "venv", "bin", "aider");
      
      const args = [
        "--model", this.model,
        "--no-auto-commits",
        "--yes-always",
      ];

      const env = { ...process.env };
      if (this.apiKey) {
        env.OPENAI_API_KEY = this.apiKey;
      }

      this.process = spawn(aiderPath, args, {
        cwd: this.projectPath,
        env,
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.process.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        this.buffer += text;
        this.emit("output", text);
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        // Filter out common Aider progress/warning messages that aren't real errors
        const isProgressOrWarning = 
          text.includes("Scanning repo") ||
          text.includes("%|") ||
          text.includes("Warning: Input is not a terminal") ||
          text.includes("fd=");
        
        if (!isProgressOrWarning) {
          this.emit("error", text);
        }
      });

      this.process.on("error", (error) => {
        this.emit("process-error", error);
        reject(error);
      });

      this.process.on("exit", (code) => {
        this.emit("exit", code);
      });

      // Give Aider time to initialize
      setTimeout(() => resolve(), 2000);
    });
  }

  /**
   * Send a message to Aider
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error("Aider process not started");
    }

    return new Promise((resolve, reject) => {
      this.process!.stdin!.write(`${message}\n`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Stop Aider process
   */
  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Check if Aider is running
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}

/**
 * Simple wrapper for one-shot Aider commands
 */
export async function runAiderCommand(
  options: AiderOptions & { message: string }
): Promise<string> {
  const session = new AiderSession(options);
  
  let output = "";
  session.on("output", (data: string) => {
    output += data;
  });

  await session.start();
  await session.sendMessage(options.message);
  
  // Wait for response
  await new Promise((resolve) => setTimeout(resolve, 5000));
  
  await session.stop();
  
  return output;
}
