import { jest } from '@jest/globals';
import type { Pool } from 'pg';
import { ControlPlaneOnboardingRepository } from '../onboarding-repository';

describe('ControlPlaneOnboardingRepository', () => {
  const mockPool = {
    query: jest.fn(),
  } as unknown as jest.Mocked<Pool>;

  let repository: ControlPlaneOnboardingRepository;

  beforeEach(() => {
    mockPool.query.mockReset();
    repository = new ControlPlaneOnboardingRepository(mockPool);
  });

  it('upserts onboarding session state', async () => {
    await repository.upsertSession({
      originatorId: 'orig-123',
      currentPhase: 'registration',
      status: 'in_progress',
      lastStep: 'register-tenant',
    });

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('INSERT INTO tenant_onboarding_sessions');
    expect(params).toEqual([
      'orig-123',
      'registration',
      'in_progress',
      'register-tenant',
      null,
      null,
    ]);
  });

  it('appends onboarding steps', async () => {
    await repository.appendStep({
      originatorId: 'orig-123',
      stepName: 'provision-database',
      phase: 'control_plane_provisioning',
      status: 'completed',
      context: { isolationType: 'dedicated_database' },
    });

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('INSERT INTO tenant_onboarding_steps');
    expect(params[0]).toBe('orig-123');
    expect(params[1]).toBe('provision-database');
    expect(params[2]).toBe('control_plane_provisioning');
    expect(params[3]).toBe('completed');
    expect(params[5]).toBe(JSON.stringify({ isolationType: 'dedicated_database' }));
  });

  it('stores Turnkey provisioning artifacts', async () => {
    await repository.storeTurnkeyArtifacts('orig-123', {
      platformConfigHash: 'hash',
      provisioningSnapshot: { wallets: [] },
    });

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('INSERT INTO turnkey_provisioning_artifacts');
    expect(params[0]).toBe('orig-123');
    expect(params[1]).toBe('hash');
  });

  it('stores automation credentials with partner scope preservation', async () => {
    await repository.storeAutomationCredentials({
      originatorId: 'orig-123',
      templateId: 'auto-default',
      partnerId: 'LP001',
      encryptedPayload: 'enc-payload',
      metadata: { scope: 'partner' },
      rotatedAt: new Date('2024-01-01T00:00:00Z'),
    });

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('INSERT INTO turnkey_automation_credentials');
    expect(params).toEqual([
      'orig-123',
      'auto-default',
      'LP001',
      'enc-payload',
      JSON.stringify({ scope: 'partner' }),
      new Date('2024-01-01T00:00:00Z'),
    ]);
  });
});
