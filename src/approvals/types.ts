import type { DecimalString, PartnerId, RoleDefinition } from '../config/types';

export type ApprovalPredicate =
  | { kind: 'always' }
  | { kind: 'amount_greater_than'; amount: DecimalString }
  | { kind: 'amount_less_than'; amount: DecimalString }
  | { kind: 'partner_is'; partnerId: PartnerId }
  | { kind: 'custom_expression'; expression: string };

export interface ApprovalConditionDefinition {
  id: string;
  description?: string;
  predicate: ApprovalPredicate;
}

export interface ApprovalStepDefinition {
  id: string;
  name: string;
  description?: string;
  approverRoleIds: ReadonlyArray<RoleDefinition['roleId']>;
  minApprovals: number;
  requiresSequentialApproval?: boolean;
  escalationRoleId?: RoleDefinition['roleId'];
  onReject?: 'stop' | 'escalate' | 'continue';
}

export interface ApprovalTimeoutBehaviourDefinition {
  timeoutHours: number;
  onTimeout: 'auto_reject' | 'escalate' | 'manual_queue';
  escalationRoleId?: RoleDefinition['roleId'];
}

export interface ApprovalWorkflowDefinition {
  workflowId: string;
  name: string;
  description?: string;
  trigger: ApprovalConditionDefinition;
  steps: ReadonlyArray<ApprovalStepDefinition>;
  autoApprove?: ApprovalConditionDefinition;
  timeoutBehaviour?: ApprovalTimeoutBehaviourDefinition;
}
