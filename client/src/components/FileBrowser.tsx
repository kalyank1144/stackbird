import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, File, Folder, FolderOpen, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FileBrowserProps {
  projectId: number;
  onFileSelect?: (filePath: string, content: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

function buildFileTree(files: string[]): FileNode[] {
  const root: FileNode[] = [];
  
  files.forEach((filePath) => {
    const parts = filePath.split("/");
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const existingNode = currentLevel.find((node) => node.name === part);
      
      if (existingNode) {
        if (!isLast && existingNode.children) {
          currentLevel = existingNode.children;
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
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

function FileTreeNode({ 
  node, 
  projectId, 
  onFileSelect 
}: { 
  node: FileNode; 
  projectId: number; 
  onFileSelect: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (node.isDirectory) {
    return (
      <div className="ml-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded-md w-full text-left"
        >
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )}
          <span className="text-sm">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div className="ml-2">
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                projectId={projectId}
                onFileSelect={onFileSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <button
      onClick={() => onFileSelect(node.path)}
      className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded-md w-full text-left ml-4"
    >
      <File className="h-4 w-4 text-gray-500" />
      <span className="text-sm">{node.name}</span>
    </button>
  );
}

export default function FileBrowser({ projectId, onFileSelect }: FileBrowserProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const { data: files, isLoading, refetch } = trpc.files.list.useQuery({ projectId });
  const { data: fileContent, isLoading: isLoadingContent } = trpc.files.read.useQuery(
    { projectId, filePath: selectedFile! },
    { enabled: !!selectedFile }
  );
  
  // Call onFileSelect when file content loads
  useEffect(() => {
    if (fileContent && selectedFile && onFileSelect) {
      onFileSelect(selectedFile, fileContent.content);
    }
  }, [fileContent, selectedFile, onFileSelect]);
  
  const fileTree = files ? buildFileTree(files) : [];
  
  const handleDownload = () => {
    if (!fileContent) return;
    
    const blob = new Blob([fileContent.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileContent.filePath.split("/").pop() || "file.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("File downloaded!");
  };
  
  return (
    <div className="h-full flex overflow-hidden">
        {/* File Tree */}
        <div className="w-64 border-r overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : files && files.length > 0 ? (
            <div>
              {fileTree.map((node) => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  projectId={projectId}
                  onFileSelect={setSelectedFile}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No files yet. Start chatting with AI to generate code!
            </div>
          )}
        </div>
        
        {/* File Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <span className="text-sm font-mono truncate">{selectedFile}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!fileContent}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {isLoadingContent ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : fileContent ? (
                  <pre className="text-sm font-mono bg-muted/30 p-4 rounded-lg overflow-x-auto">
                    <code>{fileContent.content}</code>
                  </pre>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Failed to load file
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a file to view its contents
            </div>
          )}
        </div>
    </div>
  );
}
