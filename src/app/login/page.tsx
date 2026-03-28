"use client";

import { useTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("Invalid password. Please try again.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 ">
      <Card className="w-full max-w-md shadow-xl pt-12 pb-6">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-3 flex-col">
            <img
              src="/image.webp"
              alt="Tansi Motors Logo"
              className="h-18 w-18 rounded-lg object-contain"
            />
            <div>
              <CardTitle className="text-xl font-bold text-zinc-900">TANSI MOTORS</CardTitle>
              <CardDescription className="text-xs font-medium tracking-widest text-zinc-500">
                HIRING DASHBOARD
              </CardDescription>
            </div>
          </div>
          <p className="text-sm text-zinc-500">Enter your password to access the dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Enter dashboard password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                disabled={isPending}
                autoFocus
              />
              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-primary text-white hover:bg-zinc-800"
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
