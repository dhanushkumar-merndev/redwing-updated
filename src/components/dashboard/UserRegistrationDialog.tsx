"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFromDB, saveToDB } from "@/lib/db";
import { encryptName, decryptName } from "@/lib/crypto";

export default function UserRegistrationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkIdentity = async () => {
      const encrypted = await getFromDB();
      if (!encrypted) {
        setIsOpen(true);
      } else {
        const decrypted = await decryptName(String(encrypted));
        if (!decrypted) {
          setIsOpen(true);
        }
      }
    };
    checkIdentity();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;

    setIsSubmitting(true);
    try {
      const encrypted = await encryptName(trimmed);
      await saveToDB(encrypted);
      setIsOpen(false);
      // Reload to ensure all components get the new identity
      window.location.reload();
    } catch (error) {
      console.error("Failed to save identity:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[425px] rounded-3xl pt-10"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-zinc-900 text-center">Identity Required</DialogTitle>
          <DialogDescription className="text-zinc-500 text-center pt-2">
            Please provide your name to continue. Your actions will be securely logged in the hiring dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 pb-2">
          <div className="space-y-2">
            <label htmlFor="user-name" className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
              Your Full Name
            </label>
            <Input
              id="user-name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 px-4 font-medium transition-all focus:ring-primary/20"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || name.trim().length < 2}
              className="w-full h-12 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Securing Identity..." : "Continue to Dashboard"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
