import type { ReactNode } from "react";

interface GenerateLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function GenerateLayout({ children, title = "Generate Flashcards", subtitle }: GenerateLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">10x</span>
            </div>
            <span className="font-semibold text-xl">Cards</span>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-lg">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
} 