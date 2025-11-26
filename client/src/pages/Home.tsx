import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Zap, Database, Sparkles } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

export default function Home() {
  // No auth required - redirect directly to dashboard
  window.location.href = "/dashboard";
  return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {APP_TITLE}
          </span>
        </div>
        <Button asChild>
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            AI-Powered Code Generation
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              for Large Codebases
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build complete applications using natural language. Powered by Aider AI, 
            designed to handle enterprise-scale projects with ease.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                Get Started Free
                <Sparkles className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/kalyank1144/stackbird" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Code2 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Intelligent Code Generation</CardTitle>
              <CardDescription>
                Generate complete features, fix bugs, and refactor code using natural language prompts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Database className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Large Codebase Support</CardTitle>
              <CardDescription>
                Unlike other tools, Stackbird handles million+ line projects with intelligent context management.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Real-Time Collaboration</CardTitle>
              <CardDescription>
                See AI-generated code in real-time with live preview and instant feedback.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader className="text-center space-y-4 py-12">
            <CardTitle className="text-4xl">Ready to Build Faster?</CardTitle>
            <CardDescription className="text-white/90 text-lg">
              Join developers who are shipping 10x faster with AI-powered code generation.
            </CardDescription>
            <Button size="lg" variant="secondary" asChild className="mt-4">
              <a href={getLoginUrl()}>
                Start Building Now
              </a>
            </Button>
          </CardHeader>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t">
        <p>© 2025 {APP_TITLE}. Built with Aider AI.</p>
      </footer>
    </div>
  );
}
