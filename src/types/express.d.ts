import type { TenantContext, UserContext } from '../api/middleware/tenant-auth';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: UserContext;
      context?: {
        requestId: string;
        originatorId?: string;
        tenantDisplayName?: string;
        userId?: string;
        userType?: string;
      };
    }
  }
}