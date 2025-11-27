import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Code2, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type RetryStatus = 
  | { type: "idle" }
  | { type: "analyzing"; attempt: number; maxAttempts: number }
  | { type: "fixing"; attempt: number; maxAttempts: number }
  | { type: "building"; attempt: number; maxAttempts: number }
  | { type: "success"; attempt: number }
  | { type: "failed"; attempt: number; maxAttempts: number };

interface RetryStatusBannerProps {
  status: RetryStatus;
  onDismiss?: () => void;
}

export function RetryStatusBanner({ status, onDismiss }: RetryStatusBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show banner when status changes from idle
  useEffect(() => {
    if (status.type !== "idle") {
      setIsVisible(true);
      setIsDismissed(false);
    } else {
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Auto-dismiss success after 5 seconds
  useEffect(() => {
    if (status.type === "success") {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status.type) {
      case "analyzing":
        return {
          icon: <Sparkles className="w-5 h-5 animate-pulse" />,
          title: "AI is analyzing build errors...",
          description: `Attempt ${status.attempt} of ${status.maxAttempts}`,
          bgColor: "bg-gradient-to-r from-purple-500/10 to-blue-500/10",
          borderColor: "border-purple-500/30",
          textColor: "text-purple-700 dark:text-purple-300",
          iconColor: "text-purple-600 dark:text-purple-400",
          showProgress: true,
        };
      case "fixing":
        return {
          icon: <Code2 className="w-5 h-5" />,
          title: "AI is fixing code...",
          description: `Attempt ${status.attempt} of ${status.maxAttempts}`,
          bgColor: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10",
          borderColor: "border-blue-500/30",
          textColor: "text-blue-700 dark:text-blue-300",
          iconColor: "text-blue-600 dark:text-blue-400",
          showProgress: true,
        };
      case "building":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          title: "Building...",
          description: `Attempt ${status.attempt} of ${status.maxAttempts}`,
          bgColor: "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
          borderColor: "border-amber-500/30",
          textColor: "text-amber-700 dark:text-amber-300",
          iconColor: "text-amber-600 dark:text-amber-400",
          showProgress: true,
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5" />,
          title: "Build successful!",
          description: `Fixed on attempt ${status.attempt}`,
          bgColor: "bg-gradient-to-r from-green-500/10 to-emerald-500/10",
          borderColor: "border-green-500/30",
          textColor: "text-green-700 dark:text-green-300",
          iconColor: "text-green-600 dark:text-green-400",
          showProgress: false,
        };
      case "failed":
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          title: "Build failed",
          description: `Failed after ${status.attempt} attempts. Check Console tab for details.`,
          bgColor: "bg-gradient-to-r from-red-500/10 to-pink-500/10",
          borderColor: "border-red-500/30",
          textColor: "text-red-700 dark:text-red-300",
          iconColor: "text-red-600 dark:text-red-400",
          showProgress: false,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out",
        config.bgColor,
        config.borderColor,
        isDismissed ? "opacity-0 scale-95" : "opacity-100 scale-100"
      )}
    >
      {/* Animated shimmer effect for active states */}
      {config.showProgress && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}

      <div className="relative flex items-start gap-3">
        {/* Icon with pulse animation */}
        <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={cn("font-semibold text-sm", config.textColor)}>
            {config.title}
          </div>
          <div className={cn("text-xs mt-1 opacity-80", config.textColor)}>
            {config.description}
          </div>

          {/* Progress bar for active states */}
          {config.showProgress && status.type !== "idle" && (
            <div className="mt-3 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  status.type === "analyzing" && "bg-purple-500 w-1/3",
                  status.type === "fixing" && "bg-blue-500 w-2/3",
                  status.type === "building" && "bg-amber-500 w-full animate-pulse"
                )}
              />
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {(status.type === "success" || status.type === "failed") && (
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
              config.textColor
            )}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Add shimmer animation to global CSS
// @keyframes shimmer {
//   100% {
//     transform: translateX(100%);
//   }
// }
