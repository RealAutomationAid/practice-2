import * as React from "react";
import { cn } from "@/lib/utils";

interface TestPlanCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export function TestPlanCard({ title, description, icon, isActive, onClick }: TestPlanCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
        isActive ? "border-primary bg-primary/5" : "border-border bg-card",
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("p-2 rounded-md", isActive ? "bg-primary text-primary-foreground" : "bg-muted")}>
          {icon}
        </div>
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
} 