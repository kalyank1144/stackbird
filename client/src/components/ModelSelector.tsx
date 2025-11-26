import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AVAILABLE_MODELS, type AIModel } from "@shared/models";
import { ChevronDown, Sparkles } from "lucide-react";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  userPlan: "free" | "pro";
  className?: string;
}

export function ModelSelector({
  selectedModelId,
  onModelChange,
  userPlan,
  className = "",
}: ModelSelectorProps) {
  const selectedModel = AVAILABLE_MODELS[selectedModelId];
  const allModels = Object.values(AVAILABLE_MODELS);

  // Separate models by availability
  const availableModels = allModels.filter((model) =>
    userPlan === "free" ? model.availableForFree : true
  );
  const lockedModels = allModels.filter(
    (model) => userPlan === "free" && !model.availableForFree
  );

  const getBadgeVariant = (badge?: string) => {
    switch (badge) {
      case "NEW":
        return "default";
      case "POPULAR":
        return "secondary";
      case "BEST":
        return "default";
      default:
        return "outline";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "ultra-budget":
        return "text-green-600";
      case "budget":
        return "text-blue-600";
      case "balanced":
        return "text-purple-600";
      case "premium":
        return "text-amber-600";
      default:
        return "text-gray-600";
    }
  };

  const renderModelItem = (model: AIModel, isLocked: boolean = false) => (
    <DropdownMenuItem
      key={model.id}
      onClick={() => !isLocked && onModelChange(model.id)}
      disabled={isLocked}
      className={`flex flex-col items-start gap-1 py-3 ${
        isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{model.name}</span>
            {model.badge && (
              <Badge variant={getBadgeVariant(model.badge)} className="text-xs">
                {model.badge}
              </Badge>
            )}
            {isLocked && (
              <Badge variant="outline" className="text-xs">
                PRO
              </Badge>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{model.description}</p>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between min-w-[240px] ${className}`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">{selectedModel?.name}</span>
            {selectedModel?.badge && (
              <Badge
                variant={getBadgeVariant(selectedModel.badge)}
                className="text-xs"
              >
                {selectedModel.badge}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[400px]">
        <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableModels.map((model) => renderModelItem(model, false))}

        {lockedModels.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Upgrade to Pro to unlock
            </DropdownMenuLabel>
            {lockedModels.map((model) => renderModelItem(model, true))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
