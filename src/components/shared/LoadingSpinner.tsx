import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeConfig = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export function LoadingSpinner({
  size = "md",
  className,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex items-center justify-center", fullScreen ? "min-h-screen" : "")}>
      <div className="flex flex-col items-center space-y-3">
        <Loader2 
          className={cn(
            "animate-spin text-primary",
            sizeConfig[size],
            className
          )}
        />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Specialized loading components for common use cases
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <LoadingSpinner
      size="lg"
      text={text}
      fullScreen={false}
      className="text-primary"
    />
  );
}

export function ButtonLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" />
      {text && <span>{text}</span>}
    </div>
  );
}

export function CardLoader({ text = "Loading content..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

// Loading skeleton for lists/cards
export function LoadingSkeleton({ 
  lines = 3,
  className 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-muted rounded animate-pulse",
            i === 0 && "w-3/4",
            i === 1 && "w-1/2", 
            i === 2 && "w-5/6"
          )}
        />
      ))}
    </div>
  );
}