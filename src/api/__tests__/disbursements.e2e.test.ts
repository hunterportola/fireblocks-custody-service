import { request as httpRequest } from 'node:http';
import { AddressInfo } from 'node:net';
import { URL } from 'node:url';
import { CustodyAPIServer } from '../server';

jest.mock('../../services/mvp-custody-integration', () => ({
  getMVPCustodyService: jest.fn(),
  convertDisbursementRequest: jest.fn(),
}));

jest.mock('../../services/database-service', () => ({
  DatabaseService: {
    getInstance: jest.fn(),
  },
}));

import { getMVPCustodyService, convertDisbursementRequest } from '../../services/mvp-custody-integration';
import { DatabaseService } from '../../services/database-service';

const initiateDisbursementMock = jest.fn();
const convertDisbursementRequestMock = convertDisbursementRequest as jest.MockedFunction<typeof convertDisbursementRequest>;
const getCustodyServiceMock = getMVPCustodyService as jest.MockedFunction<typeof getMVPCustodyService>;
const saveDisbursementMock = jest.fn();

describe('Disbursements API (E2E)', () => {
  let server: import('http').Server | undefined;
  let baseUrl = '';

  beforeEach(() => {
    initiateDisbursementMock.mockReset();
    convertDisbursementRequestMock.mockReset();
    saveDisbursementMock.mockReset();

    getCustodyServiceMock.mockReturnValue({
      initiateDisbursement: initiateDisbursementMock,
    } as any);

    (DatabaseService.getInstance as jest.Mock).mockReturnValue({
      saveDisbursement: saveDisbursementMock,
      getDisbursement: jest.fn().mockResolvedValue(null),
      listDisbursements: jest.fn().mockResolvedValue({ disbursements: [], total: 0 }),
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server = undefined;
      baseUrl = '';
    }
  });

  const startServer = async (): Promise<void> => {
    const custodyServer = new CustodyAPIServer({
      port: 0,
      environment: 'development',
      corsOrigins: [],
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 1_000,
    });

    const app = custodyServer.getApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server?.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  };

  const postJson = async (
    url: string,
    body: Record<string, unknown>,
    extraHeaders: Record<string, string>
  ): Promise<{ status: number; body: Record<string, unknown> }> => {
    const target = new URL(url);

    return new Promise((resolve, reject) => {
      const req = httpRequest(
        {
          method: 'POST',
          hostname: target.hostname,
          port: target.port,
          path: target.pathname,
          headers: {
            'Content-Type': 'application/json',
            ...extraHeaders,
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer | string) => {
            const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            chunks.push(bufferChunk);
          });
          res.on('end', () => {
            const payload = Buffer.concat(chunks).toString('utf-8');
            resolve({
              status: res.statusCode ?? 0,
              body: payload.length > 0 ? (JSON.parse(payload) as Record<string, unknown>) : {},
            });
          });
        }
      );

      req.on('error', reject);
      req.write(JSON.stringify(body));
      req.end();
    });
  };

  it('returns pending approval when Turnkey requires consensus', async () => {
    await startServer();

    const borrowerAddress = '0x77a86aC9F3AAaAa7777777777777777777777777';

    convertDisbursementRequestMock.mockReturnValue({
      originatorId: 'originator_demo',
      partnerId: 'partner_default',
      loanId: 'loan-123',
      amount: '10.500000',
      assetSymbol: 'USDC',
      chainId: '11155111',
      borrowerAddress,
    });

    initiateDisbursementMock.mockResolvedValue({
      loanId: 'loan-123',
      status: 'consensus_required',
      turnkeyActivityId: 'activity-xyz',
      details: { requiredApprovals: 2, currentApprovals: 1 },
      error: { code: 'CONSENSUS_REQUIRED', message: 'Consensus required' },
    });

    const { status, body } = await postJson(
      `${baseUrl}/api/v1/disbursements`,
      {
        loanId: 'loan-123',
        borrowerAddress,
        amount: '10.500000',
        assetType: 'USDC',
        chain: 'sepolia',
        metadata: { borrowerKycStatus: 'verified' },
      },
      {
        Authorization: 'Bearer lender_acme_corp_api_key_xyz123',
      }
    );

    expect(status).toBe(202);

    expect(body).toMatchObject({
      status: 'pending_approval',
      loanId: 'loan-123',
      borrowerAddress,
      chain: 'sepolia',
      turnkeyActivityId: 'activity-xyz',
    });
    expect(typeof body.disbursementId).toBe('string');
    expect((body.disbursementId as string) ?? '').toMatch(/^disb_/);

    expect(initiateDisbursementMock).toHaveBeenCalledTimes(1);
    expect(convertDisbursementRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ loanId: 'loan-123', chain: 'sepolia' }),
      'lender_acme_corp'
    );
    expect(saveDisbursementMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending_approval',
        loanId: 'loan-123',
        originatorId: 'originator_demo',
      })
    );
  });
});
