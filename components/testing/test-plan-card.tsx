import * as React from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestPlanCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
  gradient?: string;
  color?: string;
  textColor?: string;
  isExternal?: boolean;
  index?: number;
}

export function TestPlanCard({ 
  title, 
  description, 
  icon, 
  isActive, 
  onClick, 
  href, 
  gradient = "from-gray-500 to-gray-600",
  color = "bg-gray-500/10 border-gray-200/50",
  textColor = "text-gray-700",
  isExternal = false,
  index = 0
}: TestPlanCardProps) {
  
  const content = (
    <div className="relative overflow-hidden">
      {/* Animated gradient background for active state */}
      {isActive && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 animate-pulse",
          gradient
        )} />
      )}
      
      {/* Main content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg",
              isActive 
                ? `bg-gradient-to-br ${gradient} text-white shadow-xl scale-110` 
                : `${color} ${textColor} hover:scale-105`
            )}>
              {icon}
            </div>
            <div>
              <h3 className={cn(
                "font-semibold text-base transition-colors",
                isActive ? "text-gray-900" : "text-gray-700"
              )}>
                {title}
              </h3>
              {index < 3 && (
                <div className="flex items-center gap-1 mt-1">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    index === 0 ? "bg-blue-500" : index === 1 ? "bg-purple-500" : "bg-emerald-500"
                  )} />
                  <span className="text-xs text-gray-500">
                    {index === 0 ? "Planning" : index === 1 ? "Design" : "Execution"}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action indicator */}
          <div className={cn(
            "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300",
            isActive && "opacity-100"
          )}>
            {isExternal ? (
              <ExternalLink className="h-4 w-4 text-gray-400" />
            ) : (
              <ArrowRight className={cn(
                "h-4 w-4 transition-transform duration-300",
                isActive ? "text-gray-600 translate-x-1" : "text-gray-400"
              )} />
            )}
          </div>
        </div>
        
        {/* Description */}
        <p className={cn(
          "text-sm leading-relaxed transition-colors",
          isActive ? "text-gray-600" : "text-gray-500"
        )}>
          {description}
        </p>
        
        {/* Progress indicator for active state */}
        {isActive && (
          <div className="mt-3 pt-3 border-t border-gray-200/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-600">Active</span>
            </div>
          </div>
        )}
        
        {/* External link indicator */}
        {isExternal && !isActive && (
          <div className="mt-3 pt-3 border-t border-gray-200/30">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">Opens in new view</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const baseClassName = cn(
    "group relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
    "bg-white/60 backdrop-blur-sm border-white/30 shadow-lg",
    isActive && "ring-2 ring-blue-200 shadow-2xl bg-white/80 scale-[1.02]",
    "hover:bg-white/70 hover:border-white/40"
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={baseClassName} onClick={onClick}>
      {content}
    </div>
  );
} 