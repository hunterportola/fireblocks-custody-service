import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/tenant-auth';
import { DisbursementError } from '../middleware/error-handler';

const router = Router();

const assertTenantContext = (req: Request) => {
  if (!req.tenant || !req.user) {
    throw new DisbursementError(
      'AUTH_CONTEXT_MISSING',
      'Tenant authentication context is required to access originator routes',
      500
    );
  }

  return {
    tenant: req.tenant,
    user: req.user,
    originatorId: req.tenant.originatorId,
  };
};

const deriveDisplayName = (identifier: string): string =>
  identifier
    .replace(/^lender_/, '')
    .replace(/^originator_/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Get current originator information
router.get(
  '/me',
  requirePermission('lenders:read'),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { tenant, originatorId } = assertTenantContext(req);

      const originatorInfo = {
        originatorId,
        displayName: deriveDisplayName(originatorId),
        status: tenant.status,
        turnkeySubOrgId: tenant.turnkeySubOrgId,
        wallets: {
          distribution: {
            walletId: `wallet_${originatorId}_distribution`,
            addresses: {
              sepolia: '0x742d35Cc6734C0532925a3b8D6749E58e74DBe3A',
            },
            balances: {
              sepolia: { USDC: '50000.00' },
            },
          },
        },
        policies: {
          activePolicies: ['policy_disbursement_limits', 'policy_asset_restriction'],
          consensusRequired: false,
          maxDailyAmount: '500000.00',
          maxSingleTransaction: '100000.00',
        },
        createdAt: '2024-01-15T10:00:00Z', // Mock data until real data wiring is implemented
        permissions: req.user?.permissions ?? [],
      };

      console.log(`ℹ️ [${req.context.requestId}] Retrieved originator info for: ${originatorId}`);

      res.json(originatorInfo);
    } catch (error) {
      next(error);
    }
  }
);

// Get wallet balances
router.get(
  '/wallets/balance',
  requirePermission('wallets:read'),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { originatorId } = assertTenantContext(req);

      const walletBalances = {
        originatorId,
        wallets: {
          distribution: {
            walletId: `wallet_${originatorId}_distribution`,
            balances: {
              sepolia: {
                USDC: '50000.00',
                ETH: '2.5',
              },
            },
            addresses: {
              sepolia: '0x742d35Cc6734C0532925a3b8D6749E58e74DBe3A',
            },
          },
        },
        totalUSDC: '50000.00',
        lastUpdated: new Date().toISOString(),
      };

      console.log(`💰 [${req.context.requestId}] Retrieved wallet balances for originator: ${originatorId}`);

      res.json(walletBalances);
    } catch (error) {
      next(error);
    }
  }
);

// Update originator configuration (placeholder)
router.patch(
  '/me',
  requirePermission('lenders:update'),
  [
    body('policies.maxDailyAmount')
      .optional()
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('maxDailyAmount must be a valid decimal'),
    body('policies.maxSingleTransaction')
      .optional()
      .isDecimal({ decimal_digits: '0,2' })
      .withMessage('maxSingleTransaction must be a valid decimal'),
  ],
  (req: Request, res: Response, next: NextFunction): void => {
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

      const { originatorId } = assertTenantContext(req);
      const body: unknown = req.body;
      const updates: Record<string, unknown> =
        typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};

      console.log(`🔧 [${req.context.requestId}] Updating originator config for: ${originatorId}`, updates);

      res.json({
        message: 'Configuration update accepted (pending implementation)',
        originatorId,
        updates,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as lenderRoutes };
