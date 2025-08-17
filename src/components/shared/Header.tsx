import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { BookOpen, Home, Plus, Settings } from "lucide-react";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  currentPage?: "home" | "generate" | "learn" | "manage";
}

export function Header({ currentPage }: HeaderProps) {
  const { isAuthenticated } = useAuth();
  
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/generate", label: "Generate", icon: Plus },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/manage", label: "Manage", icon: Settings },
  ];

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-4">
          <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">10x</span>
            </div>
            <span className="hidden sm:inline font-semibold text-lg">Cards</span>
          </a>
        </div>

        {/* Navigation - pokazuj tylko gdy użytkownik jest zalogowany */}
        {isAuthenticated && (
          <nav className="flex items-center space-x-1" data-testid="main-navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.href.slice(1) || (currentPage === "home" && item.href === "/");
              
              return (
                <a key={item.href} href={item.href} className="rounded-md transition-colors">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </a>
              );
            })}
          </nav>
        )}

        {/* User Menu - pokazuj tylko gdy użytkownik jest zalogowany */}
        {isAuthenticated && (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <UserMenu />
            </div>
            <div className="sm:hidden">
              <UserMenu />
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 