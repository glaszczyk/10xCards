import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/lib/auth";
import { useState } from "react";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const [state, setState] = useState({
    status: "idle" as "idle" | "loading" | "success" | "error",
    error: null as string | null,
    formData: { password: "", confirmPassword: "" },
  });

  const handleInputChange = (field: keyof typeof state.formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: e.target.value },
      error: null,
    }));
  };

  const validateForm = (): boolean => {
    const { password, confirmPassword } = state.formData;
    
    if (!password) {
      setState(prev => ({ ...prev, error: "Hasło jest wymagane" }));
      return false;
    }
    
    if (password.length < 6) {
      setState(prev => ({ ...prev, error: "Hasło musi mieć co najmniej 6 znaków" }));
      return false;
    }
    
    if (password !== confirmPassword) {
      setState(prev => ({ ...prev, error: "Hasła nie są identyczne" }));
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
      await updatePassword(state.formData.password);
      setState(prev => ({ ...prev, status: "success" }));
      if (onSuccess) onSuccess();
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Nie udało się zresetować hasła. Spróbuj ponownie.",
      }));
    }
  };

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            Hasło zostało pomyślnie zresetowane! Możesz się teraz zalogować używając nowego hasła.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.href = "/auth/login"} 
          className="w-full"
        >
          Przejdź do logowania
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nowe hasło</Label>
          <Input
            id="password"
            type="password"
            value={state.formData.password}
            onChange={handleInputChange("password")}
            placeholder="Wprowadź nowe hasło"
            required
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={state.formData.confirmPassword}
            onChange={handleInputChange("confirmPassword")}
            placeholder="Potwierdź nowe hasło"
            required
            minLength={6}
          />
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
              Resetowanie hasła...
            </>
          ) : (
            "Zresetuj hasło"
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
