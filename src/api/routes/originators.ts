import { Router, type Request, type Response, type NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { requireControlPlaneAuth } from '../middleware/control-plane-auth';
import { originatorRegistrationValidators } from '../validators/originator-onboarding';
import type { OriginatorRegistrationData } from '../../services/control-plane-service';
import { OriginatorOnboardingService } from '../../services/onboarding/originator-onboarding-service';

export const createOriginatorRoutes = (
  providedService?: OriginatorOnboardingService
) => {
  const router = Router();
  let onboardingService: OriginatorOnboardingService | undefined = providedService;

  const ensureOnboardingService = (): OriginatorOnboardingService => {
    if (!onboardingService) {
      onboardingService = new OriginatorOnboardingService();
    }
    return onboardingService;
  };

  const resolveOnboardingService = (
    res: Response,
    requestId: string | string[] | undefined
  ): OriginatorOnboardingService | null => {
    try {
      return ensureOnboardingService();
    } catch (error) {
      console.error('Onboarding service initialization failed:', error);
      res.status(503).json({
        error: 'ONBOARDING_SERVICE_UNAVAILABLE',
        message: 'Tenant onboarding is not configured',
        timestamp: new Date().toISOString(),
        requestId: requestId ?? 'unknown',
      });
      return null;
    }
  };

  router.post(
    '/',
    requireControlPlaneAuth(),
    originatorRegistrationValidators,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      try {
        const service = resolveOnboardingService(res, req.headers['x-request-id']);
        if (!service) {
          return;
        }

        const payload = req.body as OriginatorRegistrationData;
        const result = await service.registerOriginator(payload);
        res.status(201).json({ result });
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/:originatorId/status',
    requireControlPlaneAuth(),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const service = resolveOnboardingService(res, req.headers['x-request-id']);
        if (!service) {
          return;
        }

        const status = await service.getStatus(req.params.originatorId);
        res.json(status);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};
