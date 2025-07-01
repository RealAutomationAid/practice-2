import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface MainInputAreaProps {
  activeTestPlan: string | null;
  sutAnalysisInput: string;
  onSutAnalysisChange: (value: string) => void;
  testPlanInput: string;
  onTestPlanChange: (value: string) => void;
  requirementsInput: string;
  onRequirementsChange: (value: string) => void;
  riskMatrixGeneration: boolean;
  onRiskMatrixChange: (checked: boolean) => void;
  numberOfTestCases: string;
  onNumberOfTestCasesChange: (value: string) => void;
  emailAddress: string;
  onEmailAddressChange: (value: string) => void;
  submitError: string;
  isSubmitting: boolean;
  isFormValid: boolean;
  onSubmit: () => void;
}

const testPlans = [
  { id: "test-plan", title: "Test Plan" },
  { id: "test-design", title: "Test Design" },
  { id: "test-execution", title: "Test Execution" },
];

export function MainInputArea({
  activeTestPlan,
  sutAnalysisInput,
  onSutAnalysisChange,
  testPlanInput,
  onTestPlanChange,
  requirementsInput,
  onRequirementsChange,
  riskMatrixGeneration,
  onRiskMatrixChange,
  numberOfTestCases,
  onNumberOfTestCasesChange,
  emailAddress,
  onEmailAddressChange,
  submitError,
  isSubmitting,
  isFormValid,
  onSubmit,
}: MainInputAreaProps) {
  const getInterfaceTitle = () => {
    switch (activeTestPlan) {
      case 'test-plan':
        return 'Test Plan Interface';
      case 'test-design':
        return 'Test Design Interface';
      case 'test-execution':
        return 'Test Execution Interface';
      default:
        return 'Test Planning Interface';
    }
  };

  const getInterfaceDescription = () => {
    switch (activeTestPlan) {
      case 'test-plan':
        return 'Provide comprehensive test planning information';
      case 'test-design':
        return 'Provide details for test analysis and design';
      case 'test-execution':
        return 'Provide details for test execution planning';
      default:
        return 'Select a test plan to get started';
    }
  };

  const getValidationMessage = () => {
    if (activeTestPlan === 'test-design') {
      return "Please fill in all required fields (SUT Analysis, Test Plan, Requirements, and Number of Test Cases)";
    }
    return "Please provide SUT analysis information";
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="font-semibold text-lg">{getInterfaceTitle()}</h1>
        <p className="text-sm text-muted-foreground">{getInterfaceDescription()}</p>
        {activeTestPlan && (
          <div className="mt-2 text-sm text-green-600 font-medium">
            Selected: {testPlans.find(p => p.id === activeTestPlan)?.title}
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* SUT Analysis - Always shown */}
        <div>
          <label htmlFor="sut-analysis-textarea" className="block text-sm font-medium mb-2">
            System Under Test (SUT) Analysis <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="sut-analysis-textarea"
            value={sutAnalysisInput}
            onChange={(e) => onSutAnalysisChange(e.target.value)}
            placeholder="Enter comprehensive details about your System Under Test (SUT) here. Include its purpose, key features, architecture, dependencies, and any specific areas you want to focus on for testing."
            className="w-full min-h-[120px] text-base"
            disabled={!activeTestPlan}
          />
        </div>

        {/* Test Design specific fields */}
        {activeTestPlan === 'test-design' && (
          <>
            <div>
              <label htmlFor="test-plan-textarea" className="block text-sm font-medium mb-2">
                Test Plan <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="test-plan-textarea"
                value={testPlanInput}
                onChange={(e) => onTestPlanChange(e.target.value)}
                placeholder="Describe your test plan approach, methodology, scope, and testing strategy..."
                className="w-full min-h-[120px] text-base"
              />
            </div>

                          <div>
                <label htmlFor="requirements-textarea" className="block text-sm font-medium mb-2">
                  Requirements <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="requirements-textarea"
                  value={requirementsInput}
                  onChange={(e) => onRequirementsChange(e.target.value)}
                  placeholder="List and describe the requirements that need to be tested..."
                  className="w-full min-h-[120px] text-base"
                />
              </div>

              <div>
                <label htmlFor="number-of-test-cases-input" className="block text-sm font-medium mb-2">
                  Number of Test Cases to be Generated <span className="text-red-500">*</span>
                </label>
                <Input
                  id="number-of-test-cases-input"
                  type="number"
                  value={numberOfTestCases}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string or valid positive numbers
                    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                      onNumberOfTestCasesChange(value);
                    }
                  }}
                  placeholder="e.g., 25"
                  className="w-full text-base"
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <label htmlFor="email-address-input" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="email-address-input"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => onEmailAddressChange(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full text-base"
                />
              </div>

              <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="risk-matrix-checkbox"
                checked={riskMatrixGeneration}
                onChange={(e) => onRiskMatrixChange(e.target.checked)}
                className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="risk-matrix-checkbox" className="text-sm font-medium">
                Generate Risk Matrix
              </label>
            </div>
          </>
        )}

        {!activeTestPlan && (
          <p className="text-sm text-muted-foreground mt-4">
            Please select a test plan first to enable input fields.
          </p>
        )}
      </div>

      {/* Error Display */}
      {submitError && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          <strong>Error:</strong> {submitError}
        </div>
      )}

      {/* Submit Button */}
      <div className="border-t p-4">
        <button
          onClick={onSubmit}
          disabled={!isFormValid || isSubmitting}
          className={cn(
            "w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all",
            isFormValid && !isSubmitting
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {activeTestPlan 
                ? `Submit ${testPlans.find(p => p.id === activeTestPlan)?.title}` 
                : 'Select Test Plan to Continue'
              }
            </>
          )}
        </button>
        {!isFormValid && !isSubmitting && activeTestPlan && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {getValidationMessage()}
          </p>
        )}
      </div>
    </div>
  );
} 