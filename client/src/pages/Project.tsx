import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import Editor from "@monaco-editor/react";
import { ArrowLeft, Loader2, FileText, Sparkles, Eye, Code2, FolderOpen, ChevronRight, ChevronDown, Upload, Github, Terminal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";
import { ModelSelector } from "@/components/ModelSelector";
import { RetryStatusBanner, type RetryStatus } from "@/components/RetryStatusBanner";
import { BuildingPreview } from "@/components/BuildingPreview";
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

// Helper to organize files into tree structure
interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

function buildFileTree(files: string[]): FileNode[] {
  const root: FileNode[] = [];
  
  files.forEach(filePath => {
    const parts = filePath.split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const existingNode = currentLevel.find(node => node.name === part);
      
      if (existingNode) {
        if (!isLast && existingNode.children) {
          currentLevel = existingNode.children;
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          isDirectory: !isLast,
          children: !isLast ? [] : undefined,
        };
        currentLevel.push(newNode);
        if (!isLast && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    });
  });
  
  return root;
}

export default function Project() {
  const { id } = useParams();
  const projectId = parseInt(id || "0");
  const { user, loading: authLoading } = useAuth();
  const [message, setMessage] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const { isConnected, streamingData, buildStatus, buildLogs: allBuildLogs, clearStreamingData } = useSocket();
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    getDefaultModel("pro").id
  );
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "console">("preview");
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  // Filter build logs for current project
  const buildLogs = allBuildLogs.filter(log => log.projectId === projectId).map(log => log.log);
  const [githubDialogOpen, setGithubDialogOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [retryStatus, setRetryStatus] = useState<RetryStatus>({ type: "idle" });

  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: files, refetch: refetchFiles } = trpc.files.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: previewUrl } = trpc.preview.getUrl.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  
  // Force iframe to do a hard reload when preview key changes (bypasses all cache)
  useEffect(() => {
    if (iframeRef.current && previewUrl) {
      const iframe = iframeRef.current;
      
      // First load: set src directly
      if (!iframe.src || iframe.src === 'about:blank') {
        iframe.src = `${previewUrl.fullUrl}?t=${Date.now()}`;
      } else {
        // Subsequent loads: use hard reload to bypass all cache layers
        try {
          // This forces a complete reload, bypassing cache (like Ctrl+F5)
          iframe.contentWindow?.location.reload();
        } catch (e) {
          // Fallback if contentWindow is not accessible (cross-origin)
          iframe.src = `${previewUrl.fullUrl}?t=${Date.now()}`;
        }
      }
    }
  }, [previewKey, previewUrl]);

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

  // Fetch project conversations
  const { data: conversations } = trpc.chat.conversations.useQuery({ projectId });
  
  // Auto-select most recent conversation when project loads
  useEffect(() => {
    if (conversations && conversations.length > 0 && !currentConversationId) {
      // Sort by createdAt descending and select the most recent
      const sorted = [...conversations].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setCurrentConversationId(sorted[0].id);
    }
  }, [conversations, currentConversationId]);

  const { data: messages, refetch: refetchMessages } = trpc.chat.history.useQuery(
    { conversationId: currentConversationId! },
    { enabled: !!currentConversationId }
  );

  const [fileToRead, setFileToRead] = useState<string | null>(null);
  
  const { data: fileData, error: fileError } = trpc.files.read.useQuery(
    { projectId, filePath: fileToRead! },
    { enabled: !!fileToRead }
  );
  
  // Handle file data when loaded
  useEffect(() => {
    if (fileData) {
      setSelectedFile({ path: fileData.filePath, content: fileData.content });
      setEditorContent(fileData.content);
      setHasUnsavedChanges(false);
      setActiveTab("code");
      setFileToRead(null);
    }
  }, [fileData]);
  
  // Handle file read errors
  useEffect(() => {
    if (fileError) {
      toast.error(`Failed to read file: ${fileError.message}`);
      setFileToRead(null);
    }
  }, [fileError]);

  const updateFile = trpc.files.update.useMutation({
    onSuccess: () => {
      toast.success("File saved!");
      setHasUnsavedChanges(false);
      refetchFiles();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.conversationId);
      setMessage("");
      refetchFiles();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingData.content]);

  // Auto-scroll console when new build logs arrive
  useEffect(() => {
    if (activeTab === "console") {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [buildLogs, activeTab]);

  // Refetch messages when streaming ends and refresh preview
  useEffect(() => {
    // Only refetch if streaming just ended for the current conversation
    if (!streamingData.isStreaming && 
        streamingData.conversationId !== null && 
        streamingData.conversationId === currentConversationId) {
      refetchMessages();
      refetchFiles();
      clearStreamingData();
      // Refresh preview iframe
      setPreviewKey(prev => prev + 1);
    }
  }, [streamingData.isStreaming, streamingData.conversationId, currentConversationId, refetchMessages, refetchFiles, clearStreamingData]);

  // Update retry status banner based on build status
  useEffect(() => {
    if (buildStatus.projectId !== projectId) return;
    
    if (buildStatus.isBuilding) {
      // Building state
      setRetryStatus({
        type: "building",
        attempt: buildStatus.attempt || 1,
        maxAttempts: buildStatus.maxAttempts || 3,
      });
    } else if (!buildStatus.error && buildStatus.attempt) {
      // Build succeeded
      setRetryStatus({
        type: "success",
        attempt: buildStatus.attempt,
      });
      
      // Auto-switch to Preview tab if currently on Console tab
      if (activeTab === "console") {
        console.log("[Project] Auto-switching to Preview tab");
        setActiveTab("preview");
      }
      
      // Refresh preview
      console.log("[Project] Build succeeded, refreshing preview");
      setPreviewKey(prev => prev + 1);
    } else if (buildStatus.error && buildStatus.attempt && buildStatus.maxAttempts) {
      // Build failed
      if (buildStatus.attempt >= buildStatus.maxAttempts) {
        // All attempts exhausted
        setRetryStatus({
          type: "failed",
          attempt: buildStatus.attempt,
          maxAttempts: buildStatus.maxAttempts,
        });
      } else {
        // More attempts remaining - AI is analyzing/fixing
        setRetryStatus({
          type: "analyzing",
          attempt: buildStatus.attempt + 1,
          maxAttempts: buildStatus.maxAttempts,
        });
      }
    }
  }, [buildStatus, projectId, activeTab]);
  
  // Update retry status when AI is streaming (fixing code)
  useEffect(() => {
    if (streamingData.isStreaming && retryStatus.type === "analyzing") {
      setRetryStatus(prev => 
        prev.type === "analyzing" ? { ...prev, type: "fixing" } : prev
      );
    }
  }, [streamingData.isStreaming, retryStatus.type]);

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

  const handleFileClick = (filePath: string) => {
    setFileToRead(filePath);
  };

  const handleSaveFile = () => {
    if (!selectedFile) return;
    updateFile.mutate({
      projectId,
      filePath: selectedFile.path,
      content: editorContent,
    });
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        {node.isDirectory ? (
          <>
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-md transition-colors"
              style={{ paddingLeft: `${level * 12 + 12}px` }}
            >
              {expandedFolders.has(node.path) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <FolderOpen className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">{node.name}</span>
            </button>
            {expandedFolders.has(node.path) && node.children && (
              <div>{renderFileTree(node.children, level + 1)}</div>
            )}
          </>
        ) : (
          <button
            onClick={() => handleFileClick(node.path)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-md transition-colors ${
              selectedFile?.path === node.path ? 'bg-accent' : ''
            }`}
            style={{ paddingLeft: `${level * 12 + 32}px` }}
          >
            <FileText className="h-4 w-4 text-purple-500" />
            <span>{node.name}</span>
          </button>
        )}
      </div>
    ));
  };

  const fileTree = files ? buildFileTree(files) : [];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold">{project.name}</h1>
              <p className="text-xs text-muted-foreground">{APP_TITLE}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!githubStatus?.isAuthenticated) {
                toast.error("GitHub not connected. Please connect your GitHub account in settings.");
                return;
              }
              setRepoName(project?.name.toLowerCase().replace(/\s+/g, "-") || "");
              setRepoDescription(project?.description || "");
              setGithubDialogOpen(true);
            }}
          >
            <Github className="h-4 w-4 mr-2" />
            {repoStatus?.hasRepo ? "Update" : "Push to"} GitHub
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Upload className="h-4 w-4 mr-2" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <div className="w-64 border-r flex flex-col bg-card">
          <div className="px-3 py-2 border-b">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Files</h2>
          </div>
          <ScrollArea className="flex-1">
            {!files || files.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No files yet</p>
                <p className="text-xs mt-1">Start chatting to generate code</p>
              </div>
            ) : (
              <div className="py-2">
                {renderFileTree(fileTree)}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Center - Chat/Preview/Code */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "code")} className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                  {isConnected && <div className="h-2 w-2 rounded-full bg-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="code" className="gap-2">
                  <Code2 className="h-4 w-4" />
                  Code
                  {hasUnsavedChanges && <div className="h-2 w-2 rounded-full bg-orange-500" />}
                </TabsTrigger>
                <TabsTrigger value="console" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  Console
                  {buildStatus.error && <div className="h-2 w-2 rounded-full bg-red-500" />}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="flex-1 m-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                {!messages || messages.length === 0 ? (
                  <div className="max-w-2xl mx-auto text-center py-20">
                    <h2 className="text-3xl font-bold mb-2">Start Building</h2>
                    <p className="text-muted-foreground mb-8">Tell me what to create</p>
                    <div className="flex flex-wrap gap-3 justify-center mb-12">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setMessage("Create a landing page for a SaaS product")}
                      >
                        <FileText className="h-4 w-4" />
                        Landing page
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setMessage("Build a dashboard with charts")}
                      >
                        <Code2 className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted border"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className="text-xs opacity-60 mt-2">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {streamingData.isStreaming && streamingData.conversationId === currentConversationId && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted border">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamingData.content}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            <p className="text-xs text-muted-foreground">Generating...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t p-4 bg-card">
                <div className="max-w-3xl mx-auto space-y-3">
                  {/* Retry Status Banner - Only show when NOT on preview tab (animation shows there instead) */}
                  {retryStatus.type !== "idle" && activeTab !== "preview" && (
                    <RetryStatusBanner 
                      status={retryStatus} 
                      onDismiss={() => setRetryStatus({ type: "idle" })}
                    />
                  )}
                  <div className="flex gap-3">
                    <Input
                      placeholder="Describe what you want..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendMessage.isPending}
                      className="flex-1 h-12"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessage.isPending || !message.trim()}
                      size="lg"
                      className="px-6 gap-2"
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                  <ModelSelector
                    selectedModelId={selectedModelId}
                    onModelChange={setSelectedModelId}
                    userPlan="pro"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 m-0 flex flex-col">
              <div className="flex-1 flex flex-col">
                {selectedFile ? (
                  <>
                    <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/50">
                      <span className="text-sm font-medium">{selectedFile.path}</span>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSaveFile}
                        disabled={!hasUnsavedChanges || updateFile.isPending}
                      >
                        {updateFile.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                    <Editor
                      height="100%"
                      language={getLanguageFromPath(selectedFile.path)}
                      value={editorContent}
                      onChange={(value) => {
                        setEditorContent(value || "");
                        setHasUnsavedChanges(true);
                      }}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: "on",
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div className="space-y-3">
                      <Code2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Select a file from the browser to view and edit code
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="console" className="flex-1 m-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-4 bg-black text-green-400 font-mono text-sm">
                  {buildLogs.length === 0 ? (
                    <div className="text-gray-500">No build logs yet. Build logs will appear here when AI generates code.</div>
                  ) : (
                    <div className="space-y-1">
                      {buildLogs.map((log, index) => (
                        <div key={index} className="whitespace-pre-wrap break-words">
                          {log}
                        </div>
                      ))}
                      <div ref={consoleEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right - Preview Pane */}
        <div className="w-96 border-l flex flex-col bg-muted/30">
          <div className="border-b px-4 py-3 bg-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Preview</h3>
              {buildStatus.isBuilding && buildStatus.projectId === projectId && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Building{buildStatus.attempt ? ` (${buildStatus.attempt}/${buildStatus.maxAttempts})` : ''}...
                </div>
              )}
              {!buildStatus.isBuilding && buildStatus.projectId === projectId && buildStatus.error && (
                <div className="text-xs text-destructive">
                  Build failed
                </div>
              )}
              {!buildStatus.isBuilding && buildStatus.projectId === projectId && !buildStatus.error && buildStatus.attempt && (
                <div className="text-xs text-green-600">
                  ✓ Build successful
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewKey(prev => prev + 1)}
              className="h-7 px-2"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
          <div className="flex-1 relative bg-white">
            {/* Show BuildingPreview when AI is working (analyzing, fixing, or building) */}
            {retryStatus.type !== "idle" ? (
              <BuildingPreview 
                attempt={buildStatus.attempt || retryStatus.attempt || 1}
                maxAttempts={buildStatus.maxAttempts || 3}
                status={retryStatus.type === "analyzing" ? "analyzing" : retryStatus.type === "fixing" ? "fixing" : "building"}
              />
            ) : previewUrl && files && files.length > 0 ? (
              <iframe
                key={previewKey}
                ref={iframeRef}
                src="about:blank"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                title="Live Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Eye className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Preview appears here</p>
                  <p className="text-xs text-muted-foreground">
                    {files && files.length === 0
                      ? "Generate some code to see the live preview"
                      : "Live preview of your application will be displayed here"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Dialog */}
      <Dialog open={githubDialogOpen} onOpenChange={setGithubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push to GitHub</DialogTitle>
            <DialogDescription>
              {repoStatus?.hasRepo
                ? "Update your existing GitHub repository with the latest changes."
                : "Create a new GitHub repository and push your code."}
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
                disabled={repoStatus?.hasRepo}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-description">Description (optional)</Label>
              <Textarea
                id="repo-description"
                value={repoDescription}
                onChange={(e) => setRepoDescription(e.target.value)}
                placeholder="A brief description of your project"
                rows={3}
              />
            </div>
            {!repoStatus?.hasRepo && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                />
                <Label htmlFor="private" className="text-sm font-normal">
                  Make this repository private
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGithubDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                pushToGitHub.mutate({
                  projectId,
                  repoName,
                  description: repoDescription,
                  isPrivate,
                });
              }}
              disabled={!repoName || pushToGitHub.isPending}
            >
              {pushToGitHub.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4 mr-2" />
                  {repoStatus?.hasRepo ? "Update Repository" : "Create & Push"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
