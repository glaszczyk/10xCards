import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth";
import { useState } from "react";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [state, setState] = useState({
    status: "idle" as "idle" | "loading" | "success" | "error",
    error: null as string | null,
    email: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      email: e.target.value,
      error: null,
    }));
  };

  const validateForm = (): boolean => {
    if (!state.email) {
      setState(prev => ({ ...prev, error: "Email jest wymagany" }));
      return false;
    }
    
    if (!state.email.includes("@")) {
      setState(prev => ({ ...prev, error: "Wprowadź poprawny adres email" }));
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
      await resetPassword(state.email);
      setState(prev => ({ ...prev, status: "success" }));
      if (onSuccess) onSuccess();
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Nie udało się wysłać linku resetowania. Spróbuj ponownie.",
      }));
    }
  };

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            Link do resetowania hasła został wysłany na podany adres email. 
            Sprawdź swoją skrzynkę i kliknij w link, aby zresetować hasło.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.href = "/auth/login"} 
          className="w-full"
        >
          Powrót do logowania
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={state.email}
            onChange={handleInputChange}
            placeholder="twój@email.com"
            required
          />
          <p className="text-xs text-muted-foreground">
            Wprowadź adres email powiązany z Twoim kontem
          </p>
        </div>

        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Wysyłanie linku...
            </>
          ) : (
            "Wyślij link resetowania"
          )}
        </Button>
      </form>

      <div className="text-center">
        <Button 
          variant="link" 
          onClick={() => window.location.href = "/auth/login"}
          className="text-sm"
        >
          Powrót do logowania
        </Button>
      </div>
    </div>
  );
}
