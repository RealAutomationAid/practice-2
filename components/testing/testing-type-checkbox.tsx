import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestingTypeCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function TestingTypeCheckbox({ label, checked, onChange }: TestingTypeCheckboxProps) {
  return (
    <div 
      className={cn(
        "group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300",
        "bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg",
        "hover:bg-white/80 hover:shadow-xl hover:scale-[1.02]",
        checked && "bg-gradient-to-r from-purple-50/80 to-pink-50/80 border-purple-200/50 shadow-xl scale-[1.02]"
      )}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "relative w-6 h-6 rounded-lg border-2 transition-all duration-300 flex items-center justify-center",
          checked 
            ? "bg-gradient-to-br from-purple-500 to-pink-600 border-purple-500 shadow-lg" 
            : "border-gray-300 bg-white/80 group-hover:border-purple-400"
        )}>
          {checked && (
            <Check className="h-4 w-4 text-white animate-in zoom-in-75 duration-200" />
          )}
        </div>
        <span className={cn(
          "font-medium transition-colors duration-200",
          checked ? "text-purple-700" : "text-gray-700 group-hover:text-purple-600"
        )}>
          {label}
        </span>
      </div>
      
      {/* Active indicator */}
      {checked && (
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 animate-pulse" />
      )}
    </div>
  );
} 