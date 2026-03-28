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
  CheckCircle2,
  ChevronRight,
  History
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Applicant, ApplicantStatus } from "@/types";
import { scrollToPosition } from "@/lib/lenis";

interface ApplicantCardProps {
  applicant: Applicant;
  onSave: (id: string, data: Partial<Applicant>, onComplete: () => void) => void;
  isPending: boolean;
  index: number;
}

const statusConfig: Record<ApplicantStatus, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string; 
  activeBorder: string;
  activeBg: string;
  icon: React.ElementType 
}> = {
  pending: { 
    label: "Pending", 
    color: "text-amber-600", 
    bgColor: "bg-amber-50", 
    borderColor: "border-amber-100",
    activeBorder: "ring-2 ring-amber-500/20 border-amber-500",
    activeBg: "bg-amber-50/50",
    icon: CircleDashed 
  },
  rejected: { 
    label: "Rejected", 
    color: "text-red-600", 
    bgColor: "bg-red-50", 
    borderColor: "border-red-100",
    activeBorder: "ring-2 ring-red-500/20 border-red-500",
    activeBg: "bg-red-50/50",
    icon: XCircle 
  },
  interested: { 
    label: "Interested", 
    color: "text-emerald-600", 
    bgColor: "bg-emerald-50", 
    borderColor: "border-emerald-100",
    activeBorder: "ring-2 ring-emerald-500/20 border-emerald-500",
    activeBg: "bg-emerald-50/50",
    icon: CheckCircle 
  },
  inprocess: { 
    label: "In Process", 
    color: "text-blue-600", 
    bgColor: "bg-blue-50", 
    borderColor: "border-blue-100",
    activeBorder: "ring-2 ring-blue-500/20 border-blue-500",
    activeBg: "bg-blue-50/50",
    icon: RefreshCw 
  },
};

export const ApplicantCard = memo(function ApplicantCard({ applicant, onSave, isPending, index }: ApplicantCardProps) {
  const [formData, setFormData] = useState<Partial<Applicant>>({
    status: applicant.status,
    feedback: applicant.feedback,
  });

  const [isNameOpen, setIsNameOpen] = useState(false);

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
      const statusLabel = formData.status ? statusConfig[formData.status].label : "Updated";
      const message = `Successfully updated ${applicant.full_name}`;
      const description = `Record moved to ${statusLabel}`;
      
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
      <Card className="group relative shadow-sm border-border/50 p-2 bg-card transition-all duration-300 hover:shadow-md hover:shadow-primary/5 hover:border-primary/40 flex flex-col h-full overflow-hidden">
        
        <CardHeader className="p-4 pb-3 space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Popover open={isNameOpen} onOpenChange={setIsNameOpen}>
                <PopoverTrigger
                  onPointerEnter={() => setIsNameOpen(true)}
                  onPointerLeave={() => setIsNameOpen(false)}
                  className="text-left outline-none group/name block w-full bg-transparent border-none p-0"
                >
                  <span className="text-md md:text-lg font-bold tracking-tight truncate block text-primary transition-colors cursor-help">
                    {applicant.full_name}
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-2.5 text-xs font-bold shadow-xl border-primary/10 rounded-lg pointer-events-none">
                  {applicant.full_name}
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] md:text-[10px] font-bold text-zinc-400">#{applicant.id}</span>
                <span className="text-zinc-200">/</span>
                <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 truncate uppercase tracking-wider">{applicant.position}</span>
              </div>
            </div>
            <Badge className={cn(
              "shadow-none text-[10px] font-bold px-2.5 py-0.5 shrink-0 border uppercase tracking-wider flex items-center gap-1 rounded-full whitespace-nowrap transition-colors",
              currentStatus.bgColor, currentStatus.color, currentStatus.borderColor
            )}>
              <CurrentStatusIcon className="w-3 h-3" />
              {currentStatus.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-4">
          
          <div className="flex flex-col rounded-xl border border-border/20 divide-y divide-zinc-100 bg-zinc-50/50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-2.5 hover:bg-white transition-colors">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="p-1.5 bg-white rounded-full border border-zinc-200 shrink-0 text-zinc-400 shadow-sm">
                  <Phone className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-black text-zinc-900 truncate">{applicant.phone}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 cursor-pointer px-5 text-[11px] font-black border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 shrink-0 rounded-full shadow-sm"
                onClick={() => window.location.href = `tel:${applicant.phone}`}
              >
                Call
              </Button>
            </div>

            <div className="flex items-center justify-between p-2.5 hover:bg-white transition-colors">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="p-1.5 bg-white rounded-full border border-zinc-200 shrink-0 text-zinc-400 shadow-sm">
                  <Mail className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-black text-zinc-900 truncate">{applicant.email}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 cursor-pointer px-5 text-[11px] font-black border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 shrink-0 rounded-full shadow-sm"
                onClick={() => window.location.href = `mailto:${applicant.email}`}
              >
                Mail
              </Button>
            </div>

            <div className="flex items-center justify-between p-2.5 hover:bg-white transition-colors">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="p-1.5 bg-white rounded-full border border-zinc-200 shrink-0 text-zinc-400 shadow-sm">
                  <Calendar className="w-3 h-3" />
                </div>
                <span className="text-[12px] font-bold text-zinc-500 truncate">
                  Applied {applicant.created_time ? format(new Date(applicant.created_time), "dd MMM yyyy") : "—"}
                </span>
              </div>
              <div className="h-8 px-4 flex items-center justify-center text-[11px] font-black bg-white/80 text-zinc-500 shrink-0 rounded-full border border-zinc-200 shadow-sm">
                {applicant.created_time ? format(new Date(applicant.created_time), "hh:mm a") : "--:--"}
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-100/30 border border-zinc-200/50 shadow-inner">
            <Label className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.1em] px-1 block">
              Quick Decision
            </Label>

            <div className="grid grid-cols-3 gap-1.5">
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
                      "h-10 cursor-pointer px-2 text-[10px] font-black rounded-full transition-all border border-transparent shadow-sm",
                      isSelected
                        ? `${config.activeBg} ${config.color} ${config.activeBorder} shadow-inner`
                        : "bg-zinc-100/50 text-zinc-600 hover:bg-white hover:border-zinc-200"
                    )}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: isSelected ? "pending" : s,
                      }))
                    }
                    disabled={isPending}
                  >
                    <StatusIcon className="w-3.5 h-3.5 mr-1.5 opacity-80" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 mt-auto">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.1em] flex items-center gap-1.5">
                <MessageSquare size={14} className="opacity-60" />
                Notes
              </Label>
              <span className={cn(
                "text-[10px] font-black",
                String(formData.feedback ?? "").length > 250 ? "text-red-500" : "text-zinc-300"
              )}>
                {String(formData.feedback ?? "").length}/300
              </span>
            </div>
            <Textarea
              value={formData.feedback}
              onChange={(e) => setFormData((prev) => ({ ...prev, feedback: e.target.value.slice(0, 300) }))}
              placeholder="Internal hiring notes..."
              className="min-h-[90px] text-[13px] font-bold resize-none border-zinc-200 focus-visible:ring-primary/10 bg-white placeholder:text-zinc-300 leading-relaxed rounded-2xl shadow-sm"
              disabled={isPending}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 mt-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-black">
                <Clock className="w-3 h-3" />
                {applicant.updated.length > 0
                  ? format(new Date(applicant.updated[applicant.updated.length - 1]), "dd MMM")
                  : "New Lead"}
              </div>
              
              <Dialog>
                <DialogTrigger className="text-[10px] text-primary font-black text-left outline-none hover:underline flex items-center gap-1 transition-all cursor-pointer">
                  {applicant.updated.length} logs
                  <ChevronRight size={12} strokeWidth={3} />
                </DialogTrigger>
                <DialogContent className="max-w-xs rounded-3xl p-6 border-none shadow-2xl overflow-hidden">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm">
                      <History size={16} />
                      Log History
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[350px] overflow-y-auto pr-2 pl-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                    {applicant.updated.length > 0 ? (
                      applicant.updated.slice().reverse().map((dateString, i) => (
                        <div key={i} className="relative pl-6 pb-4 border-l-2 border-zinc-100 last:border-0 last:pb-0">
                          <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white shadow-sm flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-black text-zinc-900">
                              {format(new Date(dateString), "dd MMMM yyyy")}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400">
                              {format(new Date(dateString), "hh:mm a")}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-400 italic font-medium py-10 text-center">No history logs yet.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              size="lg"
              className={cn(
                "h-11 px-8 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg rounded-full",
                hasChanges && !isPending 
                  ? "bg-primary text-white shadow-primary/30 hover:shadow-primary/40 hover:translate-y-[-1px]" 
                  : "bg-zinc-100 text-zinc-400 shadow-none border border-zinc-200"
              )}
            >
              {isPending ? (
                <RefreshCw size={14} className="animate-spin mr-2" />
              ) : (
                <Save size={14} className="mr-2" />
              )}
              {isPending ? "UPDATING" : "SAVE LEAD"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default ApplicantCard;