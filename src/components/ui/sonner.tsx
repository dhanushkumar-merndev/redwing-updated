"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white/80 group-[.toaster]:backdrop-blur-md " +
            "group-[.toaster]:text-foreground group-[.toaster]:border-border/50 " +
            "group-[.toaster]:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] " +
            "group-[.toaster]:rounded-[24px] group-[.toaster]:px-5 group-[.toaster]:py-4 " +
            "group-[.toaster]:border-2 transition-all duration-300",
          
          title: "group-[.toast]:text-[14px] group-[.toast]:font-black group-[.toast]:tracking-tight group-[.toast]:uppercase",
          
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[12px] group-[.toast]:font-semibold group-[.toast]:mt-0.5",
          
          // Primary Action Button (Matching your Save button style)
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground " +
            "group-[.toast]:rounded-full group-[.toast]:font-bold group-[.toast]:text-[11px] group-[.toast]:uppercase " +
            "group-[.toast]:px-4 group-[.toast]:h-8 group-[.toast]:tracking-wider group-[.toast]:shadow-lg group-[.toast]:shadow-primary/20",
          
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground " +
            "group-[.toast]:rounded-full group-[.toast]:font-bold group-[.toast]:text-[11px] group-[.toast]:uppercase " +
            "group-[.toast]:px-4 group-[.toast]:h-8",

          // Status Specific Overrides (Matching your Applicant Status colors)
          error: 
            "group-[.toast]:!bg-chart-2/10 group-[.toast]:!text-chart-2 group-[.toast]:!border-chart-2/30",
          success: 
            "group-[.toast]:!bg-chart-3/10 group-[.toast]:!text-chart-3 group-[.toast]:!border-chart-3/30",
          warning: 
            "group-[.toast]:!bg-chart-1/10 group-[.toast]:!text-chart-1 group-[.toast]:!border-chart-1/30",
          info: 
            "group-[.toast]:!bg-chart-4/10 group-[.toast]:!text-chart-4 group-[.toast]:!border-chart-4/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }