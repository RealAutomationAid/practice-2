"use client";

import * as React from "react";
import { useState } from "react";
import { Send, MessageSquare, FileText, Play, Shield, Settings, Mail, Text, Clock, Search, Eye, Zap, TestTube, Layers, Accessibility, Users, Repeat, Compass } from "lucide-react";

// Utils function
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Custom Input component
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

// Custom Textarea component
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// Message Loading component (no longer used in main chat area, but kept for completeness)
function MessageLoading() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="text-foreground"
    >
      <circle cx="4" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_qFRN"
          begin="0;spinner_OcgL.end+0.25s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="12" cy="12" r="2" fill="currentColor">
        <animate
          begin="spinner_qFRN.begin+0.1s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="20" cy="12" r="2" fill="currentColor">
        <animate
          id="spinner_OcgL"
          begin="spinner_qFRN.begin+0.2s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
    </svg>
  );
}

// Auto scroll hook (no longer directly used for chat messages, but kept for completeness)
function useAutoScroll(options: { smooth?: boolean; content?: React.ReactNode } = {}) {
  const { smooth = false, content } = options;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);

  const scrollToBottom = React.useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
    setIsAtBottom(true);
    setAutoScrollEnabled(true);
  }, [smooth]);

  const disableAutoScroll = React.useCallback(() => {
    setAutoScrollEnabled(false);
  }, []);

  React.useEffect(() => {
    if (autoScrollEnabled && scrollRef.current) {
      scrollToBottom();
    }
  }, [content, autoScrollEnabled, scrollToBottom]);

  return {
    scrollRef,
    isAtBottom,
    autoScrollEnabled,
    scrollToBottom,
    disableAutoScroll,
  };
}

// Chat components (no longer used for the main SUT analysis input, but kept for completeness)
interface ChatBubbleProps {
  variant?: "sent" | "received";
  className?: string;
  children: React.ReactNode;
}

function ChatBubble({ variant = "received", className, children }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        variant === "sent" && "flex-row-reverse",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ChatBubbleMessageProps {
  variant?: "sent" | "received";
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function ChatBubbleMessage({ variant = "received", isLoading, className, children }: ChatBubbleMessageProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 max-w-xs",
        variant === "sent" ? "bg-primary text-primary-foreground" : "bg-muted",
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function ChatBubbleAvatar({ fallback = "AI", className }: { fallback?: string; className?: string }) {
  return (
    <div className={cn("h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium", className)}>
      {fallback}
    </div>
  );
}

// Chat Message List component (no longer used for the main SUT analysis input, but kept for completeness)
interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smooth = false, ...props }, _ref) => {
    const { scrollRef, scrollToBottom } = useAutoScroll({ smooth, content: children });

    return (
      <div className="relative w-full h-full">
        <div
          className={cn("flex flex-col w-full h-full p-4 overflow-y-auto", className)}
          ref={scrollRef}
          {...props}
        >
          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </div>
    );
  }
);

ChatMessageList.displayName = "ChatMessageList";

// Test Plan Card component
interface TestPlanCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

function TestPlanCard({ title, description, icon, isActive, onClick }: TestPlanCardProps) {
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

// Testing Type Checkbox component
interface TestingTypeCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function TestingTypeCheckbox({ label, checked, onChange }: TestingTypeCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border border-primary text-primary focus:ring-2 focus:ring-primary"
      />
      <label className="text-sm font-medium">{label}</label>
    </div>
  );
}

// Main Testing Chat Interface component
interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
}

interface TestingChatInterfaceProps {
  className?: string;
}

function TestingChatInterface({ className }: TestingChatInterfaceProps) {
  const [sutAnalysisInput, setSutAnalysisInput] = useState("");
  const [activeTestPlan, setActiveTestPlan] = useState<string | null>(null);
  const [testingTypes, setTestingTypes] = useState({
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
  const [toolsFrameworks, setToolsFrameworks] = useState("");
  const [moreContext, setMoreContext] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [allocatedHours, setAllocatedHours] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

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

  const handleTestingTypeChange = (type: keyof typeof testingTypes, checked: boolean) => {
    setTestingTypes(prev => ({ ...prev, [type]: checked }));
    // Clear any previous error when user makes changes
    if (submitError) setSubmitError('');
  };

  const validateForm = (): string | null => {
    if (!activeTestPlan) {
      return 'Please select a test plan from the left sidebar first.';
    }
    
    if (!sutAnalysisInput.trim()) {
      return 'Please provide System Under Test (SUT) analysis information.';
    }
    
    if (emailAddress && !emailAddress.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return 'Please enter a valid email address.';
    }
    
    if (allocatedHours && (isNaN(Number(allocatedHours)) || Number(allocatedHours) < 0)) {
      return 'Please enter a valid number for allocated hours.';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter only selected testing types
      const selectedTestingTypes = Object.entries(testingTypes)
        .filter(([_, checked]) => checked)
        .reduce((acc, [key, _]) => ({ ...acc, [key]: true }), {});

      // Prepare the payload with only filled fields
      const payload: any = {};

      // Always include these if they have values
      if (sutAnalysisInput.trim()) payload.sutAnalysis = sutAnalysisInput.trim();
      if (Object.keys(selectedTestingTypes).length > 0) payload.testingTypes = selectedTestingTypes;
      if (toolsFrameworks.trim()) payload.toolsFrameworks = toolsFrameworks.trim();
      if (moreContext.trim()) payload.moreContext = moreContext.trim();
      if (emailAddress.trim()) payload.emailAddress = emailAddress.trim();
      if (allocatedHours && !isNaN(Number(allocatedHours))) {
        payload.allocatedHours = Number(allocatedHours);
      }

      // Add subject based on active test plan
      if (activeTestPlan === 'test-plan') {
        payload.subject = 'Test Plan';
      } else if (activeTestPlan === 'test-design') {
        payload.subject = 'Test Design';
      } else if (activeTestPlan === 'test-execution') {
        payload.subject = 'Test Execution';
      }

      console.log('Submitting payload:', payload); // Debug log

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
        console.error('API response:', response.status, responseData);
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

  // Clear error when user selects a test plan
  const handleTestPlanSelect = (planId: string) => {
    setActiveTestPlan(activeTestPlan === planId ? null : planId);
    if (submitError) setSubmitError('');
  };

  // Clear error when user types in SUT analysis
  const handleSutAnalysisChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSutAnalysisInput(e.target.value);
    if (submitError) setSubmitError('');
  };

  const isFormValid = activeTestPlan && sutAnalysisInput.trim();

  return (
    <div className={cn("flex h-[600px] bg-background border rounded-lg overflow-hidden", className)}>
      {/* Left Sidebar - Test Plan Cards */}
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
              onClick={() => handleTestPlanSelect(plan.id)}
            />
          ))}
        </div>
      </div>

      {/* Central SUT Analysis Input Area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <h1 className="font-semibold text-lg">SUT Analysis Interface</h1>
          <p className="text-sm text-muted-foreground">Provide details about your System Under Test for analysis</p>
          {activeTestPlan && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              Selected: {testPlans.find(p => p.id === activeTestPlan)?.title}
            </div>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <label htmlFor="sut-analysis-textarea" className="block text-sm font-medium mb-2">
            System Under Test (SUT) Analysis <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="sut-analysis-textarea"
            value={sutAnalysisInput}
            onChange={handleSutAnalysisChange}
            placeholder="Enter comprehensive details about your System Under Test (SUT) here. Include its purpose, key features, architecture, dependencies, and any specific areas you want to focus on for testing."
            className="w-full min-h-[calc(100%-40px)] text-base"
            disabled={!activeTestPlan}
          />
          {!activeTestPlan && (
            <p className="text-sm text-muted-foreground mt-2">
              Please select a test plan first to enable this field.
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
            onClick={handleSubmit}
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
                <MessageLoading />
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
          {!isFormValid && !isSubmitting && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {!activeTestPlan 
                ? "Select a test plan and provide SUT analysis to enable submission" 
                : !sutAnalysisInput.trim() 
                  ? "Please provide SUT analysis information"
                  : ""
              }
            </p>
          )}
        </div>
      </div>

      {/* Right Sidebar - Testing Configuration & New Fields */}
      <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Testing Types
        </h2>
        
        <div className="space-y-3 mb-6">
          <TestingTypeCheckbox
            label="Functional Testing"
            checked={testingTypes.functional}
            onChange={(checked) => handleTestingTypeChange("functional", checked)}
          />
          <TestingTypeCheckbox
            label="Security Testing"
            checked={testingTypes.security}
            onChange={(checked) => handleTestingTypeChange("security", checked)}
          />
          <TestingTypeCheckbox
            label="Performance Testing"
            checked={testingTypes.performance}
            onChange={(checked) => handleTestingTypeChange("performance", checked)}
          />
          <TestingTypeCheckbox
            label="UI/UX Testing"
            checked={testingTypes.ui_ux}
            onChange={(checked) => handleTestingTypeChange("ui_ux", checked)}
          />
          <TestingTypeCheckbox
            label="API Testing"
            checked={testingTypes.api}
            onChange={(checked) => handleTestingTypeChange("api", checked)}
          />
          <TestingTypeCheckbox
            label="Integration Testing"
            checked={testingTypes.integration}
            onChange={(checked) => handleTestingTypeChange("integration", checked)}
          />
          <TestingTypeCheckbox
            label="Accessibility Testing"
            checked={testingTypes.accessibility}
            onChange={(checked) => handleTestingTypeChange("accessibility", checked)}
          />
          <TestingTypeCheckbox
            label="Usability Testing"
            checked={testingTypes.usability}
            onChange={(checked) => handleTestingTypeChange("usability", checked)}
          />
          <TestingTypeCheckbox
            label="Regression Testing"
            checked={testingTypes.regression}
            onChange={(checked) => handleTestingTypeChange("regression", checked)}
          />
          <TestingTypeCheckbox
            label="Exploratory Testing"
            checked={testingTypes.exploratory}
            onChange={(checked) => handleTestingTypeChange("exploratory", checked)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Tools & Frameworks</label>
          <Textarea
            value={toolsFrameworks}
            onChange={(e) => setToolsFrameworks(e.target.value)}
            placeholder="Enter testing tools and frameworks you're using (e.g., Jest, Cypress, Selenium...)"
            className="min-h-[100px] text-sm"
          />
        </div>

        {/* New Fields */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 flex items-center gap-1">
            <Text className="h-4 w-4 text-muted-foreground" />
            More Context
          </label>
          <Textarea
            value={moreContext}
            onChange={(e) => setMoreContext(e.target.value)}
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
                setAllocatedHours(value);
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
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="Enter your email address"
            className="text-sm"
          />
        </div>
      </div>
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