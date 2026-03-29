"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SessionErrorDialogProps {
  consecutive404Count: number;
}

/**
 * A critical error dialog that appears when multiple consecutive 404 errors occur.
 * This triggers a full logout flow, clearing both the localized identity 
 * and the secure session cookie before redirecting to login.
 */
export default function SessionErrorDialog({ consecutive404Count }: SessionErrorDialogProps) {
  const isOpen = consecutive404Count >= 3;

  const handleResetSession = async () => {
    try {
      toast.loading("Ending session...", { id: "session-reset" });

      // 1. Clear the secure session cookie via the Auth API
      // Note: We are NOT clearing IndexedDB (identity) as requested.
      await fetch("/api/auth", { method: "DELETE" });
      
      toast.success("Session Cleared", {
        id: "session-reset",
        description: "Redirecting you to the login page...",
      });

      // 3. Redirect to the login page
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (error) {
      console.error("Failed to perform logout:", error);
      toast.error("Critical Error", {
        id: "session-reset",
        description: "Could not safely reset session. Please clear your cookies manually.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[440px] rounded-[2.5rem] shadow-2xl border-none outline-none overflow-hidden"
        showCloseButton={false}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500">
        </div>

        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500/5 rounded-3xl flex items-center justify-center mt-3 mb-2">
            <AlertCircle className="w-8 h-8 text-red-500/80" />
          </div>
          <DialogTitle className="text-2xl font-black text-center text-foreground tracking-tight">
            Connection Lost
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground font-medium leading-relaxed px-2">
            We&apos;ve encountered <span className="text-red-500 font-bold">{consecutive404Count} consecutive failures</span> while syncing your data. 
            Your session has likely expired or is no longer valid.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/30 rounded-2xl p-4 my-6 border border-border/50">
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            Automatic recovery failed.
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleResetSession}
            className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] group"
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Logout & Re-login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
