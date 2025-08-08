import { Button } from "@/components/ui/button";
import { Brain, Plus, Settings } from "lucide-react";

interface NavigationProps {
  currentPath?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: "/generate",
    label: "Generate", 
    icon: Plus,
    description: "Create new flashcards with AI",
  },
  {
    href: "/learn",
    label: "Learn",
    icon: Brain,
    description: "Study your flashcards",
  },
  {
    href: "/manage",
    label: "Manage", 
    icon: Settings,
    description: "Edit and organize flashcards",
  },
];

export function Navigation({ currentPath }: NavigationProps) {
  const isActive = (href: string) => {
    if (!currentPath) return false;
    return currentPath === href || currentPath.startsWith(href + "/");
  };

  return (
    <nav className="flex items-center space-x-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <a
            key={item.href}
            href={item.href}
            title={item.description}
            className="rounded-md transition-colors"
          >
            <Button
              variant={active ? "default" : "ghost"}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          </a>
        );
      })}
    </nav>
  );
}