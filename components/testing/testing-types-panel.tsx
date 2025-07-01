import { Shield, Text, Clock, Mail } from "lucide-react";
import { TestingTypeCheckbox } from "./testing-type-checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TestingTypesState } from "./types";

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
  return (
    <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Testing Types
      </h2>
      
      <div className="space-y-3 mb-6">
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

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Tools & Frameworks</label>
        <Textarea
          value={toolsFrameworks}
          onChange={(e) => onToolsFrameworksChange(e.target.value)}
          placeholder="Enter testing tools and frameworks you're using (e.g., Jest, Cypress, Selenium...)"
          className="min-h-[100px] text-sm"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 flex items-center gap-1">
          <Text className="h-4 w-4 text-muted-foreground" />
          More Context
        </label>
        <Textarea
          value={moreContext}
          onChange={(e) => onMoreContextChange(e.target.value)}
          placeholder="Provide any additional context or notes here..."
          className="min-h-[80px] text-sm"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Allocated Hours
        </label>
        <Input
          type="number"
          value={allocatedHours}
          onChange={(e) => {
            const value = e.target.value;
            // Allow empty string or valid numbers (including decimals)
            if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
              onAllocatedHoursChange(value);
            }
          }}
          placeholder="e.g., 40"
          className="text-sm"
          min="0"
          step="0.5"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 flex items-center gap-1">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Email Address
        </label>
        <Input
          type="email"
          value={emailAddress}
          onChange={(e) => onEmailAddressChange(e.target.value)}
          placeholder="Enter your email address"
          className="text-sm"
        />
      </div>
    </div>
  );
} 