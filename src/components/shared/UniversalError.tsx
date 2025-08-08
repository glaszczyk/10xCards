import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UniversalErrorProps } from "@/types";
import { AlertTriangle, Home, RefreshCw, Wifi } from "lucide-react";

const errorConfig = {
  404: {
    title: "Page Not Found",
    defaultMessage: "The page you're looking for doesn't exist.",
    icon: Home,
    showHomeButton: true,
  },
  500: {
    title: "Internal Server Error", 
    defaultMessage: "Something went wrong on our end. Please try again later.",
    icon: AlertTriangle,
    showHomeButton: true,
  },
  network: {
    title: "Network Error",
    defaultMessage: "Unable to connect to the server. Please check your internet connection.",
    icon: Wifi,
    showHomeButton: false,
  },
  generic: {
    title: "Oops! Something went wrong",
    defaultMessage: "An unexpected error occurred. Please try again.",
    icon: AlertTriangle,
    showHomeButton: false,
  },
};

export function UniversalError({
  errorType,
  message,
  showRetry = true,
  onRetry,
}: UniversalErrorProps) {
  const config = errorConfig[errorType];
  const Icon = config.icon;
  const errorMessage = message || config.defaultMessage;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry behavior - reload the page
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Icon className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {/* Error Message */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {showRetry && (
              <Button
                onClick={handleRetry}
                variant="default"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
            )}

            {config.showHomeButton && (
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Button>
            )}
          </div>

          {/* Additional Help Text */}
          <div className="text-sm text-muted-foreground">
            {errorType === "network" && (
              <p>Please check your internet connection and try again.</p>
            )}
            {errorType === "500" && (
              <p>Our team has been notified and is working on a fix.</p>
            )}
            {errorType === "404" && (
              <p>The page may have been moved or deleted.</p>
            )}
            {errorType === "generic" && (
              <p>If this problem persists, please contact support.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}