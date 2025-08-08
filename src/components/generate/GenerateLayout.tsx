import { Header } from "@/components/shared/Header";
import type { ReactNode } from "react";

interface GenerateLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function GenerateLayout({ children, title = "Generate Flashcards", subtitle }: GenerateLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header currentPage="generate" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
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