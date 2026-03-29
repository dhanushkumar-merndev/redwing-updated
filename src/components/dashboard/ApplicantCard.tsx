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
  ChevronDown,
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

import { useMediaQuery } from "@/hooks/useMediaQuery";

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
    color: "text-chart-1", 
    bgColor: "bg-chart-1/10", 
    borderColor: "border-chart-1/10",
    activeBorder: "ring-2 ring-chart-1/20 border-chart-1",
    activeBg: "bg-chart-1/50",
    icon: CircleDashed 
  },
  rejected: { 
    label: "Rejected", 
    color: "text-chart-2", 
    bgColor: "bg-chart-2/10", 
    borderColor: "border-chart-2/10",
    activeBorder: "ring-2 ring-chart-2/20 border-chart-2",
    activeBg: "bg-chart-2/50",
    icon: XCircle 
  },
  interested: { 
    label: "Interested", 
    color: "text-chart-3", 
    bgColor: "bg-chart-3/10", 
    borderColor: "border-chart-3/10",
    activeBorder: "ring-2 ring-chart-3/20 border-chart-3",
    activeBg: "bg-chart-3/50",
    icon: CheckCircle 
  },
  inprocess: { 
    label: "In Process", 
    color: "text-chart-4", 
    bgColor: "bg-chart-4/10", 
    borderColor: "border-chart-4/10",
    activeBorder: "ring-2 ring-chart-4/20 border-chart-4",
    activeBg: "bg-chart-4/50",
    icon: RefreshCw 
  },
};

export const ApplicantCard = memo(function ApplicantCard({ applicant, onSave, isPending }: ApplicantCardProps) {
  const [formData, setFormData] = useState<Partial<Applicant>>({
    status: applicant.status,
    feedback: applicant.feedback,
  });

  const [isNameOpen, setIsNameOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const hasChanges = useMemo(() => {
    return formData.status !== applicant.status || formData.feedback !== applicant.feedback;
  }, [formData, applicant]);

  const toggleExpand = () => {
    if (isDesktop) return;
    setIsExpanded(!isExpanded);
  };

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

  const shouldShowDetails = isDesktop || isExpanded;

  return (
    <motion.div
      layout="position"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeOut" } }}
      transition={{
        layout: {
          type: "spring",
          stiffness: 200,
          damping: 28,
          mass: 0.8,
        },
        opacity: { duration: 0.25 },
      }}
    >
      <Card className={cn(
        "applicant-card group relative shadow-premium border-border/50 bg-card transition-all duration-300 flex flex-col h-full overflow-hidden",
        shouldShowDetails || isDesktop ? "p-2 hover:shadow-premium-hover hover:border-primary/40" : "p-0"
      )}>
        
        <CardHeader 
          onClick={toggleExpand}
          className={cn(
            "space-y-0 cursor-default transition-all duration-300",
            !isDesktop && "cursor-pointer select-none",
            !shouldShowDetails && !isDesktop ? "px-2.5 pt-4 " : "p-4 md:pb-3"
          )}
        >
          <div className={cn(
            "flex justify-between gap-3",
            !shouldShowDetails && !isDesktop ? "items-center" : "items-start"
          )}>
            <div className="flex-1 min-w-0">
              <Popover open={isNameOpen} onOpenChange={setIsNameOpen}>
                <PopoverTrigger
                  onPointerEnter={() => setIsNameOpen(true)}
                  onPointerLeave={() => setIsNameOpen(false)}
                  className="text-left outline-none group/name block w-full bg-transparent border-none p-0"
                >
                  <span className={cn(
                    "font-bold tracking-tight block transition-all duration-300",
                    // Desktop styles
                    "md:text-lg text-primary",
                    // Mobile Expanded styles: Smaller, normal wrap
                    shouldShowDetails && !isDesktop && "text-[13px] text-primary whitespace-normal leading-tight",
                    // Mobile Collapsed styles: Truncated
                    !shouldShowDetails && !isDesktop && "text-[14px] truncate text-primary"
                  )}>
                    {applicant.full_name.length > 20 
                      ? `${applicant.full_name.substring(0, 20)}...` 
                      : applicant.full_name}
                  </span>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-2.5 text-xs font-bold shadow-xl border-primary/10 rounded-lg pointer-events-none">
                  {applicant.full_name}
                </PopoverContent>
              </Popover>
              <div className={cn(
                "flex items-center gap-1.5 transition-all duration-300",
                shouldShowDetails && !isDesktop ? "mt-0.5" : "mt-0"
              )}>
                <span className="text-[8px] md:text-[10px] font-bold text-muted-foreground/80">#{applicant.id}</span>
                <span className="text-border/40 scale-y-75">/</span>
                <span className="text-[8px] md:text-[10px] font-bold text-muted-foreground/60 truncate uppercase tracking-wider">{applicant.position}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge className={cn(
                "shadow-none text-[8px] font-black px-1.5 py-0.5 shrink-0 border uppercase tracking-widest flex items-center gap-1 rounded-full whitespace-nowrap transition-all duration-300",
                currentStatus.bgColor, currentStatus.color, currentStatus.borderColor,
                !shouldShowDetails && !isDesktop && "opacity-90"
              )}>
                <CurrentStatusIcon className="w-2 h-2" />
                {currentStatus.label}
              </Badge>
 
              {!isDesktop && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-1 rounded-full bg-muted/40 text-muted-foreground/60"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </div>
          </div>
        </CardHeader>

        <motion.div
          initial={false}
          animate={{ 
            height: shouldShowDetails ? "auto" : 0,
            opacity: shouldShowDetails ? 1 : 0
          }}
          transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="overflow-hidden"
        >
          <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-4">
            <div className="flex flex-col rounded-xl border border-border/20 divide-y divide-border/20 bg-muted/30 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-2.5 hover:bg-background transition-colors">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="p-1.5 bg-background rounded-full border border-border shrink-0 text-muted-foreground shadow-sm">
                    <Phone className="w-3 h-3" />
                  </div>
                  <span className="text-[12px] font-black text-foreground truncate">{applicant.phone}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 cursor-pointer px-5 text-[11px] font-black border-border bg-background text-foreground hover:bg-muted shrink-0 rounded-full shadow-sm"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${applicant.phone}`; }}
                >
                  Call
                </Button>
              </div>

              <div className="flex items-center justify-between p-2.5 hover:bg-background transition-colors">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="p-1.5 bg-background rounded-full border border-border shrink-0 text-muted-foreground shadow-sm">
                    <Mail className="w-3 h-3" />
                  </div>
                  <span className="text-[12px] font-black text-foreground truncate">{applicant.email}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 cursor-pointer px-5 text-[11px] font-black border-border bg-background text-foreground hover:bg-muted shrink-0 rounded-full shadow-sm"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${applicant.email}`; }}
                >
                  Mail
                </Button>
              </div>

              <div className="flex items-center justify-between p-2.5 hover:bg-background transition-colors">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="p-1.5 bg-background rounded-full border border-border shrink-0 text-muted-foreground shadow-sm">
                    <Calendar className="w-3 h-3" />
                  </div>
                  <span className="text-[12px] font-bold text-muted-foreground truncate">
                    Applied {applicant.created_time ? format(new Date(applicant.created_time), "dd MMM yyyy") : "—"}
                  </span>
                </div>
                <div className="h-8 px-4 flex items-center justify-center text-[11px] font-black bg-background/80 text-muted-foreground shrink-0 rounded-full border border-border shadow-sm">
                  {applicant.created_time ? format(new Date(applicant.created_time), "hh:mm a") : "--:--"}
                </div>
              </div>
            </div>

            <div className="space-y-3 p-3.5 rounded-2xl bg-muted/30 border border-border/50 shadow-inner">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.1em] px-1 block">
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
                        "h-8 cursor-pointer px-2 text-[10px] font-black rounded-full transition-all border border-transparent shadow-sm",
                        isSelected
                          ? `${config.activeBg} ${config.color} ${config.activeBorder} shadow-inner`
                          : "bg-muted/50 text-muted-foreground hover:bg-background hover:border-border"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({
                          ...prev,
                          status: isSelected ? "pending" : s,
                        }));
                      }}
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
                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.1em] flex items-center gap-1.5">
                  <MessageSquare size={14} className="opacity-60" />
                  Notes
                </Label>
                <span className={cn(
                  "text-[10px] font-black",
                  String(formData.feedback ?? "").length > 250 ? "text-red-500" : "text-muted-foreground/30"
                )}>
                  {String(formData.feedback ?? "").length}/300
                </span>
              </div>
              <Textarea
                value={formData.feedback}
                onChange={(e) => setFormData((prev) => ({ ...prev, feedback: e.target.value.slice(0, 300) }))}
                onClick={(e) => e.stopPropagation()}
                placeholder="Internal hiring notes..."
                className="min-h-[90px] text-[13px] font-bold resize-none border-border focus-visible:ring-primary/10 bg-background placeholder:text-muted-foreground/30 leading-relaxed rounded-2xl shadow-sm"
                disabled={isPending}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-black">
                    <Clock className="w-3 h-3" />
                    {applicant.updated.length > 0
                      ? format(new Date(applicant.updated[applicant.updated.length - 1].split("|")[0]), "dd MMM yyyy")
                      : "New Lead"}
                  </div>
                  {applicant.updated.length > 0 && applicant.updated[applicant.updated.length - 1].includes("|") && (
                    <span className="text-[9px] font-black text-primary/70 uppercase">
                      By {applicant.updated[applicant.updated.length - 1].split("|")[1]}
                    </span>
                  )}
                </div>
                
                <Dialog>
                  <DialogTrigger 
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-primary font-black text-left outline-none hover:underline flex items-center gap-1 transition-all cursor-pointer"
                  >
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
                    <div className="max-h-[60vh] min-h-[200px] overflow-y-auto pr-3 pl-4 pb-2 space-y-4 pointer-events-auto custom-scrollbar" data-lenis-prevent>
                      {applicant.updated.length > 0 ? (
                        applicant.updated.slice().reverse().map((dateString, i) => (
                          <div key={i} className="relative pl-6 pb-4 border-l-2 border-border/50 last:border-0 last:pb-0">
                            <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-background shadow-sm flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-foreground">
                                  {format(new Date(dateString.split("|")[0]), "dd MMMM yyyy")}
                                </span>
                                {dateString.includes("|") && (
                                  <Badge variant="secondary" className="h-4 text-[8px] px-1.5 font-black bg-muted/80 text-primary border-none">
                                    {dateString.split("|")[1]}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {format(new Date(dateString.split("|")[0]), "hh:mm a")}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic font-medium py-10 text-center">No history logs yet.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Button
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                disabled={isPending || !hasChanges}
                size="lg"
                className={cn(
                  "h-10 px-4 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg rounded-full",
                  hasChanges && !isPending 
                    ? "bg-primary text-white shadow-primary/30 hover:shadow-primary/40 hover:translate-y-[-1px]" 
                    : "bg-muted text-muted-foreground shadow-none border border-border"
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
        </motion.div>
      </Card>
    </motion.div>
  );
});

export default ApplicantCard;