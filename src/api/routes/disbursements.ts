import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/lender-auth';
import { DisbursementError, ResourceNotFoundError } from '../middleware/error-handler';
import { DisbursementService } from '../../services/disbursement-service';
import { 
  getMVPCustodyService, 
  convertDisbursementRequest 
} from '../../services/mvp-custody-integration';
import { DatabaseService } from '../../services/database-service';
import type { DisbursementStatus as StoredDisbursementStatus } from '../../services/disbursement-service';

const router = Router();

// Lazy-load services to avoid initialization issues
const getDisbursementService = (): DisbursementService => {
  return new DisbursementService();
};

const getDatabaseService = (): DatabaseService => {
  return DatabaseService.getInstance();
};

// Types for disbursement operations
interface DisbursementRequest {
  loanId: string;
  borrowerAddress: string;
  amount: string;
  assetType: 'USDC';
  chain: 'sepolia';
  metadata?: {
    borrowerKycStatus?: string;
    loanType?: string;
    invoiceId?: string;
    riskScore?: string;
  };
}

interface DisbursementResponse {
  disbursementId: string;
  status: 'pending' | 'signing' | 'broadcasting' | 'completed' | 'failed' | 'pending_approval';
  loanId: string;
  amount: string;
  borrowerAddress: string;
  chain: string;
  txHash?: string;
  turnkeyActivityId?: string;
  timeline?: {
    initiated?: string;
    policiesEvaluated?: string;
    signed?: string;
    broadcasted?: string;
    confirmed?: string;
  };
  approvalUrl?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  originatorId?: string;
  turnkeySubOrgId?: string;
  metadata?: Record<string, unknown>;
}

const generateDisbursementId = (): string =>
  `disb_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error.trim();
  }
  return 'Unknown error';
};

const parseQueryString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseQueryNumber = (value: unknown, defaultValue: number): number => {
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
};

const parseStatusFilter = (
  value: unknown
): StoredDisbursementStatus['status'] | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  const allowed: ReadonlyArray<StoredDisbursementStatus['status']> = [
    'pending',
    'signing',
    'broadcasting',
    'completed',
    'failed',
    'pending_approval',
  ];
  return allowed.includes(normalized as StoredDisbursementStatus['status'])
    ? (normalized as StoredDisbursementStatus['status'])
    : undefined;
};

// Create new disbursement ⭐ CORE ENDPOINT
router.post('/',
  requirePermission('disbursements:create'),
  [
    body('loanId')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('loanId is required and must be 1-100 characters'),
    body('borrowerAddress')
      .isString()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('borrowerAddress must be a valid Ethereum address'),
    body('amount')
      .isDecimal({ decimal_digits: '0,6' })
      .custom((value: string) => {
        const amount = parseFloat(value);
        if (amount <= 0) throw new Error('Amount must be greater than 0');
        if (amount > 1000000) throw new Error('Amount cannot exceed 1,000,000 USDC');
        return true;
      })
      .withMessage('amount must be a valid positive decimal'),
    body('assetType')
      .equals('USDC')
      .withMessage('assetType must be USDC'),
    body('chain')
      .isIn(['sepolia'])
      .withMessage('chain must be sepolia'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('metadata must be an object'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString(),
          requestId: req.context.requestId,
        });
        return;
      }

      const lender = req.lender;
      const disbursementRequest = req.body as DisbursementRequest;

      console.warn(`💸 [${req.context.requestId}] Creating disbursement for lender: ${lender.lenderId}`, {
        loanId: disbursementRequest.loanId,
        amount: disbursementRequest.amount,
        borrowerAddress: disbursementRequest.borrowerAddress,
        chain: disbursementRequest.chain,
      });

      // Validate that lender has a Turnkey sub-organization
      if (lender.turnkeySubOrgId == null || lender.turnkeySubOrgId.trim() === '') {
        res.status(400).json({
          error: 'INVALID_LENDER_CONFIG',
          message: 'Lender does not have a configured Turnkey sub-organization',
          timestamp: new Date().toISOString(),
          requestId: req.context.requestId,
        });
        return;
      }

      // Use MVP Custody Service if available, fallback to direct service
      let disbursement: DisbursementResponse;
      let custodyService: ReturnType<typeof getMVPCustodyService> | undefined;
      
      // Check if custody service is available
      try {
        custodyService = getMVPCustodyService();
      } catch (error) {
        console.warn('⚠️ Custody service not initialized, using direct disbursement service', {
          error,
        });
      }
      
      if (custodyService) {
        // Use integrated custody service
        const custodyRequest = convertDisbursementRequest(disbursementRequest, lender.lenderId);
        
        console.warn(`🔄 Using TurnkeyCustodyService for originator: ${custodyRequest.originatorId}`);
        
        const result = await custodyService.initiateDisbursement(custodyRequest);
        const disbursementId = generateDisbursementId();
        const createdAt = new Date().toISOString();
        const hasTransactionHash =
          typeof result.transactionHash === 'string' && result.transactionHash.trim().length > 0;
        
        // Convert custody result to API response format
        disbursement = {
          disbursementId,
          status:
            result.status === 'completed'
              ? 'completed'
              : result.status === 'consensus_required'
              ? 'pending_approval'
              : result.status === 'failed'
              ? 'failed'
              : 'pending',
          loanId: result.loanId,
          amount: disbursementRequest.amount,
          borrowerAddress: disbursementRequest.borrowerAddress,
          chain: disbursementRequest.chain,
          txHash: result.transactionHash,
          turnkeyActivityId: result.turnkeyActivityId,
          timeline: {
            initiated: createdAt,
            broadcasted: hasTransactionHash ? createdAt : undefined,
          },
          error: result.status === 'failed' ? {
            code: 'DISBURSEMENT_FAILED',
            message: resolveErrorMessage(result.error),
            details: result.details,
          } : undefined,
          originatorId: custodyRequest.originatorId,
          turnkeySubOrgId: lender.turnkeySubOrgId,
          metadata: {
            ...disbursementRequest.metadata,
            custodyStatus: result.status,
          },
        };

        const storedRecord: StoredDisbursementStatus = {
          disbursementId,
          status: disbursement.status,
          loanId: result.loanId,
          amount: disbursementRequest.amount,
          borrowerAddress: disbursementRequest.borrowerAddress,
          chain: disbursementRequest.chain,
          txHash: result.transactionHash,
          turnkeyActivityId: result.turnkeyActivityId,
          timeline: disbursement.timeline,
          error: disbursement.error,
          originatorId: custodyRequest.originatorId,
          turnkeySubOrgId: lender.turnkeySubOrgId,
          metadata: disbursement.metadata,
        };

        try {
          await getDatabaseService().saveDisbursement(storedRecord);
        } catch (dbError) {
          console.error('Failed to save disbursement to database', {
            error: dbError,
            disbursementId: storedRecord.disbursementId,
          });
          // Continue - the disbursement was successful even if DB save failed
        }
        
      } else {
        // Fallback to direct disbursement service
        // First check if TurnkeyClientManager is initialized to avoid throwing in constructor
        const { TurnkeyClientManager } = await import('../../core/turnkey-client');
        if (!TurnkeyClientManager.isInitialized()) {
          console.error('Cannot use fallback disbursement service: TurnkeyClientManager not initialized', {
            lenderId: lender.lenderId,
            requestId: req.context.requestId,
          });
          
          throw new DisbursementError(
            'SERVICE_NOT_INITIALIZED',
            'Disbursement service is not available. Turnkey credentials must be configured.',
            503,
            {
              message: 'The disbursement service requires Turnkey API credentials to be configured',
              hint: 'Set TURNKEY_API_PUBLIC_KEY and TURNKEY_API_PRIVATE_KEY environment variables',
              lenderId: lender.lenderId,
            }
          );
        }
        
        try {
          const disbursementService = getDisbursementService();
          disbursement = await disbursementService.createDisbursement({
            loanId: disbursementRequest.loanId,
            borrowerAddress: disbursementRequest.borrowerAddress,
            amount: disbursementRequest.amount,
            assetType: disbursementRequest.assetType,
            chain: 'sepolia',
            lenderId: lender.lenderId,
            turnkeySubOrgId: lender.turnkeySubOrgId,
            metadata: disbursementRequest.metadata,
          });
        } catch (fallbackError) {
          // Unexpected error in disbursement service
          console.error('Failed to create disbursement in fallback path', {
            error: fallbackError,
            lenderId: lender.lenderId,
          });
          
          throw new DisbursementError(
            'DISBURSEMENT_CREATION_FAILED',
            'Failed to create disbursement',
            500,
            {
              message: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
            }
          );
        }
      }

      // Disbursement is already stored in database by the service

      console.warn(`✅ [${req.context.requestId}] Disbursement created: ${disbursement.disbursementId} (${disbursement.status})`);

      if (disbursement.status === 'failed') {
        throw new DisbursementError(
          'DISBURSEMENT_FAILED',
          disbursement.error?.message ?? 'Disbursement could not be submitted',
          422,
          disbursement.error ?? undefined
        );
      }

      // Return 202 for async processing, 200 if completed immediately
      const statusCode = disbursement.status === 'completed' ? 200 : 202;
      res.status(statusCode).json(disbursement);
    } catch (error) {
      next(error);
    }
  }
);

// Get disbursement status
router.get('/:disbursementId',
  requirePermission('disbursements:read'),
  [
    param('disbursementId')
      .isString()
      .matches(/^disb_[a-zA-Z0-9_]+$/)
      .withMessage('disbursementId must be a valid disbursement ID'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString(),
          requestId: req.context.requestId,
        });
        return;
      }

      const lender = req.lender;
      const { disbursementId } = req.params;

      console.warn(`🔍 [${req.context.requestId}] Retrieving disbursement: ${disbursementId} for lender: ${lender.lenderId}`);

      // Get disbursement from database
      const disbursementService = getDisbursementService();
      const disbursement = await disbursementService.getDisbursementStatus(disbursementId);

      if (disbursement == null) {
        throw new ResourceNotFoundError('Disbursement', disbursementId);
      }

      // TODO: Add lender authorization check - ensure disbursement belongs to this lender
      // TODO: Update status from blockchain if needed
      res.json(disbursement);
    } catch (error) {
      next(error);
    }
  }
);

// List disbursements with filtering
router.get('/',
  requirePermission('disbursements:read'),
  [
    query('status')
      .optional()
      .isIn(['pending', 'signing', 'broadcasting', 'completed', 'failed', 'pending_approval'])
      .withMessage('status must be a valid disbursement status'),
    query('loanId')
      .optional()
      .isString()
      .withMessage('loanId must be a string'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('offset must be non-negative'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString(),
          requestId: req.context.requestId,
        });
        return;
      }

      const lender = req.lender;
      const { status, loanId, limit, offset } = req.query;

      const statusFilter = parseStatusFilter(status);
      const loanIdFilter = parseQueryString(loanId);
      const limitValue = parseQueryNumber(limit, 20);
      const offsetValue = parseQueryNumber(offset, 0);

      console.warn(`📋 [${req.context.requestId}] Listing disbursements for lender: ${lender.lenderId}`, {
        status: statusFilter,
        loanId: loanIdFilter,
        limit: limitValue,
        offset: offsetValue,
      });

      // Query database with filters
      const databaseService = getDatabaseService();
      const result = await databaseService.listDisbursements({
        // TODO: Add lender/originator filter once we have proper mapping
        status: statusFilter,
        loanId: loanIdFilter,
        limit: limitValue,
        offset: offsetValue,
      });

      const response = {
        disbursements: result.disbursements,
        pagination: {
          total: result.total,
          limit: limitValue,
          offset: offsetValue,
          hasMore: offsetValue + limitValue < result.total,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// Retry failed disbursement
router.post('/:disbursementId/retry',
  requirePermission('disbursements:create'),
  [
    param('disbursementId')
      .isString()
      .matches(/^disb_[a-zA-Z0-9_]+$/)
      .withMessage('disbursementId must be a valid disbursement ID'),
    body('reason')
      .optional()
      .isString()
      .withMessage('reason must be a string'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString(),
          requestId: req.context.requestId,
        });
        return;
      }

      const lender = req.lender;
      const { disbursementId } = req.params;
      const { reason } = req.body as { reason?: string };

      console.warn(`🔄 [${req.context.requestId}] Retrying disbursement: ${disbursementId} for lender: ${lender.lenderId}`, {
        reason,
      });

      // Get disbursement from database
      const disbursementService = getDisbursementService();
      const disbursement = await disbursementService.getDisbursementStatus(disbursementId);
      
      if (disbursement == null) {
        throw new ResourceNotFoundError('Disbursement', disbursementId);
      }

      if (disbursement.status !== 'failed') {
        res.status(400).json({
          error: 'INVALID_STATUS',
          message: 'Only failed disbursements can be retried',
          timestamp: new Date().toISOString(),
          requestId: req.context.requestId,
        });
        return;
      }

      // TODO: Implement actual retry logic using DisbursementService
      // For now, just update the status in database
      disbursement.status = 'pending';
      disbursement.timeline = {
        ...disbursement.timeline,
        initiated: new Date().toISOString(),
      };
      
      const databaseService = getDatabaseService();
      await databaseService.saveDisbursement(disbursement);

      res.json({
        message: 'Disbursement retry initiated',
        disbursementId,
        status: disbursement.status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as disbursementRoutes };
