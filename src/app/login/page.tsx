"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        if (res.ok) {
          router.push("/");
          router.refresh();
        } else {
          setError("Invalid password");
        }
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary px-4 ">
      <Card className="w-full max-w-md shadow-xl pt-12 pb-6 md:px-5 md:pb-12">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-3 flex-col">
            <img
              src="/image.webp"
              alt="Tansi Motors Logo"
              className="h-18 w-18 md:h-20 md:w-20 rounded-lg object-contain"
            />
            <div>
              <CardTitle className="text-xl font-bold text-primary/90">TANSI MOTORS</CardTitle>
              <CardDescription className="text-xs font-medium tracking-widest text-muted-foreground">
                HIRING DASHBOARD
              </CardDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Enter your password to access the dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter dashboard password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10 focus-visible:ring-1 transition-all"
                  disabled={isPending}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isPending}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/80 active:scale-[0.98] transition-all"
              disabled={isPending || !password}
            >
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
