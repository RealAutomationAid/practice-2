import { MessageSquare, FileText, Settings, Play } from "lucide-react";
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
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "test-design",
      title: "Test Design",
      description: "Design test cases and scenarios",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: "test-execution",
      title: "Test Execution",
      description: "Execute and track test results",
      icon: <Play className="h-4 w-4" />,
    },
  ];

  return (
    <div className="w-64 border-r bg-muted/30 p-4">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Test Plans
      </h2>
      {!activeTestPlan && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <strong>Step 1:</strong> Select a test plan to get started
        </div>
      )}
      <div className="space-y-3">
        {testPlans.map((plan) => (
          <TestPlanCard
            key={plan.id}
            title={plan.title}
            description={plan.description}
            icon={plan.icon}
            isActive={activeTestPlan === plan.id}
            onClick={() => onTestPlanSelect(plan.id)}
          />
        ))}
      </div>
    </div>
  );
} 