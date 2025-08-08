import { Button } from "@/components/ui/button";
import { signOut, useAuth } from "@/lib/auth.tsx";
import { LogOut, User } from "lucide-react";
import { useState } from "react";

export function UserMenu() {
  const { user, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // TODO: Na kolejnym etapie - implement redirect logic to /auth/login
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {/* User Avatar/Info */}
      <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-muted">
        <User className="h-4 w-4" />
        <span className="text-sm font-medium text-muted-foreground">
          {user.email}
        </span>
      </div>

      {/* Sign Out Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={isLoggingOut}
        className="flex items-center space-x-1"
      >
        <LogOut className="h-4 w-4" />
        <span>{isLoggingOut ? "Logging out..." : "Sign Out"}</span>
      </Button>
    </div>
  );
}