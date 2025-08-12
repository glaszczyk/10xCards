import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signInWithMagicLink } from "@/lib/auth";
import type { LoginState } from "@/types";
import { useState } from "react";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [state, setState] = useState<LoginState>({
    status: "idle",
    error: null,
    formData: { email: "", password: "" },
  });

  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkStatus, setMagicLinkStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleInputChange = (field: keyof LoginState["formData"]) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: e.target.value },
      error: null, // Clear error when user starts typing
    }));
  };

  const validateForm = (): boolean => {
    const { email, password } = state.formData;
    
    if (!email) {
      setState(prev => ({ ...prev, error: "Email is required" }));
      return false;
    }
    
    if (!email.includes("@")) {
      setState(prev => ({ ...prev, error: "Please enter a valid email address" }));
      return false;
    }
    
    if (!password) {
      setState(prev => ({ ...prev, error: "Password is required" }));
      return false;
    }
    
    if (password.length < 6) {
      setState(prev => ({ ...prev, error: "Password must be at least 6 characters" }));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setState(prev => ({ ...prev, status: "loading", error: null }));

    try {
      const data = await signIn(state.formData.email, state.formData.password);
      
      if (data.user) {
        setState(prev => ({ ...prev, status: "success" }));
        if (onSuccess) onSuccess();
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Login failed. Please try again.",
      }));
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail) return;

    setMagicLinkStatus("loading");
    try {
      await signInWithMagicLink(magicLinkEmail);
      setMagicLinkStatus("success");
      setMagicLinkEmail("");
    } catch (error) {
      setMagicLinkStatus("error");
    }
  };

  const isSubmitting = state.status === "loading";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="text"
          placeholder="Enter your email"
          value={state.formData.email}
          onChange={handleInputChange("email")}
          disabled={isSubmitting}
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={state.formData.password}
          onChange={handleInputChange("password")}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Enter your password to access your account
        </p>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <LoadingSpinner size="sm" text="Signing in..." />
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Magic Link Section */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowMagicLink(!showMagicLink)}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          {showMagicLink ? "Ukryj" : "Zaloguj się magic linkiem"}
        </button>

        {showMagicLink && (
          <form onSubmit={handleMagicLink} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="magic-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="magic-email"
                type="email"
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="twój@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={magicLinkStatus === "loading"}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {magicLinkStatus === "loading" ? "Wysyłanie..." : "Wyślij magic link"}
            </button>

            {magicLinkStatus === "success" && (
              <p className="text-sm text-green-600 text-center">
                Magic link został wysłany! Sprawdź swój email.
              </p>
            )}

            {magicLinkStatus === "error" && (
              <p className="text-sm text-red-600 text-center">
                Wystąpił błąd. Spróbuj ponownie.
              </p>
            )}
          </form>
        )}
      </div>

      {/* Links */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a 
            href="/auth/register" 
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </a>
        </p>
        
        <p className="text-sm text-muted-foreground">
          <a 
            href="/auth/forgot-password" 
            className="text-primary hover:underline"
          >
            Forgot your password?
          </a>
        </p>
      </div>
    </form>
  );
} 