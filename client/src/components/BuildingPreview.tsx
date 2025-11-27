import { useEffect, useState } from "react";
import { Wrench, Code, Sparkles, Loader2 } from "lucide-react";

interface BuildingPreviewProps {
  attempt: number;
  maxAttempts: number;
  status: "analyzing" | "fixing" | "building";
}

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "active" | "complete";
}

export function BuildingPreview({ attempt, maxAttempts, status }: BuildingPreviewProps) {
  const [steps, setSteps] = useState<Step[]>([
    { id: "reading", label: "Reading errors", icon: <Sparkles className="h-4 w-4" />, status: "pending" },
    { id: "analyzing", label: "Analyzing code", icon: <Code className="h-4 w-4" />, status: "pending" },
    { id: "fixing", label: "Writing fix", icon: <Wrench className="h-4 w-4" />, status: "pending" },
    { id: "building", label: "Building project", icon: <Loader2 className="h-4 w-4 animate-spin" />, status: "pending" },
  ]);

  // Update steps based on current status
  useEffect(() => {
    setSteps(prev => prev.map(step => {
      if (status === "analyzing") {
        if (step.id === "reading") return { ...step, status: "complete" as const };
        if (step.id === "analyzing") return { ...step, status: "active" as const };
        return { ...step, status: "pending" as const };
      } else if (status === "fixing") {
        if (step.id === "reading" || step.id === "analyzing") return { ...step, status: "complete" as const };
        if (step.id === "fixing") return { ...step, status: "active" as const };
        return { ...step, status: "pending" as const };
      } else if (status === "building") {
        if (step.id === "building") return { ...step, status: "active" as const };
        return { ...step, status: "complete" as const };
      }
      return step;
    }));
  }, [status]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl w-full">
        {/* Main content */}
        <div className="flex items-center justify-between gap-12">
          {/* Left side - Text and steps */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                AI is fixing your code...
              </h2>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${(attempt / maxAttempts) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  Attempt {attempt} of {maxAttempts}
                </span>
              </div>
            </div>

            {/* Steps checklist */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    step.status === "active"
                      ? "bg-white shadow-md scale-105"
                      : step.status === "complete"
                      ? "bg-white/50"
                      : "bg-transparent"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.status === "complete"
                        ? "bg-green-500 text-white"
                        : step.status === "active"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step.status === "complete" ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span
                    className={`text-base font-medium transition-colors duration-300 ${
                      step.status === "active"
                        ? "text-gray-900"
                        : step.status === "complete"
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                    {step.status === "active" && (
                      <span className="inline-block ml-2 animate-pulse">...</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Robot illustration */}
          <div className="flex-shrink-0 relative">
            {/* Robot container with floating animation */}
            <div className="relative animate-float">
              {/* Robot body */}
              <div className="relative w-64 h-64">
                {/* Main robot circle */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-2xl flex items-center justify-center">
                  {/* Robot face */}
                  <div className="relative">
                    {/* Eyes */}
                    <div className="flex gap-8 mb-4">
                      <div className="w-8 h-8 bg-cyan-300 rounded-full animate-pulse" />
                      <div className="w-8 h-8 bg-cyan-300 rounded-full animate-pulse" />
                    </div>
                    {/* Antenna */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-1 h-8 bg-blue-500">
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Headphones */}
                <div className="absolute top-8 -left-6 w-12 h-12 bg-gray-700 rounded-full border-4 border-gray-800" />
                <div className="absolute top-8 -right-6 w-12 h-12 bg-gray-700 rounded-full border-4 border-gray-800" />
                
                {/* Tool belt */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-600 rounded-lg shadow-lg flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-gray-800 rounded" />
                  <div className="w-4 h-4 bg-gray-800 rounded" />
                  <div className="w-4 h-4 bg-gray-800 rounded" />
                </div>
              </div>

              {/* Floating code snippets */}
              <FloatingCodeSnippet delay={0} top="10%" left="-20%" code="const fix = () => {}" />
              <FloatingCodeSnippet delay={1} top="30%" right="-25%" code="import React from 'react'" />
              <FloatingCodeSnippet delay={2} top="60%" left="-15%" code="<div className='...'>" />
              <FloatingCodeSnippet delay={1.5} top="70%" right="-20%" code="export default App" />
            </div>

            {/* Sparkles */}
            <div className="absolute top-0 right-0 text-yellow-400 animate-pulse">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="absolute bottom-10 left-0 text-purple-400 animate-pulse" style={{ animationDelay: "0.5s" }}>
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="absolute top-20 right-10 text-blue-400 animate-pulse" style={{ animationDelay: "1s" }}>
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingCodeSnippet({ 
  code, 
  delay, 
  top, 
  left, 
  right 
}: { 
  code: string; 
  delay: number; 
  top?: string; 
  left?: string; 
  right?: string;
}) {
  return (
    <div
      className="absolute animate-float-slow"
      style={{
        top,
        left,
        right,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-purple-200">
        <code className="text-xs font-mono text-purple-600">{code}</code>
      </div>
    </div>
  );
}
