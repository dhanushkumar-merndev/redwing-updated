"use client";

import { useState, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Save, 
  CircleDashed, 
  XCircle, 
  CheckCircle, 
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Applicant, ApplicantStatus } from "@/types";
import { scrollToPosition } from "@/lib/lenis";

interface ApplicantCardProps {
  applicant: Applicant;
  onSave: (id: string, data: Partial<Applicant>, onComplete: () => void) => void;
  isPending: boolean;
  index: number;
}

const statusConfig: Record<ApplicantStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "text-chart-1", bgColor: "bg-chart-1/15", borderColor: "border-chart-1/20", icon: CircleDashed },
  rejected: { label: "Rejected", color: "text-chart-2", bgColor: "bg-chart-2/15", borderColor: "border-chart-2/20", icon: XCircle },
  interested: { label: "Interested", color: "text-chart-3", bgColor: "bg-chart-3/15", borderColor: "border-chart-3/20", icon: CheckCircle },
  inprocess: { label: "In Process", color: "text-chart-4", bgColor: "bg-chart-4/15", borderColor: "border-chart-4/20", icon: RefreshCw },
};

export const ApplicantCard = memo(function ApplicantCard({ applicant, onSave, isPending, index }: ApplicantCardProps) {
  const [formData, setFormData] = useState<Partial<Applicant>>({
    status: applicant.status,
    feedback: applicant.feedback,
  });

  // State to handle hover interactions for the Popover
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const hasChanges = useMemo(() => {
    return formData.status !== applicant.status || formData.feedback !== applicant.feedback;
  }, [formData, applicant]);

  const handleSave = () => {
    const hasFeedback = (formData.feedback ?? "").trim().length > 0;
    const hasStatus = formData.status !== "pending";

    if (!hasStatus) {
      toast.error("Decision Required", {
        description: `Please select a status for ${applicant.full_name} before saving.`,
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });
      return;
    }

    if (!hasFeedback) {
      toast.error("Feedback Required", {
        description: `Please enter a quick note or feedback for ${applicant.full_name}.`,
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });
      return;
    }

    const savedScrollY = window.scrollY;
    onSave(applicant.id, formData, () => {
      // Context-aware toasts
      const statusLabel = formData.status ? statusConfig[formData.status].label : "Updated";
      let message = `Successfully updated ${applicant.full_name}`;
      let description = `Record moved to ${statusLabel}`;
      
      if (formData.status === "rejected") {
        message = `Rejected ${applicant.full_name}`;
        description = "Candidate has been marked as rejected.";
      } else if (formData.status === "interested") {
        message = `Added to Interested`;
        description = `${applicant.full_name} is now in the preferred list.`;
      } else if (formData.status === "inprocess") {
        message = `In Process: ${applicant.full_name}`;
        description = "Candidate workflow has been updated.";
      }

      toast.success(message, {
        description,
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      });
      setTimeout(() => scrollToPosition(savedScrollY), 50);
    });
  };

  const currentStatus = statusConfig[applicant.status];
  const CurrentStatusIcon = currentStatus.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ 
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4, delay: Math.min(index * 0.05, 0.3) },
        y: { duration: 0.4, delay: Math.min(index * 0.05, 0.3) }
      }}
    >
      <Card className="group relative shadow-sm border-border/50 bg-card transition-all duration-300 hover:shadow-md hover:shadow-primary/5 hover:border-primary/40 flex flex-col h-full overflow-hidden">
        
        {/* Header Section */}
        <CardHeader className="p-4 pb-3 space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Popover>
                <PopoverTrigger className="text-left outline-none group/name block">
                  <span className="text-base font-bold tracking-tight text-foreground truncate max-w-[190px] block group-hover/name:text-primary transition-colors">
                    {applicant.full_name}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 text-xs font-semibold shadow-xl border-primary/10">
                  {applicant.full_name}
                </PopoverContent>
              </Popover>
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                  <span>#{applicant.id}</span>
                  <span className="text-zinc-200">/</span>
                  <span className="truncate">{applicant.position}</span>
                </div>
              </div>
            </div>
            <Badge className={cn(
              "shadow-none text-[10px] font-bold px-2.5 py-0.5 shrink-0 border uppercase tracking-wider flex items-center gap-1 rounded-full",
              currentStatus.bgColor, currentStatus.color, currentStatus.borderColor
            )}>
              <CurrentStatusIcon className="w-3 h-3" />
              {currentStatus.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-4">
          
          {/* Stacked Contact Info Box */}
          <div className="flex flex-col rounded-xl border border-border/40 divide-y divide-border/40 bg-muted/10 overflow-hidden">
            
            {/* Phone Row */}
            <div className="flex items-center justify-between p-2 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="p-1.5 bg-background rounded-full border border-border/50 shrink-0 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-semibold text-foreground truncate">{applicant.phone}</span>
              </div>
              <Button 
                size="sm" 
                className="h-6 cursor-pointer px-3.5 text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-full"
                onClick={() => window.location.href = `tel:${applicant.phone}`}
              >
                Call
              </Button>
            </div>

            {/* Email Row */}
            <div className="flex items-center justify-between p-2 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="p-1.5 bg-background rounded-full border border-border/50 shrink-0 text-muted-foreground">
                  <Mail className="w-3 h-3" />
                </div>
                <Popover>
                  <PopoverTrigger className="text-[11px] font-semibold text-foreground truncate text-left outline-none block hover:text-primary transition-colors">
                    {applicant.email}
                  </PopoverTrigger>
                  <PopoverContent className="p-2 text-xs font-medium">{applicant.email}</PopoverContent>
                </Popover>
              </div>
              <Button 
                size="sm" 
                className="h-6 cursor-pointer px-3.5 text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-full"
                onClick={() => window.location.href = `mailto:${applicant.email}`}
              >
                Mail
              </Button>
            </div>

            {/* Applied Date & Time Row */}
            <div className="flex items-center justify-between p-2 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="p-1.5 bg-background rounded-full border border-border/50 shrink-0 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground/90 truncate">
                  Applied {applicant.created_time ? new Date(applicant.created_time).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
              <div className="h-6 px-3 flex items-center justify-center text-[10px] font-bold bg-background text-muted-foreground shrink-0 rounded-full border border-border/50 shadow-sm">
                {applicant.created_time ? new Date(applicant.created_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </div>
            </div>
          </div>


          {/* Status Decision Section */}
          <div className="space-y-2 p-3 rounded-2xl bg-muted/30">
            <Label className="text-[10px] uppercase font-black text-muted-foreground/80 tracking-widest px-1">
              Update Decision
            </Label>

            <div className="flex flex-wrap gap-1.5">
              {(["rejected", "interested", "inprocess"] as const).map((s) => {
                const isSelected = formData.status === s;
                const config = statusConfig[s];
                const StatusIcon = config.icon;

                return (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm" 
                    className={cn(
                      "h-8 cursor-pointer px-4 text-[11px] font-bold rounded-full transition-all border-2 flex items-center gap-1.5",

                      // ✅ Selected state with proper hover
                      isSelected
                        ? `${config.color} ${config.bgColor} ${config.borderColor} border-current shadow-sm hover:${config.bgColor} hover:brightness-90 hover:${config.color}`
                        : "bg-background text-muted-foreground/60 border-transparent hover:border-primary hover:text-primary hover:bg-primary/5"
                    )}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: isSelected ? "pending" : s,
                      }))
                    }
                    disabled={isPending}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
            {/* Feedback Section */}
          <div className="space-y-1.5 mt-auto">
            <div className="flex justify-between items-center px-0.5">
              <Label className="text-[10px] uppercase font-black text-muted-foreground/80 tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                Notes
              </Label>
              <span className={cn(
                "text-[9px] font-bold tracking-tighter",
                String(formData.feedback ?? "").length > 250 ? "text-destructive" : "text-muted-foreground/40"
              )}>
                {String(formData.feedback ?? "").length}/300
              </span>
            </div>
            <Textarea
              value={formData.feedback}
              onChange={(e) => setFormData((prev) => ({ ...prev, feedback: e.target.value.slice(0, 300) }))}
              placeholder="Candidate feedback..."
              className="min-h-[64px] text-xs resize-none border-border/60 focus-visible:ring-primary/20 bg-background/50 leading-relaxed rounded-xl"
              disabled={isPending}
  
            />
          </div>

          {/* Footer Save Area */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                <Clock className="w-2.5 h-2.5" />
                {applicant.updated.length > 0
                  ? new Date(applicant.updated[applicant.updated.length - 1]).toLocaleDateString()
                  : "New"}
              </div>
              
              {/* Hover Popover for History Logs */}
              <Popover open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <PopoverTrigger 
                  className="text-[9px] text-muted-foreground/50 font-medium text-left outline-none hover:text-primary hover:underline underline-offset-2 transition-colors cursor-help"
                  onMouseEnter={() => setIsHistoryOpen(true)}
                  onMouseLeave={() => setIsHistoryOpen(false)}
                  onClick={() => setIsHistoryOpen(true)}
                >
                  {applicant.updated.length} history logs
                </PopoverTrigger>
                
                <PopoverContent 
                  side="top" 
                  align="start" 
                  className="w-auto p-3 shadow-xl border-primary/10 rounded-xl"
                  onMouseEnter={() => setIsHistoryOpen(true)}
                  onMouseLeave={() => setIsHistoryOpen(false)}
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">
                      Status History
                    </p>
                    <div className="max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                      {applicant.updated.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {[...applicant.updated].reverse().map((dateString, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                              {new Date(dateString).toLocaleString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric", 
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">No history available yet.</p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              size="sm"
              className={cn(
                "h-8 px-5 font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-lg rounded-full",
                hasChanges && !isPending 
                  ? "bg-primary text-primary-foreground shadow-primary/20" 
                  : "bg-muted text-muted-foreground shadow-none"
              )}
            >
              {isPending ? (
                <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
              ) : (
                <Save className="w-3 h-3 mr-1.5" />
              )}
              {isPending ? "Wait" : "Save"}
            </Button>
          </div>
        </CardContent>
        
      </Card>
    </motion.div>
  );
});

export default ApplicantCard;