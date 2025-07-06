import { Shield, Text, Clock, Mail, Sparkles, CheckCircle2, Settings } from "lucide-react";
import { TestingTypeCheckbox } from "./testing-type-checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TestingTypesState } from "./types";
import { cn } from "@/lib/utils";

interface TestingTypesPanelProps {
  testingTypes: TestingTypesState;
  onTestingTypeChange: (type: keyof TestingTypesState, checked: boolean) => void;
  toolsFrameworks: string;
  onToolsFrameworksChange: (value: string) => void;
  moreContext: string;
  onMoreContextChange: (value: string) => void;
  allocatedHours: string;
  onAllocatedHoursChange: (value: string) => void;
  emailAddress: string;
  onEmailAddressChange: (value: string) => void;
}

export function TestingTypesPanel({
  testingTypes,
  onTestingTypeChange,
  toolsFrameworks,
  onToolsFrameworksChange,
  moreContext,
  onMoreContextChange,
  allocatedHours,
  onAllocatedHoursChange,
  emailAddress,
  onEmailAddressChange,
}: TestingTypesPanelProps) {
  const selectedCount = Object.values(testingTypes).filter(Boolean).length;
  
  return (
    <div className="w-96 relative">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-white/60 backdrop-blur-xl border-l border-white/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-pink-50/20"></div>
      </div>
      
      {/* Content */}
      <div className="relative p-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-800">
                Testing Configuration
              </h2>
              <p className="text-sm text-gray-600">Customize your testing approach</p>
            </div>
          </div>
          
          {/* Selection Counter */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-50/80 to-pink-50/80 border border-purple-200/30 backdrop-blur-sm">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              {selectedCount} testing type{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
        
        {/* Testing Types Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Testing Types
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <TestingTypeCheckbox
              label="Functional Testing"
              checked={testingTypes.functional}
              onChange={(checked) => onTestingTypeChange("functional", checked)}
            />
            <TestingTypeCheckbox
              label="Security Testing"
              checked={testingTypes.security}
              onChange={(checked) => onTestingTypeChange("security", checked)}
            />
            <TestingTypeCheckbox
              label="Performance Testing"
              checked={testingTypes.performance}
              onChange={(checked) => onTestingTypeChange("performance", checked)}
            />
            <TestingTypeCheckbox
              label="UI/UX Testing"
              checked={testingTypes.ui_ux}
              onChange={(checked) => onTestingTypeChange("ui_ux", checked)}
            />
            <TestingTypeCheckbox
              label="API Testing"
              checked={testingTypes.api}
              onChange={(checked) => onTestingTypeChange("api", checked)}
            />
            <TestingTypeCheckbox
              label="Integration Testing"
              checked={testingTypes.integration}
              onChange={(checked) => onTestingTypeChange("integration", checked)}
            />
            <TestingTypeCheckbox
              label="Accessibility Testing"
              checked={testingTypes.accessibility}
              onChange={(checked) => onTestingTypeChange("accessibility", checked)}
            />
            <TestingTypeCheckbox
              label="Usability Testing"
              checked={testingTypes.usability}
              onChange={(checked) => onTestingTypeChange("usability", checked)}
            />
            <TestingTypeCheckbox
              label="Regression Testing"
              checked={testingTypes.regression}
              onChange={(checked) => onTestingTypeChange("regression", checked)}
            />
            <TestingTypeCheckbox
              label="Exploratory Testing"
              checked={testingTypes.exploratory}
              onChange={(checked) => onTestingTypeChange("exploratory", checked)}
            />
          </div>
        </div>

        {/* Additional Configuration */}
        <div className="space-y-6">
          {/* Tools & Frameworks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <label className="text-base font-semibold text-gray-800">
                Tools & Frameworks
              </label>
            </div>
            <div className="relative">
              <Textarea
                value={toolsFrameworks}
                onChange={(e) => onToolsFrameworksChange(e.target.value)}
                placeholder="Enter testing tools and frameworks you're using (e.g., Jest, Cypress, Selenium...)"
                className={cn(
                  "min-h-[120px] text-sm transition-all duration-200",
                  "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                  "focus:ring-2 focus:ring-blue-200 focus:border-transparent focus:bg-white/90",
                  "placeholder:text-gray-400"
                )}
              />
              {toolsFrameworks && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              )}
            </div>
          </div>

          {/* More Context */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Text className="h-3 w-3 text-white" />
              </div>
              <label className="text-base font-semibold text-gray-800">
                Additional Context
              </label>
            </div>
            <div className="relative">
              <Textarea
                value={moreContext}
                onChange={(e) => onMoreContextChange(e.target.value)}
                placeholder="Provide any additional context or notes here..."
                className={cn(
                  "min-h-[100px] text-sm transition-all duration-200",
                  "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                  "focus:ring-2 focus:ring-emerald-200 focus:border-transparent focus:bg-white/90",
                  "placeholder:text-gray-400"
                )}
              />
              {moreContext && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row - Hours and Email */}
          <div className="grid grid-cols-1 gap-6">
            {/* Allocated Hours */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                <label className="text-base font-semibold text-gray-800">
                  Allocated Hours
                </label>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={allocatedHours}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                      onAllocatedHoursChange(value);
                    }
                  }}
                  placeholder="e.g., 40"
                  className={cn(
                    "text-sm transition-all duration-200",
                    "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                    "focus:ring-2 focus:ring-orange-200 focus:border-transparent focus:bg-white/90",
                    "placeholder:text-gray-400"
                  )}
                  min="0"
                  step="0.5"
                />
                {allocatedHours && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Mail className="h-3 w-3 text-white" />
                </div>
                <label className="text-base font-semibold text-gray-800">
                  Email Address
                </label>
              </div>
              <div className="relative">
                <Input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => onEmailAddressChange(e.target.value)}
                  placeholder="Enter your email address"
                  className={cn(
                    "text-sm transition-all duration-200",
                    "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                    "focus:ring-2 focus:ring-purple-200 focus:border-transparent focus:bg-white/90",
                    "placeholder:text-gray-400"
                  )}
                />
                {emailAddress && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-gray-50/80 to-gray-100/60 border border-gray-200/30 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Pro Tip</p>
              <p className="text-xs text-gray-500 mt-1">Select multiple testing types for comprehensive coverage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 