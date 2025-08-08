import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">10x</span>
            </div>
            <span className="font-semibold text-xl">Cards</span>
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; 2024 10xCards. AI-powered flashcard learning platform.</p>
        </div>
      </div>
    </div>
  );
} 