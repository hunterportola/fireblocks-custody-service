import type { RoleDefinition } from '../config/types';
import type {
  ApprovalConditionDefinition,
  ApprovalPredicate,
  ApprovalStepDefinition,
  ApprovalWorkflowDefinition,
} from './types';
import {
  isDecimalString,
  isNonEmptyString,
  isNonNegativeInteger,
  isPositiveNumber,
} from '../utils/type-guards';

const SUPPORTED_TIMEOUT_ACTIONS = new Set(['auto_reject', 'escalate', 'manual_queue']);

function validatePredicate(predicate: ApprovalPredicate, path: string, errors: string[]): void {
  switch (predicate.kind) {
    case 'always':
      return;
    case 'amount_greater_than':
    case 'amount_less_than':
      if (!isDecimalString(predicate.amount)) {
        errors.push(`${path}: predicate amount must be a valid decimal string`);
      }
      return;
    case 'partner_is':
      if (!isNonEmptyString(predicate.partnerId)) {
        errors.push(`${path}: partnerId must be a non-empty string`);
      }
      return;
    case 'custom_expression':
      if (!isNonEmptyString(predicate.expression)) {
        errors.push(`${path}: custom expression must be a non-empty string`);
      }
      return;
    default:
      errors.push(`${path}: unsupported predicate kind ${(predicate as { kind?: string }).kind ?? 'unknown'}`);
  }
}

function validateCondition(
  condition: ApprovalConditionDefinition,
  path: string,
  errors: string[]
): void {
  if (!isNonEmptyString(condition.id)) {
    errors.push(`${path}: id is required`);
  }

  if (condition.description !== undefined && !isNonEmptyString(condition.description)) {
    errors.push(`${path}: description must be a non-empty string when provided`);
  }

  if (!condition.predicate) {
    errors.push(`${path}: predicate is required`);
    return;
  }

  validatePredicate(condition.predicate, `${path}.predicate`, errors);
}

function validateStep(
  step: ApprovalStepDefinition,
  roleIds: Set<RoleDefinition['roleId']>,
  path: string,
  errors: string[],
  warnings: string[]
): void {
  if (!isNonEmptyString(step.id)) {
    errors.push(`${path}: id is required`);
  }

  if (!isNonEmptyString(step.name)) {
    errors.push(`${path}: name is required`);
  }

  if (!Array.isArray(step.approverRoleIds) || step.approverRoleIds.length === 0) {
    errors.push(`${path}: approverRoleIds must contain at least one role`);
  } else {
    step.approverRoleIds.forEach((roleId, idx) => {
      if (!isNonEmptyString(roleId)) {
        errors.push(`${path}.approverRoleIds[${idx}]: roleId must be a non-empty string`);
      } else if (!roleIds.has(roleId)) {
        errors.push(`${path}.approverRoleIds[${idx}]: roleId "${roleId}" is not defined in roleDefinitions`);
      }
    });
  }

  if (!isNonNegativeInteger(step.minApprovals) || step.minApprovals <= 0) {
    errors.push(`${path}: minApprovals must be a positive integer`);
  } else if (Array.isArray(step.approverRoleIds) && step.minApprovals > step.approverRoleIds.length) {
    errors.push(`${path}: minApprovals cannot exceed the number of approverRoleIds`);
  }

  if (step.escalationRoleId && !roleIds.has(step.escalationRoleId)) {
    errors.push(`${path}: escalationRoleId "${step.escalationRoleId}" is not defined in roleDefinitions`);
  }

  if (step.onReject && !['stop', 'escalate', 'continue'].includes(step.onReject)) {
    errors.push(`${path}: onReject must be one of "stop", "escalate", or "continue"`);
  }

  if (step.requiresSequentialApproval && step.minApprovals !== step.approverRoleIds.length) {
    warnings.push(
      `${path}: requiresSequentialApproval is true but minApprovals is less than approverRoleIds length`
    );
  }
}

function validateTimeoutBehaviour(
  workflowName: string,
  timeout: ApprovalWorkflowDefinition['timeoutBehaviour'],
  roleIds: Set<RoleDefinition['roleId']>,
  errors: string[]
): void {
  if (!timeout) {
    return;
  }

  if (!isPositiveNumber(timeout.timeoutHours)) {
    errors.push(`workflow "${workflowName}": timeoutHours must be a positive number`);
  }

  if (!SUPPORTED_TIMEOUT_ACTIONS.has(timeout.onTimeout)) {
    errors.push(
      `workflow "${workflowName}": onTimeout must be one of ${Array.from(SUPPORTED_TIMEOUT_ACTIONS).join(', ')}`
    );
  }

  if (timeout.escalationRoleId && !roleIds.has(timeout.escalationRoleId)) {
    errors.push(
      `workflow "${workflowName}": escalationRoleId "${timeout.escalationRoleId}" is not defined in roleDefinitions`
    );
  }
}

export interface ApprovalValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateApprovalWorkflows(
  workflows: ReadonlyArray<ApprovalWorkflowDefinition>,
  roleDefinitions: ReadonlyArray<RoleDefinition>
): ApprovalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(workflows)) {
    return {
      errors: ['Approval configuration must contain an array of workflows'],
      warnings,
    };
  }

  const roleIds = new Set(roleDefinitions.map((role) => role.roleId));
  const workflowIds = new Set<string>();

  workflows.forEach((workflow, workflowIndex) => {
    const path = `approval.workflows[${workflowIndex}]`;

    if (!workflow || typeof workflow !== 'object') {
      errors.push(`${path}: workflow must be an object`);
      return;
    }

    if (!isNonEmptyString(workflow.workflowId)) {
      errors.push(`${path}: workflowId is required`);
    } else if (workflowIds.has(workflow.workflowId)) {
      errors.push(`${path}: workflowId "${workflow.workflowId}" must be unique`);
    } else {
      workflowIds.add(workflow.workflowId);
    }

    if (!isNonEmptyString(workflow.name)) {
      errors.push(`${path}: name is required`);
    }

    if (workflow.description !== undefined && !isNonEmptyString(workflow.description)) {
      errors.push(`${path}: description must be a non-empty string when provided`);
    }

    if (!workflow.trigger) {
      errors.push(`${path}: trigger condition is required`);
    } else {
      validateCondition(workflow.trigger, `${path}.trigger`, errors);
    }

    if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
      errors.push(`${path}: at least one approval step is required`);
    } else {
      workflow.steps.forEach((step: ApprovalStepDefinition, stepIndex: number) => {
        validateStep(step, roleIds, `${path}.steps[${stepIndex}]`, errors, warnings);
      });
    }

    if (workflow.autoApprove) {
      validateCondition(workflow.autoApprove, `${path}.autoApprove`, errors);
    }

    validateTimeoutBehaviour(workflow.name ?? workflow.workflowId, workflow.timeoutBehaviour, roleIds, errors);
  });

  return { errors, warnings };
}
