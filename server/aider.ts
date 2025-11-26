import { spawn, ChildProcess, execSync } from "child_process";
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
   * @param addFiles - Optional array of file paths to add to Aider's context
   */
  async start(addFiles?: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use python -m aider as recommended by official docs
      // https://aider.chat/docs/troubleshooting/aider-not-found.html
      const pythonPath = "/usr/bin/python3.11";
      
      const args = [
        "-m", "aider",
        "--model", this.model,
        "--no-auto-commits",
        "--yes-always",
      ];
      
      // Add files to context if provided
      if (addFiles && addFiles.length > 0) {
        console.log(`[Aider] Adding ${addFiles.length} files to context`);
        for (const file of addFiles) {
          args.push("--file", file);
        }
      }
      
      console.log(`[Aider] Starting with command: ${pythonPath} ${args.join(" ")}`);
      console.log(`[Aider] Python version check...`);
      // Test Python can start
      try {
        const pythonVersion = execSync(`${pythonPath} --version 2>&1`).toString().trim();
        console.log(`[Aider] ${pythonVersion}`);
      } catch (e) {
        console.error(`[Aider] Failed to check Python version:`, e);
      }
      console.log(`[Aider] Working directory: ${this.projectPath}`);
      console.log(`[Aider] Model: ${this.model}`);

      const env: Record<string, string> = { 
        ...process.env as Record<string, string>,
        // Set Python environment to prevent "No module named 'encodings'" error
        PYTHONHOME: "/usr",
        PYTHONPATH: "/usr/lib/python311.zip:/usr/lib/python3.11:/usr/lib/python3.11/lib-dynload:/usr/local/lib/python3.11/dist-packages:/usr/lib/python3/dist-packages",
        // Ensure UTF-8 encoding
        PYTHONIOENCODING: "utf-8",
        LC_ALL: "C.UTF-8",
        LANG: "C.UTF-8",
        // Prevent git from searching parent directories for .git
        // This ensures Aider uses only the workspace's git repo
        GIT_CEILING_DIRECTORIES: path.dirname(this.projectPath),
      };
      
      console.log(`[Aider] Environment: PYTHONHOME=${env.PYTHONHOME}`);
      console.log(`[Aider] PYTHONPATH=${env.PYTHONPATH}`);
      if (this.apiKey) {
        // Set API key based on model provider
        // Check for provider prefix or model name patterns
        if (this.model.includes("gemini") || this.model.includes("google")) {
          env.GEMINI_API_KEY = this.apiKey;
          console.log(`[Aider] Set GEMINI_API_KEY`);
        } else if (this.model.includes("claude") || this.model.includes("anthropic")) {
          env.ANTHROPIC_API_KEY = this.apiKey;
          console.log(`[Aider] Set ANTHROPIC_API_KEY`);
        } else if (this.model.includes("deepseek")) {
          env.DEEPSEEK_API_KEY = this.apiKey;
          console.log(`[Aider] Set DEEPSEEK_API_KEY`);
        } else {
          env.OPENAI_API_KEY = this.apiKey;
          console.log(`[Aider] Set OPENAI_API_KEY`);
        }
      }

      this.process = spawn(pythonPath, args, {
        cwd: this.projectPath,
        env,
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.process.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        console.log(`[Aider] stdout:`, text.trim());
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
          // Emit as stderr instead of error to avoid unhandled error crashes
          this.emit("stderr", text);
          console.error(`[Aider] stderr:`, text.trim());
        }
      });

      this.process.on("error", (error) => {
        console.error("[Aider] Process error:", error);
        this.emit("process-error", error);
        reject(new Error(`Failed to start Aider: ${error.message}`));
      });

      this.process.on("exit", (code, signal) => {
        console.log(`[Aider] Process exited with code ${code}, signal ${signal}`);
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
