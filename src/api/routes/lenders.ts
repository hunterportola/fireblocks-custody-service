import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { requirePermission } from '../middleware/lender-auth';

const router = Router();

// Get current lender information
router.get(
  '/me',
  requirePermission('lenders:read'),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const lender = req.lender;

      // TODO: Fetch real lender data from database and Turnkey
      const lenderInfo = {
        lenderId: lender.lenderId,
        displayName: lender.lenderId.replace('lender_', '').replace('_', ' ').toUpperCase(),
        status: 'active', // provisioning | active | suspended
        turnkeySubOrgId: lender.turnkeySubOrgId,
        wallets: {
          distribution: {
            walletId: 'wallet_dist_' + lender.lenderId.split('_')[1],
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
        createdAt: '2024-01-15T10:00:00Z',
        permissions: lender.permissions,
      };

      console.log(`ℹ️ [${req.context.requestId}] Retrieved lender info for: ${lender.lenderId}`);
      
      res.json(lenderInfo);
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
      const lender = req.lender;

      // TODO: Fetch real balance data from blockchain
      const walletBalances = {
        lenderId: lender.lenderId,
        wallets: {
          distribution: {
            walletId: 'wallet_dist_' + lender.lenderId.split('_')[1],
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

      console.log(`💰 [${req.context.requestId}] Retrieved wallet balances for: ${lender.lenderId}`);
      
      res.json(walletBalances);
    } catch (error) {
      next(error);
    }
  }
);

// Update lender configuration (for future use)
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

      const lender = req.lender;
      const body: unknown = req.body;
      const updates: Record<string, unknown> =
        typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};

      console.log(`🔧 [${req.context.requestId}] Updating lender config for: ${lender.lenderId}`, updates);

      // TODO: Implement actual lender configuration updates
      // This would involve updating Turnkey policies and database records

      res.json({
        message: 'Lender configuration updated successfully',
        lenderId: lender.lenderId,
        updates: updates,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as lenderRoutes };
