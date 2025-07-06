import { MessageSquare, FileText, Settings, Play, Sparkles, ArrowRight } from "lucide-react";
import { TestPlanCard } from "./test-plan-card";

interface TestPlanSidebarProps {
  activeTestPlan: string | null;
  onTestPlanSelect: (planId: string) => void;
}

export function TestPlanSidebar({ activeTestPlan, onTestPlanSelect }: TestPlanSidebarProps) {
  const testPlans = [
    {
      id: "test-plan",
      title: "Test Plan",
      description: "Create comprehensive test planning documents",
      icon: <FileText className="h-5 w-5" />,
      gradient: "from-blue-500 to-indigo-600",
      color: "bg-blue-500/10 border-blue-200/50",
      textColor: "text-blue-700",
    },
    {
      id: "test-design",
      title: "Test Design",
      description: "Design test cases and scenarios",
      icon: <Settings className="h-5 w-5" />,
      gradient: "from-purple-500 to-pink-600",
      color: "bg-purple-500/10 border-purple-200/50",
      textColor: "text-purple-700",
    },
    {
      id: "test-execution",
      title: "Test Execution",
      description: "Execute and track test results",
      icon: <Play className="h-5 w-5" />,
      href: "/test-execution",
      gradient: "from-emerald-500 to-teal-600",
      color: "bg-emerald-500/10 border-emerald-200/50",
      textColor: "text-emerald-700",
      isExternal: true,
    },
  ] as const;

  return (
    <div className="w-80 relative">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-white/60 backdrop-blur-xl border-r border-white/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/20"></div>
      </div>
      
      {/* Content */}
      <div className="relative p-8 h-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-800">
                Test Plans
              </h2>
              <p className="text-sm text-gray-600">Choose your testing approach</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {!activeTestPlan && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Get Started</p>
                <p className="text-xs text-blue-600 mt-1">Select a test plan to begin your testing journey</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Plan Cards */}
        <div className="space-y-4">
          {testPlans.map((plan, index) => (
            <TestPlanCard
              key={plan.id}
              title={plan.title}
              description={plan.description}
              icon={plan.icon}
              isActive={activeTestPlan === plan.id}
              onClick={'href' in plan ? undefined : () => onTestPlanSelect(plan.id)}
              href={'href' in plan ? plan.href : undefined}
              gradient={plan.gradient}
              color={plan.color}
              textColor={plan.textColor}
              isExternal={'isExternal' in plan ? plan.isExternal : false}
              index={index}
            />
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-gray-50/80 to-gray-100/60 border border-gray-200/30 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Need Help?</p>
              <p className="text-xs text-gray-500 mt-1">Each plan guides you through different aspects of testing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 