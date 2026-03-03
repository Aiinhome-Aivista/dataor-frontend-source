export type StepStatus = 'pending' | 'processing' | 'awaiting_input' | 'completed' | 'error';

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  agentName: string;
  status: StepStatus;
  activities: string[];
  question?: string;
  options?: string[];
}

export interface WorkflowState {
  currentStepIndex: number;
  steps: WorkflowStep[];
}

export interface AgentHistoryItem {
  id: string;
  date: string;
  action: string;
  details: string;
  status: 'completed' | 'pending_input' | 'processing';
  prompt?: string;
  options?: string[];
  activities?: string[];
}

export interface AgentData {
  id: string;
  name: string;
  icon: string;
  description: string;
  history: AgentHistoryItem[];
}
