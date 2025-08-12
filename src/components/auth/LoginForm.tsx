import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseClient } from "@/db/supabase.client";
import { signIn, signInWithOtp, useAuth, verifyOtp } from "@/lib/auth";
import type { LoginState } from "@/types";
import { useState } from "react";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { refreshProfile } = useAuth();
  
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
  const [otpCode, setOtpCode] = useState("");

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

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail) return;

    setMagicLinkStatus("loading");
    try {
      await signInWithOtp(magicLinkEmail);
      setMagicLinkStatus("success");
      // Don't clear magicLinkEmail - we need it for verification
    } catch (error) {
      setMagicLinkStatus("error");
    }
  };

  const handleVerifyOtp = async () => {
    console.log("handleVerifyOtp called with:", { otpCode, magicLinkEmail });
    
    if (!otpCode || !magicLinkEmail) {
      console.log("Missing otpCode or magicLinkEmail");
      return;
    }

    try {
      console.log("Calling verifyOtp...");
      const result = await verifyOtp(magicLinkEmail, otpCode);
      console.log("OTP verification result:", result);
      
      // Successfully authenticated
      console.log("OTP verification successful, redirecting...");
      
      // Check if session is set
      const { data: { session } } = await supabaseClient.auth.getSession();
      console.log("Current session after OTP:", session);
      
      if (session?.user) {
        console.log("User is authenticated:", session.user.email);
        
        // Refresh the auth context to update the UI
        try {
          await refreshProfile();
          console.log("Profile refreshed successfully");
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
        
        if (onSuccess) {
          console.log("Calling onSuccess callback...");
          onSuccess();
        } else {
          // Redirect to main page if no onSuccess callback
          console.log("No onSuccess callback, redirecting to /generate...");
          
          // Redirect immediately
          console.log("Redirecting now...");
          window.location.href = "/generate";
        }
      } else {
        console.error("No session found after OTP verification");
        // Try to refresh the page to trigger auth state update
        window.location.reload();
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      // You could add error handling here
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
          {showMagicLink ? "Ukryj" : "Zaloguj się kodem OTP"}
        </button>

        {showMagicLink && (
          <div className="mt-4 space-y-4">
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
              type="button"
              onClick={handleOtp}
              disabled={magicLinkStatus === "loading"}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {magicLinkStatus === "loading" ? "Wysyłanie..." : "Wyślij kod OTP"}
            </button>

            {magicLinkStatus === "success" && (
              <div className="space-y-4">
                <p className="text-sm text-green-600 text-center">
                  Kod OTP został wysłany! Sprawdź swój email i wpisz kod poniżej.
                </p>
                
                <div>
                  <label
                    htmlFor="otp-code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Kod OTP
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                    placeholder="123456"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Weryfikuj kod OTP
                </button>
              </div>
            )}

            {magicLinkStatus === "error" && (
              <p className="text-sm text-red-600 text-center">
                Wystąpił błąd. Spróbuj ponownie.
              </p>
            )}
          </div>
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