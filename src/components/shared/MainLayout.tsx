import { AuthProvider, useAuth } from "@/lib/auth.tsx";
import { ErrorBoundary } from "./ErrorBoundary";
import { Navigation } from "./Navigation";
import { ToastProvider } from "./Toast";
import { UserMenu } from "./UserMenu";

interface MainLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

// Content wrapper that handles authenticated/unauthenticated states
function MainLayoutContent({ children, currentPath }: MainLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Loading state - czekaj na załadowanie sesji nawet na stronie głównej
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

  // Strona główna nie wymaga autoryzacji, ale czeka na sesję
  if (currentPath === "/") {
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

            {/* Navigation - ZAWSZE widoczne */}
            <nav className="flex items-center space-x-4">
              <a href="/generate" className="text-sm font-medium hover:text-primary transition-colors">
                Generate
              </a>
              <a href="/learn" className="text-sm font-medium hover:text-primary transition-colors">
                Learn
              </a>
              <a href="/manage" className="text-sm font-medium hover:text-primary transition-colors">
                Manage
              </a>
            </nav>

            {/* User Menu - pokazuj tylko gdy użytkownik jest zalogowany */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <UserMenu />
                </div>
                <div className="sm:hidden">
                  <UserMenu />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <a href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                  Sign In
                </a>
                <a href="/auth/register" className="text-sm font-medium hover:text-primary transition-colors">
                  Sign Up
                </a>
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

  // Jeśli użytkownik nie jest zalogowany, pokaż komunikat o wymaganej autoryzacji
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
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
        </div>
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
          <div className="flex items-center space-x-4">
            <Navigation currentPath={currentPath} />
            <div className="hidden sm:block">
              <UserMenu />
            </div>
          </div>

          {/* Mobile User Menu - show only when authenticated */}
          <div className="sm:hidden">
            <UserMenu />
          </div>
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
export function MainLayout({ children, currentPath }: MainLayoutProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <MainLayoutContent currentPath={currentPath}>
            {children}
          </MainLayoutContent>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}