import type { TemplateString, TurnkeyEffect } from '../config/types';

export interface PolicyVariableDefinition {
  key: string;
  description?: string;
  required?: boolean;
  exampleValue?: string;
  source?: 'transaction' | 'partner' | 'wallet' | 'session' | 'custom';
}

export interface PolicyConditionTemplate {
  expression: TemplateString;
  description?: string;
  variables?: ReadonlyArray<PolicyVariableDefinition>;
}

export interface PolicyConsensusTemplate {
  expression: TemplateString;
  description?: string;
  variables?: ReadonlyArray<PolicyVariableDefinition>;
}

export type PolicyBindingType =
  | 'wallet_template'
  | 'wallet_alias'
  | 'partner'
  | 'user_tag'
  | 'automation_user'
  | 'custom';

export interface PolicyBindingDefinition {
  type: PolicyBindingType;
  target: TemplateString;
  description?: string;
}

export interface PolicyTemplate {
  templateId: string;
  policyName: string;
  effect: TurnkeyEffect;
  condition: PolicyConditionTemplate;
  consensus: PolicyConsensusTemplate;
  notes?: string;
  appliesTo?: ReadonlyArray<PolicyBindingDefinition>;
  metadata?: Record<string, string>;
  tags?: ReadonlyArray<string>;
}
