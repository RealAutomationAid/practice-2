export interface TestingTypesState {
  functional: boolean;
  security: boolean;
  performance: boolean;
  ui_ux: boolean;
  api: boolean;
  integration: boolean;
  accessibility: boolean;
  usability: boolean;
  regression: boolean;
  exploratory: boolean;
}

export interface TestPlan {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
} 