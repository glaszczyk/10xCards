import type { ReactNode } from "react";

interface GenerateLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function GenerateLayout({ children, title = "Generate Flashcards", subtitle }: GenerateLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center">
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
  );
} 