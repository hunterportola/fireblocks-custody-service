/**
 * Unit tests for shared configuration contract
 */

import {
  ConfigValidator,
  ApprovedLoanPayload,
  OriginatorIdentity,
  STANDARD_ASSETS,
} from '../shared-config';

describe('ConfigValidator', () => {
  describe('validateLoanPayload', () => {
    const validLoanPayload: ApprovedLoanPayload = {
      loanId: 'LOAN-001',
      originatorId: 'ORIG-001',
      partnerId: 'PARTNER-001',
      amount: '10000.00',
      currency: 'USD',
      assetId: STANDARD_ASSETS.USDC_ETHEREUM,
      recipientDetails: {
        walletAddress: '0x1234567890123456789012345678901234567890',
        walletType: 'EXTERNAL_WALLET',
        name: 'John Doe',
        email: 'john@example.com',
      },
      loanTerms: {
        startDate: new Date('2024-01-01'),
        maturityDate: new Date('2025-01-01'),
        interestRate: 5.5,
        paymentFrequency: 'MONTHLY',
      },
      approval: {
        approvedAt: new Date('2023-12-25'),
        approvedBy: ['APPROVER-001', 'APPROVER-002'],
        approvalNotes: 'Approved by risk committee',
      },
      riskAssessment: {
        score: 75,
        category: 'MEDIUM',
        flags: [],
      },
      metadata: {
        externalReference: 'EXT-REF-001',
        tags: ['commercial', 'bridge-loan'],
      },
    };

    it('should validate a correct loan payload', () => {
      expect(ConfigValidator.validateLoanPayload(validLoanPayload)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(ConfigValidator.validateLoanPayload(null)).toBe(false);
      expect(ConfigValidator.validateLoanPayload(undefined)).toBe(false);
    });

    it('should reject non-object types', () => {
      expect(ConfigValidator.validateLoanPayload('string')).toBe(false);
      expect(ConfigValidator.validateLoanPayload(123)).toBe(false);
      expect(ConfigValidator.validateLoanPayload([])).toBe(false);
    });

    it('should reject missing required fields', () => {
      const requiredFields = [
        'loanId',
        'originatorId',
        'partnerId',
        'amount',
        'currency',
        'assetId',
        'recipientDetails',
        'loanTerms',
        'approval',
        'riskAssessment',
      ];

      requiredFields.forEach((field) => {
        const incomplete = { ...validLoanPayload };
        delete (incomplete as any)[field];

        expect(ConfigValidator.validateLoanPayload(incomplete)).toBe(false);
      });
    });

    it('should reject invalid amount values', () => {
      const invalidAmounts = ['', 'abc', '0', '-100', 'NaN'];

      invalidAmounts.forEach((amount) => {
        const payload = { ...validLoanPayload, amount };
        expect(ConfigValidator.validateLoanPayload(payload)).toBe(false);
      });
    });

    it('should accept valid amount strings', () => {
      const validAmounts = ['1', '100.50', '1000000', '0.01'];

      validAmounts.forEach((amount) => {
        const payload = { ...validLoanPayload, amount };
        expect(ConfigValidator.validateLoanPayload(payload)).toBe(true);
      });
    });

    it('should reject unsupported asset IDs', () => {
      const payload = { ...validLoanPayload, assetId: 'INVALID_ASSET' };
      expect(ConfigValidator.validateLoanPayload(payload)).toBe(false);
    });

    it('should accept all standard asset IDs', () => {
      Object.values(STANDARD_ASSETS).forEach((assetId) => {
        const payload = { ...validLoanPayload, assetId };
        expect(ConfigValidator.validateLoanPayload(payload)).toBe(true);
      });
    });

    it('should reject invalid risk scores', () => {
      const invalidScores = [-1, 101, 1000];

      invalidScores.forEach((score) => {
        const payload = {
          ...validLoanPayload,
          riskAssessment: { ...validLoanPayload.riskAssessment, score },
        };
        expect(ConfigValidator.validateLoanPayload(payload)).toBe(false);
      });
    });

    it('should reject null or malformed riskAssessment', () => {
      // Test null riskAssessment
      expect(
        ConfigValidator.validateLoanPayload({ ...validLoanPayload, riskAssessment: null as any })
      ).toBe(false);

      // Test undefined riskAssessment
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          riskAssessment: undefined as any,
        })
      ).toBe(false);

      // Test non-object riskAssessment
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          riskAssessment: 'invalid' as any,
        })
      ).toBe(false);

      // Test missing score
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          riskAssessment: { category: 'MEDIUM', flags: [] } as any,
        })
      ).toBe(false);

      // Test invalid score type
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          riskAssessment: { ...validLoanPayload.riskAssessment, score: '75' as any },
        })
      ).toBe(false);

      // Test missing category
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          riskAssessment: { score: 75, flags: [] } as any,
        })
      ).toBe(false);

      // Test invalid category
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          riskAssessment: { ...validLoanPayload.riskAssessment, category: 'INVALID' as any },
        })
      ).toBe(false);
    });

    it('should reject null or malformed recipientDetails', () => {
      // Test null recipientDetails
      expect(
        ConfigValidator.validateLoanPayload({ ...validLoanPayload, recipientDetails: null as any })
      ).toBe(false);

      // Test missing walletAddress
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          recipientDetails: { walletType: 'EXTERNAL_WALLET' } as any,
        })
      ).toBe(false);

      // Test invalid walletType
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          recipientDetails: {
            ...validLoanPayload.recipientDetails,
            walletType: 'INVALID_TYPE' as any,
          },
        })
      ).toBe(false);
    });

    it('should reject null or malformed loanTerms', () => {
      // Test null loanTerms
      expect(
        ConfigValidator.validateLoanPayload({ ...validLoanPayload, loanTerms: null as any })
      ).toBe(false);

      // Test invalid dates
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          loanTerms: {
            ...validLoanPayload.loanTerms,
            startDate: '2024-01-01' as any,
          },
        })
      ).toBe(false);

      // Test invalid payment frequency
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          loanTerms: {
            ...validLoanPayload.loanTerms,
            paymentFrequency: 'INVALID' as any,
          },
        })
      ).toBe(false);
    });

    it('should reject null or malformed approval', () => {
      // Test null approval
      expect(
        ConfigValidator.validateLoanPayload({ ...validLoanPayload, approval: null as any })
      ).toBe(false);

      // Test empty approvedBy array
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          approval: {
            ...validLoanPayload.approval,
            approvedBy: [],
          },
        })
      ).toBe(false);

      // Test non-Date approvedAt
      expect(
        ConfigValidator.validateLoanPayload({
          ...validLoanPayload,
          approval: {
            ...validLoanPayload.approval,
            approvedAt: '2023-12-25' as any,
          },
        })
      ).toBe(false);
    });

    it('should accept valid risk scores', () => {
      const validScores = [0, 50, 100];

      validScores.forEach((score) => {
        const payload = {
          ...validLoanPayload,
          riskAssessment: { ...validLoanPayload.riskAssessment, score },
        };
        expect(ConfigValidator.validateLoanPayload(payload)).toBe(true);
      });
    });
  });

  describe('validateOriginatorIdentity', () => {
    const validIdentity: OriginatorIdentity = {
      id: 'ORIG-001',
      name: 'ACME Lending Corp',
      registeredAt: new Date('2023-01-01'),
      status: 'active',
      metadata: {
        licenseNumber: 'LIC-123456',
      },
    };

    it('should validate a correct originator identity', () => {
      expect(ConfigValidator.validateOriginatorIdentity(validIdentity)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(ConfigValidator.validateOriginatorIdentity(null)).toBe(false);
      expect(ConfigValidator.validateOriginatorIdentity(undefined)).toBe(false);
    });

    it('should reject non-object types', () => {
      expect(ConfigValidator.validateOriginatorIdentity('string')).toBe(false);
      expect(ConfigValidator.validateOriginatorIdentity(123)).toBe(false);
      expect(ConfigValidator.validateOriginatorIdentity([])).toBe(false);
    });

    it('should reject missing required fields', () => {
      const requiredFields = ['id', 'name', 'registeredAt', 'status'];

      requiredFields.forEach((field) => {
        const incomplete = { ...validIdentity };
        delete (incomplete as any)[field];

        expect(ConfigValidator.validateOriginatorIdentity(incomplete)).toBe(false);
      });
    });

    it('should reject invalid status values', () => {
      const invalidStatuses = ['pending', 'deleted', 'unknown', ''];

      invalidStatuses.forEach((status) => {
        const identity = { ...validIdentity, status: status as any };
        expect(ConfigValidator.validateOriginatorIdentity(identity)).toBe(false);
      });
    });

    it('should accept all valid status values', () => {
      const validStatuses: Array<OriginatorIdentity['status']> = [
        'active',
        'suspended',
        'inactive',
      ];

      validStatuses.forEach((status) => {
        const identity = { ...validIdentity, status };
        expect(ConfigValidator.validateOriginatorIdentity(identity)).toBe(true);
      });
    });

    it('should reject non-Date registeredAt values', () => {
      const identity = { ...validIdentity, registeredAt: '2023-01-01' as any };
      expect(ConfigValidator.validateOriginatorIdentity(identity)).toBe(false);
    });

    it('should accept identity without metadata', () => {
      const { metadata, ...identityWithoutMetadata } = validIdentity;
      expect(ConfigValidator.validateOriginatorIdentity(identityWithoutMetadata)).toBe(true);
    });
  });
});
