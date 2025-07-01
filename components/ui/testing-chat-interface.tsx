"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TestPlanSidebar } from "@/components/testing/test-plan-sidebar";
import { MainInputArea } from "@/components/testing/main-input-area";
import { TestingTypesPanel } from "@/components/testing/testing-types-panel";
import { TestingTypesState } from "@/components/testing/types";

interface TestingChatInterfaceProps {
  className?: string;
}

function TestingChatInterface({ className }: TestingChatInterfaceProps) {
  // Form state
  const [sutAnalysisInput, setSutAnalysisInput] = useState("");
  const [testPlanInput, setTestPlanInput] = useState("");
  const [requirementsInput, setRequirementsInput] = useState("");
  const [riskMatrixGeneration, setRiskMatrixGeneration] = useState(false);
  const [numberOfTestCases, setNumberOfTestCases] = useState<string>('');
  const [activeTestPlan, setActiveTestPlan] = useState<string | null>(null);
  
  // Testing configuration state
  const [testingTypes, setTestingTypes] = useState<TestingTypesState>({
    functional: false,
    security: false,
    performance: false,
    ui_ux: false,
    api: false,
    integration: false,
    accessibility: false,
    usability: false,
    regression: false,
    exploratory: false,
  });
  
  // Additional fields state
  const [toolsFrameworks, setToolsFrameworks] = useState("");
  const [moreContext, setMoreContext] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [allocatedHours, setAllocatedHours] = useState<string>('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Event handlers
  const handleTestingTypeChange = (type: keyof TestingTypesState, checked: boolean) => {
    setTestingTypes(prev => ({ ...prev, [type]: checked }));
    if (submitError) setSubmitError('');
  };

  const handleTestPlanSelect = (planId: string) => {
    setActiveTestPlan(activeTestPlan === planId ? null : planId);
    if (submitError) setSubmitError('');
  };

  const handleInputChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    if (submitError) setSubmitError('');
  };

  // Form validation
  const validateForm = (): string | null => {
    if (!activeTestPlan) {
      return 'Please select a test plan from the left sidebar first.';
    }
    
    if (activeTestPlan === 'test-design') {
      if (!sutAnalysisInput.trim()) {
        return 'Please provide System Under Test (SUT) analysis information.';
      }
      if (!testPlanInput.trim()) {
        return 'Please provide Test Plan information.';
      }
      if (!requirementsInput.trim()) {
        return 'Please provide Requirements information.';
      }
      if (!numberOfTestCases.trim()) {
        return 'Please provide the number of test cases to be generated.';
      }
      if (isNaN(Number(numberOfTestCases)) || Number(numberOfTestCases) <= 0) {
        return 'Please enter a valid positive number for test cases.';
      }
    } else {
      if (!sutAnalysisInput.trim()) {
        return 'Please provide System Under Test (SUT) analysis information.';
      }
    }
    
    if (emailAddress && !emailAddress.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return 'Please enter a valid email address.';
    }
    
    if (allocatedHours && (isNaN(Number(allocatedHours)) || Number(allocatedHours) < 0)) {
      return 'Please enter a valid number for allocated hours.';
    }
    
    return null;
  };

  const isFormValid = () => {
    if (!activeTestPlan || !sutAnalysisInput.trim()) return false;
    
    if (activeTestPlan === 'test-design') {
      return !!(testPlanInput.trim() && requirementsInput.trim() && numberOfTestCases.trim() && !isNaN(Number(numberOfTestCases)) && Number(numberOfTestCases) > 0);
    }
    
    return true;
  };

  // Form submission
  const handleSubmit = async () => {
    setSubmitError('');
    
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTestingTypes = Object.entries(testingTypes)
        .filter(([_, checked]) => checked)
        .reduce((acc, [key, _]) => ({ ...acc, [key]: true }), {});

      const payload: any = {};

      if (sutAnalysisInput.trim()) payload.sutAnalysis = sutAnalysisInput.trim();
      
      if (activeTestPlan === 'test-design') {
        if (testPlanInput.trim()) payload.testPlan = testPlanInput.trim();
        if (requirementsInput.trim()) payload.requirements = requirementsInput.trim();
        payload.riskMatrixGeneration = riskMatrixGeneration;
        if (numberOfTestCases.trim() && !isNaN(Number(numberOfTestCases))) {
          payload.numberOfTestCases = Number(numberOfTestCases);
        }
        if (emailAddress.trim()) payload.emailAddress = emailAddress.trim();
      }
      
      // Only include testing types data for Test Plan
      if (activeTestPlan === 'test-plan') {
        if (Object.keys(selectedTestingTypes).length > 0) payload.testingTypes = selectedTestingTypes;
        if (toolsFrameworks.trim()) payload.toolsFrameworks = toolsFrameworks.trim();
        if (moreContext.trim()) payload.moreContext = moreContext.trim();
        if (emailAddress.trim()) payload.emailAddress = emailAddress.trim();
        if (allocatedHours && !isNaN(Number(allocatedHours))) {
          payload.allocatedHours = Number(allocatedHours);
        }
      }

      // Set subject based on active test plan
      if (activeTestPlan === 'test-plan') {
        payload.subject = 'Test Plan';
      } else if (activeTestPlan === 'test-design') {
        payload.subject = 'Test analysis and design';
      } else if (activeTestPlan === 'test-execution') {
        payload.subject = 'Test Execution';
      }

      const response = await fetch('/api/submit-test-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        alert('Submission successful! Your test plan request has been sent.');
        // Reset form
        setSutAnalysisInput('');
        setTestPlanInput('');
        setRequirementsInput('');
        setRiskMatrixGeneration(false);
        setNumberOfTestCases('');
        setTestingTypes({
          functional: false,
          security: false,
          performance: false,
          ui_ux: false,
          api: false,
          integration: false,
          accessibility: false,
          usability: false,
          regression: false,
          exploratory: false,
        });
        setToolsFrameworks('');
        setMoreContext('');
        setEmailAddress('');
        setAllocatedHours('');
        setActiveTestPlan(null);
        setSubmitError('');
      } else {
        throw new Error(responseData.message || `Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setSubmitError('Network error: Please check your internet connection and try again.');
        } else {
          setSubmitError(`Submission failed: ${error.message}`);
        }
      } else {
        setSubmitError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex h-[800px] bg-background border rounded-lg overflow-hidden", className)}>
      <TestPlanSidebar
        activeTestPlan={activeTestPlan}
        onTestPlanSelect={handleTestPlanSelect}
      />
      
      <MainInputArea
        activeTestPlan={activeTestPlan}
        sutAnalysisInput={sutAnalysisInput}
        onSutAnalysisChange={(value) => handleInputChange(setSutAnalysisInput, value)}
        testPlanInput={testPlanInput}
        onTestPlanChange={(value) => handleInputChange(setTestPlanInput, value)}
        requirementsInput={requirementsInput}
        onRequirementsChange={(value) => handleInputChange(setRequirementsInput, value)}
        riskMatrixGeneration={riskMatrixGeneration}
        onRiskMatrixChange={(checked) => setRiskMatrixGeneration(checked)}
        numberOfTestCases={numberOfTestCases}
        onNumberOfTestCasesChange={(value) => handleInputChange(setNumberOfTestCases, value)}
        emailAddress={emailAddress}
        onEmailAddressChange={(value) => handleInputChange(setEmailAddress, value)}
        submitError={submitError}
        isSubmitting={isSubmitting}
        isFormValid={isFormValid()}
        onSubmit={handleSubmit}
      />
      
{activeTestPlan === 'test-plan' && (
        <TestingTypesPanel
          testingTypes={testingTypes}
          onTestingTypeChange={handleTestingTypeChange}
          toolsFrameworks={toolsFrameworks}
          onToolsFrameworksChange={(value) => handleInputChange(setToolsFrameworks, value)}
          moreContext={moreContext}
          onMoreContextChange={(value) => handleInputChange(setMoreContext, value)}
          allocatedHours={allocatedHours}
          onAllocatedHoursChange={(value) => handleInputChange(setAllocatedHours, value)}
          emailAddress={emailAddress}
          onEmailAddressChange={(value) => handleInputChange(setEmailAddress, value)}
        />
      )}
    </div>
  );
}

export default function Component() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TestingChatInterface />
    </div>
  );
} 