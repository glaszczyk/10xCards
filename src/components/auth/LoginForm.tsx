import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      // TODO: Na przyszłość - implementacja logiki logowania z Supabase
      // const { data, error } = await signIn(state.formData.email, state.formData.password);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success
      setState(prev => ({ ...prev, status: "success" }));
      
      // TODO: Na przyszłość - przekierowanie do /generate
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Login failed. Please try again.",
      }));
      
      // TODO: Na przyszłość - dodać toast notification
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