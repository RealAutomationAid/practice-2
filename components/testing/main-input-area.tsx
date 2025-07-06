import { Send, Brain, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
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
    <div className="flex-1 flex flex-col relative">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-white/50 backdrop-blur-sm border-r border-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/10"></div>
      </div>
      
      {/* Header */}
      <div className="relative border-b border-white/30 p-8 bg-white/40 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-2xl text-gray-800 mb-2">{getInterfaceTitle()}</h1>
            <p className="text-gray-600 text-base leading-relaxed">{getInterfaceDescription()}</p>
            {activeTestPlan && (
              <div className="mt-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">
                  {testPlans.find(p => p.id === activeTestPlan)?.title} Selected
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="relative flex-1 p-8 overflow-y-auto space-y-6">
        {/* SUT Analysis - Always shown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <label htmlFor="sut-analysis-textarea" className="text-base font-semibold text-gray-800">
              System Under Test (SUT) Analysis
            </label>
            <span className="text-red-500 text-lg">*</span>
          </div>
          <div className="relative">
            <Textarea
              id="sut-analysis-textarea"
              value={sutAnalysisInput}
              onChange={(e) => onSutAnalysisChange(e.target.value)}
              placeholder="Enter comprehensive details about your System Under Test (SUT) here. Include its purpose, key features, architecture, dependencies, and any specific areas you want to focus on for testing."
              className={cn(
                "w-full min-h-[140px] text-base transition-all duration-200",
                "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                "focus:ring-2 focus:ring-blue-200 focus:border-transparent focus:bg-white/90",
                "placeholder:text-gray-400",
                !activeTestPlan && "opacity-50 cursor-not-allowed"
              )}
              disabled={!activeTestPlan}
            />
            {sutAnalysisInput && (
              <div className="absolute top-3 right-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            )}
          </div>
        </div>

        {/* Test Design specific fields */}
        {activeTestPlan === 'test-design' && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <label htmlFor="test-plan-textarea" className="text-base font-semibold text-gray-800">
                  Test Plan
                </label>
                <span className="text-red-500 text-lg">*</span>
              </div>
              <div className="relative">
                <Textarea
                  id="test-plan-textarea"
                  value={testPlanInput}
                  onChange={(e) => onTestPlanChange(e.target.value)}
                  placeholder="Describe your test plan approach, methodology, scope, and testing strategy..."
                  className={cn(
                    "w-full min-h-[140px] text-base transition-all duration-200",
                    "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                    "focus:ring-2 focus:ring-purple-200 focus:border-transparent focus:bg-white/90",
                    "placeholder:text-gray-400"
                  )}
                />
                {testPlanInput && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <label htmlFor="requirements-textarea" className="text-base font-semibold text-gray-800">
                  Requirements
                </label>
                <span className="text-red-500 text-lg">*</span>
              </div>
              <div className="relative">
                <Textarea
                  id="requirements-textarea"
                  value={requirementsInput}
                  onChange={(e) => onRequirementsChange(e.target.value)}
                  placeholder="List and describe the requirements that need to be tested..."
                  className={cn(
                    "w-full min-h-[140px] text-base transition-all duration-200",
                    "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                    "focus:ring-2 focus:ring-emerald-200 focus:border-transparent focus:bg-white/90",
                    "placeholder:text-gray-400"
                  )}
                />
                {requirementsInput && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <label htmlFor="number-of-test-cases-input" className="text-base font-semibold text-gray-800">
                    Test Cases Count
                  </label>
                  <span className="text-red-500 text-lg">*</span>
                </div>
                <div className="relative">
                  <Input
                    id="number-of-test-cases-input"
                    type="number"
                    value={numberOfTestCases}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        onNumberOfTestCasesChange(value);
                      }
                    }}
                    placeholder="e.g., 25"
                    className={cn(
                      "w-full text-base transition-all duration-200",
                      "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                      "focus:ring-2 focus:ring-orange-200 focus:border-transparent focus:bg-white/90",
                      "placeholder:text-gray-400"
                    )}
                    min="1"
                    step="1"
                  />
                  {numberOfTestCases && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">5</span>
                  </div>
                  <label htmlFor="email-address-input" className="text-base font-semibold text-gray-800">
                    Email Address
                  </label>
                </div>
                <div className="relative">
                  <Input
                    id="email-address-input"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => onEmailAddressChange(e.target.value)}
                    placeholder="Enter your email address"
                    className={cn(
                      "w-full text-base transition-all duration-200",
                      "bg-white/80 backdrop-blur-sm border-white/40 shadow-lg rounded-2xl",
                      "focus:ring-2 focus:ring-cyan-200 focus:border-transparent focus:bg-white/90",
                      "placeholder:text-gray-400"
                    )}
                  />
                  {emailAddress && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg">
              <input
                type="checkbox"
                id="risk-matrix-checkbox"
                checked={riskMatrixGeneration}
                onChange={(e) => onRiskMatrixChange(e.target.checked)}
                className="h-5 w-5 rounded-lg border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <label htmlFor="risk-matrix-checkbox" className="text-base font-medium text-gray-700 cursor-pointer">
                Generate Risk Matrix
              </label>
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
          </>
        )}

        {!activeTestPlan && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-gray-500" />
            </div>
            <p className="text-lg font-medium text-gray-600 mb-2">
              Ready to Start Testing?
            </p>
            <p className="text-gray-500">
              Please select a test plan from the sidebar to enable input fields.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {submitError && (
        <div className="relative mx-8 mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-2xl backdrop-blur-sm shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Submission Error</p>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="relative border-t border-white/30 p-8 bg-white/40 backdrop-blur-sm">
        <button
          onClick={onSubmit}
          disabled={!isFormValid || isSubmitting}
          className={cn(
            "w-full px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-semibold text-lg transition-all duration-300 shadow-xl",
            isFormValid && !isSubmitting
              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
              : "bg-gray-200/80 text-gray-500 cursor-not-allowed backdrop-blur-sm"
          )}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                isFormValid ? "bg-white/20" : "bg-gray-300/50"
              )}>
                <Send className="h-5 w-5" />
              </div>
              <span>
                {activeTestPlan 
                  ? `Submit ${testPlans.find(p => p.id === activeTestPlan)?.title}` 
                  : 'Select Test Plan to Continue'
                }
              </span>
            </>
          )}
        </button>
        {!isFormValid && !isSubmitting && activeTestPlan && (
          <div className="mt-4 p-3 rounded-xl bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50">
            <p className="text-sm text-yellow-800 text-center font-medium">
              {getValidationMessage()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 