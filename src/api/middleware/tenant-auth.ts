import { createHash } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { TenantDatabaseService, type TenantUserRecord } from '../../services/tenant-database-service';
import { ControlPlaneService } from '../../services/control-plane-service';

declare module 'express-serve-static-core' {
  interface Request {
    tenant?: TenantContext;
    user?: UserContext;
    lender?: LenderContext;
  }
}

import type { TenantStatus } from '../../core/database-types';

export interface TenantContext {
  originatorId: string;
  displayName: string;
  turnkeySubOrgId?: string;
  databaseService: TenantDatabaseService;
  status: TenantStatus;
  createdAt?: Date;
}

export interface UserContext {
  id: string;
  username: string;
  email?: string;
  userType: 'root' | 'automation' | 'role_based' | 'lender';
  role?: string;
  permissions: string[];
  turnkeyUserId?: string;
  apiKeyId: string;
  lastUsedAt?: Date;
  metadata?: Record<string, unknown>;
  userTags?: string[];
}

export interface LenderContext {
  apiKeyId: string;
  permissions: string[];
  turnkeySubOrgId?: string;
  originatorId: string;
}

interface TenantRecord {
  originatorId: string;
  displayName: string;
  turnkeySubOrgId?: string;
  status: TenantStatus;
  createdAt?: Date;
  keyId: string;
  keyName?: string;
  apiKeyHash: string;
  permissions: string[];
  expiresAt?: Date | string | number | null;
}

const coerceToDate = (value: unknown): Date | undefined => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};


class TenantAuthService {
  private static instance: TenantAuthService;
  private readonly controlPlaneService: ControlPlaneService;

  private constructor() {
    this.controlPlaneService = ControlPlaneService.getInstance();
  }

  static getInstance(): TenantAuthService {
    if (!TenantAuthService.instance) {
      TenantAuthService.instance = new TenantAuthService();
    }
    return TenantAuthService.instance;
  }

  async resolve(apiKey: string): Promise<TenantRecord | null> {
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
      return null;
    }

    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    try {
      return await this.controlPlaneService.resolveTenantByApiKey(keyHash);
    } catch (error) {
      console.error('Error resolving tenant from control plane:', error);
      // P1: Rethrow infrastructure errors instead of masking as auth failures
      throw new Error(`Control plane connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function extractApiKey(req: Request): string | null {
  const header = req.headers.authorization;

  if (!header) {
    return null;
  }

  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  if (header.startsWith('ApiKey ')) {
    return header.slice(7);
  }

  if (header.length > 20 && !header.includes(' ')) {
    return header;
  }

  return null;
}

export function requireTenantAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = extractApiKey(req);
      if (!apiKey) {
        return res.status(401).json({
          error: 'MISSING_API_KEY',
          message: 'Authorization header must include a bearer API key',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }

      const authService = TenantAuthService.getInstance();
      let tenant;
      
      try {
        tenant = await authService.resolve(apiKey);
      } catch (error) {
        // P1: Surface control plane infrastructure failures as 5xx, not 401
        console.error('Control plane infrastructure failure:', error);
        return res.status(503).json({
          error: 'SERVICE_UNAVAILABLE',
          message: 'Authentication service temporarily unavailable',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }

      if (!tenant) {
        return res.status(401).json({
          error: 'INVALID_API_KEY',
          message: 'Invalid or expired API key',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }

      if (tenant.status === 'suspended') {
        return res.status(403).json({
          error: 'TENANT_SUSPENDED',
          message: 'Tenant account is suspended',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }

      if (tenant.status === 'terminated') {
        return res.status(403).json({
          error: 'TENANT_TERMINATED',
          message: 'Tenant account has been terminated',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }

      if (
        tenant.status === 'registering' ||
        tenant.status === 'provisioning' ||
        tenant.status === 'kyc_pending'
      ) {
        return res.status(503).json({
          error: 'TENANT_PROVISIONING',
          message: 'Tenant provisioning is still in progress',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }

      // P0: Check if the control-plane API key has expired before proceeding
const apiKeyExpiry = coerceToDate(tenant.expiresAt);
if (apiKeyExpiry instanceof Date && apiKeyExpiry.getTime() <= Date.now()) {
  return res.status(401).json({
    error: 'INVALID_API_KEY',
    message: 'API key has expired',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
  });
}

      const tenantDb = await TenantDatabaseService.forOriginator(tenant.originatorId);
      let tenantUser: TenantUserRecord | null = await tenantDb.getUserByApiKey(tenant.apiKeyHash);

      if (!tenantUser) {
        tenantUser = {
          id: tenant.keyId,
          keyHash: tenant.apiKeyHash,
          userId: tenant.keyId,
          keyName: tenant.keyName,
          permissions: tenant.permissions,
          expiresAt: apiKeyExpiry,
          revokedAt: undefined,
          lastUsedAt: undefined,
          username: tenant.keyName ?? `${tenant.originatorId}_api_key`,
          email: undefined,
          userType: 'automation',
          role: undefined,
          turnkeyUserId: undefined,
          metadata: undefined,
          userTags: [],
          originatorId: tenant.originatorId,
        };
      }

      if (tenant.apiKeyHash) {
        await tenantDb.updateApiKeyLastUsed(tenant.apiKeyHash);
      }

      req.tenant = {
        originatorId: tenant.originatorId,
        displayName: tenant.displayName,
        turnkeySubOrgId: tenant.turnkeySubOrgId,
        databaseService: tenantDb,
        status: tenant.status,
        createdAt: tenant.createdAt,
      };

      req.user = mapUserRecord(tenantUser, tenant.keyId);

      if (req.context) {
        req.context.originatorId = tenant.originatorId;
        req.context.tenantDisplayName = tenant.displayName;
        req.context.userId = tenantUser.userId ?? tenantUser.id;
        req.context.userType = tenantUser.userType;
      }

      next();
      return;
    } catch (error) {
      console.error('Tenant authentication error:', error);
      return res.status(500).json({
        error: 'AUTHENTICATION_ERROR',
        message: 'Unable to authenticate tenant',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    }
  };
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'MISSING_USER_CONTEXT',
        message: 'Tenant authentication is required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `Permission required: ${permission}`,
        userPermissions: req.user.permissions,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
      return;
    }

    next();
  };
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'MISSING_USER_CONTEXT',
        message: 'Tenant authentication is required',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        error: 'INSUFFICIENT_ROLE',
        message: `Role required: ${role}`,
        userRole: req.user.role,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
      return;
    }

    next();
  };
}

export function requireTenantPermission(permission: string) {
  const auth = requireTenantAuth();
  const perm = requirePermission(permission);

  return (req: Request, res: Response, next: NextFunction): void => {
    auth(req, res, (authErr) => {
      if (authErr) {
        next(authErr);
        return;
      }

      perm(req, res, (permErr) => {
        if (permErr) {
          next(permErr);
          return;
        }

        if (req.tenant && req.user) {
          req.lender = {
            apiKeyId: req.user.apiKeyId,
            permissions: req.user.permissions,
            turnkeySubOrgId: req.tenant.turnkeySubOrgId,
            originatorId: req.tenant.originatorId,
          };
        }

        next();
      });
    });
  };
}

export const requirePermissionLegacy = requireTenantPermission;


const mapUserRecord = (user: TenantUserRecord, controlPlaneKeyId: string): UserContext => ({
  id: user.id,
  username: user.username,
  email: user.email,
  userType: user.userType,
  role: user.role,
  permissions: user.permissions,
  turnkeyUserId: user.turnkeyUserId,
  apiKeyId: controlPlaneKeyId ?? user.id,
  lastUsedAt: user.lastUsedAt,
  metadata: user.metadata,
  userTags: user.userTags,
});
