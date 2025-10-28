import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { requireTenantAuth, requirePermission } from '../middleware/tenant-auth';
import { DisbursementError, ResourceNotFoundError } from '../middleware/error-handler';
import { DisbursementService } from '../../services/disbursement-service';
import type { DisbursementStatus } from '../../core/database-types';
import { logWarn } from '../middleware/request-logger';

const router = Router();

router.use(requireTenantAuth());

interface DisbursementRequestBody {
  loanId: string;
  borrowerAddress: string;
  amount: string;
  assetType: 'USDC';
  chain: 'sepolia';
  metadata?: Record<string, unknown>;
}


// Removed unused interfaces and functions - using DisbursementService types

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
): DisbursementStatus | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  const allowed: ReadonlyArray<DisbursementStatus> = [
    'pending',
    'signing',
    'broadcasting',
    'completed',
    'failed',
    'pending_approval',
  ];
  return allowed.includes(normalized as DisbursementStatus)
    ? (normalized as DisbursementStatus)
    : undefined;
};

const assertTenantContext = (req: Request): { tenant: NonNullable<Request['tenant']>; user: NonNullable<Request['user']> } => {
  if (!req.tenant || !req.user) {
    throw new DisbursementError(
      'AUTH_CONTEXT_MISSING',
      'Tenant authentication context is required',
      500
    );
  }
  return { tenant: req.tenant, user: req.user };
};

const disbursementServiceFor = (req: Request): DisbursementService => {
  const { tenant } = assertTenantContext(req);
  return new DisbursementService(tenant.databaseService);
};

router.post(
  '/',
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
        const amount = Number.parseFloat(value);
        if (Number.isNaN(amount) || !Number.isFinite(amount)) {
          throw new Error('Amount must be a valid decimal');
        }
        if (amount <= 0) throw new Error('Amount must be greater than 0');
        if (amount > 1_000_000) throw new Error('Amount cannot exceed 1,000,000 USDC');
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

      const { tenant } = assertTenantContext(req);
      const disbursementRequest = req.body as DisbursementRequestBody;
      const originatorId = tenant.originatorId;

      logWarn(`💸 [${req.context.requestId}] Creating disbursement for originator: ${originatorId}`, {
        loanId: disbursementRequest.loanId,
        amount: disbursementRequest.amount,
        borrowerAddress: disbursementRequest.borrowerAddress,
        chain: disbursementRequest.chain,
      });

      if (typeof tenant.turnkeySubOrgId !== 'string' || tenant.turnkeySubOrgId.trim().length === 0) {
        res.status(400).json({
          error: 'TENANT_NOT_CONFIGURED',
          message: 'Originator is missing a Turnkey sub-organization configuration',
          timestamp: new Date().toISOString(),
          requestId: req.context.requestId,
        });
        return;
      }

      const { TurnkeyClientManager } = await import('../../core/turnkey-client');
      if (!TurnkeyClientManager.isInitialized()) {
        throw new DisbursementError(
          'SERVICE_NOT_INITIALIZED',
          'Turnkey credentials must be configured before initiating disbursements',
          503,
          {
            hint: 'Set TURNKEY_API_PUBLIC_KEY and TURNKEY_API_PRIVATE_KEY environment variables',
            originatorId,
          }
        );
      }

      const service = disbursementServiceFor(req);
      const disbursement = await service.createDisbursement({
        loanId: disbursementRequest.loanId,
        borrowerAddress: disbursementRequest.borrowerAddress,
        amount: disbursementRequest.amount,
        assetType: disbursementRequest.assetType,
        chain: disbursementRequest.chain,
        originatorId,
        turnkeySubOrgId: tenant.turnkeySubOrgId,
        metadata: disbursementRequest.metadata,
      });

      logWarn(
        `✅ [${req.context.requestId}] Disbursement created: ${disbursement.disbursementId} (${disbursement.status})`
      );

      res.status(201).json({
        ...disbursement,
        timestamp: new Date().toISOString(),
        requestId: req.context.requestId,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:disbursementId',
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

      assertTenantContext(req);
      const { disbursementId } = req.params;
      logWarn(
        `🔍 [${req.context.requestId}] Retrieving disbursement: ${disbursementId} for originator ${req.tenant?.originatorId ?? 'unknown'}`
      );

      const service = disbursementServiceFor(req);
      const disbursement = await service.getDisbursementStatus(disbursementId);

      if (!disbursement) {
        throw new ResourceNotFoundError('Disbursement', disbursementId);
      }

      res.json(disbursement);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/',
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

      const { tenant } = assertTenantContext(req);
      const { status, loanId, limit, offset } = req.query;

      const statusFilter = parseStatusFilter(status);
      const loanIdFilter = parseQueryString(loanId);
      const limitValue = parseQueryNumber(limit, 20);
      const offsetValue = parseQueryNumber(offset, 0);

      logWarn(`📋 [${req.context.requestId}] Listing disbursements for originator: ${tenant.originatorId}`, {
        status: statusFilter,
        loanId: loanIdFilter,
        limit: limitValue,
        offset: offsetValue,
      });

      const result = await tenant.databaseService.listDisbursements({
        status: statusFilter,
        loanId: loanIdFilter,
        limit: limitValue,
        offset: offsetValue,
      });

      res.json({
        disbursements: result.data,
        pagination: {
          total: result.total,
          limit: limitValue,
          offset: offsetValue,
          hasMore: offsetValue + limitValue < result.total,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/:disbursementId/retry',
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

      const { tenant } = assertTenantContext(req);
      const { disbursementId } = req.params;

      logWarn(
        `🔄 [${req.context.requestId}] Retrying disbursement: ${disbursementId} for originator ${tenant.originatorId}`,
        { reason: typeof req.body === 'object' && req.body !== null && 'reason' in req.body ? (req.body as { reason?: unknown }).reason : undefined }
      );

      const { TurnkeyClientManager } = await import('../../core/turnkey-client');
      if (!TurnkeyClientManager.isInitialized()) {
        throw new DisbursementError(
          'SERVICE_NOT_INITIALIZED',
          'Turnkey credentials must be configured before retrying disbursements',
          503,
          {
            hint: 'Set TURNKEY_API_PUBLIC_KEY and TURNKEY_API_PRIVATE_KEY environment variables',
            originatorId: tenant.originatorId,
          }
        );
      }

      const service = disbursementServiceFor(req);
      const disbursement = await service.getDisbursementStatus(disbursementId);

      if (!disbursement) {
        throw new ResourceNotFoundError('Disbursement', disbursementId);
      }

      if (disbursement.status !== 'failed') {
        throw new DisbursementError(
          'INVALID_STATUS',
          `Only failed disbursements can be retried (current status: ${disbursement.status})`,
          409
        );
      }

      if (typeof tenant.turnkeySubOrgId !== 'string' || tenant.turnkeySubOrgId.length === 0) {
        throw new DisbursementError(
          'TENANT_NOT_CONFIGURED',
          'Turnkey sub-organization is required to retry disbursements'
        );
      }

      const updated = await service.createDisbursement({
        loanId: disbursement.loanId,
        borrowerAddress: disbursement.borrowerAddress,
        amount: disbursement.amount,
        assetType: 'USDC',
        chain: disbursement.chain as DisbursementRequestBody['chain'],
        originatorId: tenant.originatorId,
        turnkeySubOrgId: tenant.turnkeySubOrgId,
        metadata: {
          ...(disbursement.metadata ?? {}),
          retryReason: typeof req.body === 'object' && req.body !== null && 'reason' in req.body ? (req.body as { reason?: unknown }).reason : undefined,
          retryParentDisbursementId: disbursementId,
        },
      });

      res.json({
        retryOf: disbursementId,
        disbursement: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as disbursementRoutes };
