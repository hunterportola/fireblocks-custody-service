import {
  isDateInstance,
  isDecimalString,
  isNonEmptyString,
  isRecord,
  isStringArray,
} from '../utils/type-guards';

export interface OriginatorIdentity {
  id: string;
  name: string;
  registeredAt: Date;
  status: 'active' | 'suspended' | 'inactive';
  metadata?: Record<string, unknown>;
}

export interface ApprovedLoanPayload {
  loanId: string;
  originatorId: string;
  partnerId: string;
  amount: string;
  currency: string;
  assetId: string;
  recipientDetails: {
    walletAddress: string;
    walletType: 'VAULT_ACCOUNT' | 'EXTERNAL_WALLET' | 'ONE_TIME_ADDRESS';
    name?: string;
    email?: string;
  };
  loanTerms: {
    startDate: Date;
    maturityDate: Date;
    interestRate: number;
    paymentFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  };
  approval: {
    approvedAt: Date;
    approvedBy: string[];
    approvalNotes?: string;
  };
  riskAssessment: {
    score: number;
    category: 'LOW' | 'MEDIUM' | 'HIGH';
    flags?: string[];
  };
  metadata?: {
    externalReference?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  };
}

export interface AssetConfiguration {
  assetId: string;
  symbol: string;
  name: string;
  blockchain: string;
  decimals: number;
  minTransferAmount: string;
  enabled: boolean;
}

export const STANDARD_ASSETS = {
  USDC_ETHEREUM: 'USDC',
  USDC_POLYGON: 'USDC_POLYGON',
  USDC_AVALANCHE: 'USDC_AVALANCHE',
  USDT_ETHEREUM: 'USDT',
  USDT_TRON: 'USDT_TRON',
  DAI_ETHEREUM: 'DAI',
  USDC_ETHEREUM_TESTNET: 'USDC_ETH5',
  USDC_POLYGON_TESTNET: 'USDC_POLYGON_TEST',
  ETH: 'ETH',
  ETH_TESTNET: 'ETH_TEST5',
  MATIC: 'MATIC',
  MATIC_TESTNET: 'MATIC_TEST',
} as const;

const STANDARD_ASSET_SET = new Set<string>(Object.values(STANDARD_ASSETS));
const PAYMENT_FREQUENCIES = new Set([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'ANNUALLY',
]);
const RECIPIENT_TYPES = new Set(['VAULT_ACCOUNT', 'EXTERNAL_WALLET', 'ONE_TIME_ADDRESS']);
const RISK_CATEGORIES = new Set(['LOW', 'MEDIUM', 'HIGH']);

export interface TransactionStatus {
  txId: string;
  loanId: string;
  status:
    | 'SUBMITTED'
    | 'PENDING_SIGNATURE'
    | 'PENDING_AUTHORIZATION'
    | 'PENDING_3RD_PARTY'
    | 'PENDING'
    | 'BROADCASTING'
    | 'CONFIRMING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'REJECTED'
    | 'BLOCKED'
    | 'FAILED';
  submittedAt: Date;
  completedAt?: Date;
  txHash?: string;
  blockNumber?: number;
  confirmations?: number;
  fee?: {
    amount: string;
    currency: string;
  };
  errorMessage?: string;
}

export enum WebhookEventType {
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_STATUS_UPDATED = 'TRANSACTION_STATUS_UPDATED',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  VAULT_ACCOUNT_CREATED = 'VAULT_ACCOUNT_CREATED',
  VAULT_ACCOUNT_ASSET_ACTIVATED = 'VAULT_ACCOUNT_ASSET_ACTIVATED',
  BALANCE_UPDATE = 'BALANCE_UPDATE',
}

export interface WebhookPayload<T = unknown> {
  eventId: string;
  eventType: WebhookEventType;
  timestamp: Date;
  data: T;
  signature?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    version: string;
  };
}

export class ConfigValidator {
  static validateLoanPayload(payload: unknown): payload is ApprovedLoanPayload {
    if (!isRecord(payload)) {
      return false;
    }

    const loan = payload;

    if (!isNonEmptyString(loan.loanId)) return false;
    if (!isNonEmptyString(loan.originatorId)) return false;
    if (!isNonEmptyString(loan.partnerId)) return false;

    if (!isDecimalString(loan.amount) || Number(loan.amount) <= 0) return false;
    if (!isNonEmptyString(loan.currency)) return false;
    if (!isNonEmptyString(loan.assetId) || !STANDARD_ASSET_SET.has(loan.assetId)) return false;

    const recipient = loan.recipientDetails;
    if (!isRecord(recipient)) return false;
    if (!isNonEmptyString(recipient.walletAddress)) return false;
    if (!isNonEmptyString(recipient.walletType) || !RECIPIENT_TYPES.has(recipient.walletType)) return false;
    if (recipient.name !== undefined && !isNonEmptyString(recipient.name)) return false;
    if (recipient.email !== undefined && !isNonEmptyString(recipient.email)) return false;

    const loanTerms = loan.loanTerms;
    if (!isRecord(loanTerms)) return false;
    if (!isDateInstance(loanTerms.startDate)) return false;
    if (!isDateInstance(loanTerms.maturityDate)) return false;
    if (loanTerms.maturityDate.getTime() <= loanTerms.startDate.getTime()) return false;
    if (typeof loanTerms.interestRate !== 'number' || !Number.isFinite(loanTerms.interestRate)) return false;
    if (
      !isNonEmptyString(loanTerms.paymentFrequency) ||
      !PAYMENT_FREQUENCIES.has(loanTerms.paymentFrequency)
    ) {
      return false;
    }

    const approval = loan.approval;
    if (!isRecord(approval)) return false;
    if (!isDateInstance(approval.approvedAt)) return false;
    if (!isStringArray(approval.approvedBy) || approval.approvedBy.length === 0) return false;
    if (approval.approvalNotes !== undefined && !isNonEmptyString(approval.approvalNotes)) return false;

    const risk = loan.riskAssessment;
    if (!isRecord(risk)) return false;
    if (typeof risk.score !== 'number' || risk.score < 0 || risk.score > 100) return false;
    if (!isNonEmptyString(risk.category) || !RISK_CATEGORIES.has(risk.category)) return false;
    if (risk.flags !== undefined && !isStringArray(risk.flags)) return false;

    const metadata = loan.metadata;
    if (metadata !== undefined) {
      if (!isRecord(metadata)) return false;
      if (metadata.externalReference !== undefined && !isNonEmptyString(metadata.externalReference)) {
        return false;
      }
      if (metadata.tags !== undefined && !isStringArray(metadata.tags)) {
        return false;
      }
      if (metadata.customFields !== undefined && !isRecord(metadata.customFields)) {
        return false;
      }
    }

    return true;
  }

  static validateOriginatorIdentity(identity: unknown): identity is OriginatorIdentity {
    if (!isRecord(identity)) {
      return false;
    }

    const candidate = identity;

    if (!isNonEmptyString(candidate.id)) return false;
    if (!isNonEmptyString(candidate.name)) return false;
    if (!isDateInstance(candidate.registeredAt)) return false;
    if (!['active', 'suspended', 'inactive'].includes(candidate.status as string)) return false;
    if (candidate.metadata !== undefined && !isRecord(candidate.metadata)) return false;

    return true;
  }
}
