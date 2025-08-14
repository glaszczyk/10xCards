import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth";
import type { RegisterState } from "@/types";
import { useState } from "react";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [state, setState] = useState<RegisterState>({
    status: "idle",
    error: null,
    formData: { email: "", password: "", confirmPassword: "" },
    validationErrors: {},
  });

  const handleInputChange = (field: keyof RegisterState["formData"]) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: e.target.value },
      error: null,
    }));
  };

  const validateForm = (): boolean => {
    const { email, password, confirmPassword } = state.formData;

    // Email validation
    if (!email) {
      setState(prev => ({ ...prev, error: "Email is required" }));
      return false;
    } else if (!email.includes("@")) {
      setState(prev => ({ ...prev, error: "Please enter a valid email address" }));
      return false;
    }

    // Password validation
    if (!password) {
      setState(prev => ({ ...prev, error: "Password is required" }));
      return false;
    } else if (password.length < 6) {
      setState(prev => ({ ...prev, error: "Password must be at least 6 characters" }));
      return false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setState(prev => ({ ...prev, error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" }));
      return false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      setState(prev => ({ ...prev, error: "Please confirm your password" }));
      return false;
    } else if (password !== confirmPassword) {
      setState(prev => ({ ...prev, error: "Passwords do not match" }));
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
      const data = await signUp(state.formData.email, state.formData.password);
      
      if (data.user) {
        setState(prev => ({ ...prev, status: "success" }));
        if (onSuccess) onSuccess();
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Registration failed. Please try again.",
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

      {/* Success Alert */}
      {state.status === "success" && (
        <Alert>
          <AlertDescription>
            Konto zostało utworzone! Sprawdź swój email, aby potwierdzić rejestrację.
          </AlertDescription>
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
          placeholder="Create a password"
          value={state.formData.password}
          onChange={handleInputChange("password")}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Must be at least 6 characters with uppercase, lowercase, and number
        </p>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={state.formData.confirmPassword}
          onChange={handleInputChange("confirmPassword")}
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <LoadingSpinner size="sm" text="Creating account..." />
        ) : (
          "Create Account"
        )}
      </Button>

      {/* Links */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a 
            href="/auth/login" 
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
} 