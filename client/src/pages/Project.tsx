import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import Editor from "@monaco-editor/react";
import { ArrowLeft, Send, Loader2, MessageSquare, Code2, FileText, Github, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";
import FileBrowser from "@/components/FileBrowser";
import Terminal from "@/components/Terminal";
import { ModelSelector } from "@/components/ModelSelector";
import { getDefaultModel } from "@shared/models";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Helper to get Monaco language from file path
function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    json: "json",
    html: "html",
    css: "css",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    yaml: "yaml",
    yml: "yaml",
  };
  return languageMap[ext || ""] || "plaintext";
}

export default function Project() {
  const { id } = useParams();
  const projectId = parseInt(id || "0");
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const { isConnected, streamingData, clearStreamingData } = useSocket();
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [githubDialogOpen, setGithubDialogOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    getDefaultModel("pro").id // TODO: Use actual user plan
  );

  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: githubStatus } = trpc.github.status.useQuery();
  const { data: repoStatus } = trpc.github.checkRepo.useQuery({ projectId });
  const pushToGitHub = trpc.github.createAndPush.useMutation({
    onSuccess: (data) => {
      toast.success("Successfully pushed to GitHub!");
      setGithubDialogOpen(false);
      window.open(data.htmlUrl, "_blank");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: conversations } = trpc.chat.conversations.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: messages, refetch: refetchMessages } = trpc.chat.history.useQuery(
    { conversationId: currentConversationId! },
    { enabled: !!currentConversationId }
  );

  const executeCode = trpc.execution.run.useMutation({
    onMutate: () => {
      setIsExecuting(true);
      // Add system message
      if ((window as any).__terminalAddLine) {
        (window as any).__terminalAddLine("system", `\n$ Executing ${selectedFile?.path}...\n`);
      }
    },
    onSuccess: (result) => {
      setIsExecuting(false);
      // Add final output
      if ((window as any).__terminalAddLine) {
        if (result.stdout) {
          (window as any).__terminalAddLine("stdout", result.stdout);
        }
        if (result.stderr) {
          (window as any).__terminalAddLine("stderr", result.stderr);
        }
        (window as any).__terminalAddLine(
          "system",
          `\n[Process exited with code ${result.exitCode}]\n`
        );
      }
      if (result.exitCode === 0) {
        toast.success("Code executed successfully!");
      } else {
        toast.error(`Execution failed with code ${result.exitCode}`);
      }
    },
    onError: (error) => {
      setIsExecuting(false);
      if ((window as any).__terminalAddLine) {
        (window as any).__terminalAddLine("stderr", `\nError: ${error.message}\n`);
      }
      toast.error(`Execution error: ${error.message}`);
    },
  });

  const updateFile = trpc.files.update.useMutation({
    onSuccess: () => {
      toast.success("File saved!");
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.conversationId);
      setMessage("");
      // Don't refetch immediately - wait for streaming to complete
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Refetch messages when streaming ends
  useEffect(() => {
    if (!streamingData.isStreaming && streamingData.conversationId === currentConversationId) {
      refetchMessages();
      clearStreamingData();
    }
  }, [streamingData.isStreaming, streamingData.conversationId, currentConversationId, refetchMessages, clearStreamingData]);

  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessage.mutate({
      projectId,
      conversationId: currentConversationId,
      message: message.trim(),
      modelId: selectedModelId,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <p className="text-xs text-muted-foreground">{project.description || "No description"}</p>
          </div>
        </div>
        <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {APP_TITLE}
        </span>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="vertical">
          {/* Top Section: File Browser + Editor + Chat */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <ResizablePanelGroup direction="horizontal">
          {/* File Browser Panel */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col border-r">
              <div className="border-b px-4 py-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Files</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <FileBrowser 
                  projectId={projectId}
                  onFileSelect={(path, content) => {
                    setSelectedFile({ path, content });
                    setEditorContent(content);
                    setHasUnsavedChanges(false);
                  }}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col">
              <div className="border-b px-4 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {selectedFile ? selectedFile.path : "Code Editor"}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="text-xs text-orange-500">● Unsaved</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedFile && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateFile.mutate({
                            projectId,
                            filePath: selectedFile.path,
                            content: editorContent,
                          });
                        }}
                        disabled={!hasUnsavedChanges || updateFile.isPending}
                      >
                        {updateFile.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save (Ctrl+S)"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedFile) {
                            executeCode.mutate({
                              projectId,
                              filePath: selectedFile.path,
                            });
                          }
                        }}
                        disabled={isExecuting}
                      >
                        {isExecuting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!githubStatus?.isAuthenticated) {
                        toast.error("GitHub not connected. Please connect your GitHub account.");
                        return;
                      }
                      setRepoName(project?.name.toLowerCase().replace(/\s+/g, "-") || "");
                      setRepoDescription(project?.description || "");
                      setGithubDialogOpen(true);
                    }}
                  >
                    <Github className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Editor
                height="100%"
                language={selectedFile ? getLanguageFromPath(selectedFile.path) : "typescript"}
                value={selectedFile ? editorContent : "// Select a file from the browser or start chatting with AI to generate code"}
                onChange={(value) => {
                  setEditorContent(value || "");
                  setHasUnsavedChanges(true);
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: !selectedFile,
                }}
              />
            </div>
          </ResizablePanel>

              <ResizableHandle withHandle />

              {/* AI Chat Panel */}
              <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="border-b px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-xs text-muted-foreground">
                    {isConnected ? "Connected" : "Connecting..."}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {!messages || messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div className="space-y-2">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Start a conversation with AI
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ask me to generate code, fix bugs, or refactor your project
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show streaming message */}
                    {streamingData.isStreaming && streamingData.conversationId === currentConversationId && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                          <p className="text-sm whitespace-pre-wrap">{streamingData.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <p className="text-xs opacity-70">Generating code...</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-4 space-y-3">
                <ModelSelector
                  selectedModelId={selectedModelId}
                  onModelChange={setSelectedModelId}
                  userPlan="pro"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask AI to generate code..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessage.isPending || !message.trim()}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Bottom Section: Terminal */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <Terminal
              projectId={projectId}
              filePath={selectedFile?.path || null}
              onRun={() => {
                if (selectedFile) {
                  executeCode.mutate({
                    projectId,
                    filePath: selectedFile.path,
                  });
                }
              }}
              isRunning={isExecuting}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* GitHub Push Dialog */}
      <Dialog open={githubDialogOpen} onOpenChange={setGithubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push to GitHub</DialogTitle>
            <DialogDescription>
              Create a new repository and push your code to GitHub
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repository Name</Label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-awesome-project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-description">Description (Optional)</Label>
              <Textarea
                id="repo-description"
                value={repoDescription}
                onChange={(e) => setRepoDescription(e.target.value)}
                placeholder="A brief description of your project"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="private"
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
              />
              <Label htmlFor="private" className="text-sm font-normal cursor-pointer">
                Make repository private
              </Label>
            </div>
            {repoStatus?.hasRepo && (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                ⚠️ This project already has a Git repository. Pushing will overwrite the remote.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGithubDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!repoName.trim()) {
                  toast.error("Repository name is required");
                  return;
                }
                pushToGitHub.mutate({
                  projectId,
                  repoName: repoName.trim(),
                  description: repoDescription.trim() || undefined,
                  isPrivate,
                });
              }}
              disabled={pushToGitHub.isPending}
            >
              {pushToGitHub.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4 mr-2" />
                  Push to GitHub
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
