import { Bot, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Animated background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px] animate-pulse [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[80px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <Bot className="h-10 w-10 text-primary-foreground" />
        </div>

        {/* Heading */}
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-foreground">
          Code-Pilot
        </h1>
        <p className="mb-10 text-center text-muted-foreground">
          Automated code reviews powered by AI. Get instant feedback on your
          pull requests before human review.
        </p>

        {/* Login button */}
        <Button
          onClick={login}
          size="lg"
          className="mb-8 w-full gap-3 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          Sign in with GitHub
        </Button>

        {/* Feature cards */}
        <div className="grid w-full grid-cols-3 gap-3">
          {[
            {
              icon: Sparkles,
              title: 'AI-Powered',
              desc: 'Gemini reviews',
            },
            {
              icon: Shield,
              title: 'Security',
              desc: 'Vulnerability scan',
            },
            {
              icon: Zap,
              title: 'Instant',
              desc: '< 60s reviews',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center rounded-xl border bg-card/50 p-4 text-center backdrop-blur-sm transition-all hover:bg-card hover:shadow-md"
            >
              <feature.icon className="mb-2 h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {feature.title}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {feature.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-muted-foreground/60">
          By signing in, you agree to grant repository access for code review.
        </p>
      </div>
    </div>
  );
}
