import { useState } from "react";
import { useAuth } from "../lib/auth-store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Lock } from "lucide-react";

export function AppLockOverlay() {
  const { auth, isAuthenticated, loading, login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (loading || !auth || !auth.isEnabled || isAuthenticated) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(pin)) {
      setError(false);
      setPin("");
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-8 w-8 text-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">App Locked</h1>
          <p className="text-sm text-muted-foreground">
            Enter your PIN to access your financial data
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={`text-center text-lg tracking-[0.5em] ${error ? 'border-destructive' : ''}`}
            autoFocus
          />
          {error && (
            <p className="text-xs font-medium text-destructive">Incorrect PIN. Try again.</p>
          )}
          <Button type="submit" className="w-full">
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
}
