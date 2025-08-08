import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
} 