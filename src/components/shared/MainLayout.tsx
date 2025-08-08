import { Card } from "@/components/ui/card";
import { AuthProvider, useAuth } from "@/lib/auth.tsx";
import { ErrorBoundary } from "./ErrorBoundary";
import { Navigation } from "./Navigation";
import { ToastProvider } from "./Toast";
import { UserMenu } from "./UserMenu";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  showAuthRequired?: boolean;
}

// Content wrapper that handles authenticated/unauthenticated states
function MainLayoutContent({ children, currentPath, showAuthRequired }: MainLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state for protected routes
  if (showAuthRequired && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to access this feature.
          </p>
          <a 
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Sign In
          </a>
        </Card>
      </div>
    );
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">10x</span>
              </div>
              <span className="hidden sm:inline font-semibold text-lg">Cards</span>
            </a>
          </div>

          {/* Navigation - show only when authenticated */}
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <Navigation currentPath={currentPath} />
              <div className="hidden sm:block">
                <UserMenu />
              </div>
            </div>
          )}

          {/* Mobile User Menu - show only when authenticated */}
          {isAuthenticated && (
            <div className="sm:hidden">
              <UserMenu />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 10xCards. AI-powered flashcard learning platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main Layout component with all providers
export function MainLayout({ children, currentPath, showAuthRequired = false }: MainLayoutProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <MainLayoutContent 
            currentPath={currentPath} 
            showAuthRequired={showAuthRequired}
          >
            {children}
          </MainLayoutContent>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}