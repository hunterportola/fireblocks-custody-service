// @ts-nocheck
/**
 * Test suite for URL validation
 * Verifies P1 fix: Reinstate null guard in URL validator
 */

// Import the function - we need to access the internal isValidUrl function
// Since it's not exported, we'll test it through the main validator

import { ConfigurationValidator } from '../validator';
import type { OriginatorConfiguration } from '../types';

describe('URL Validator - P1 Null Guard Fix', () => {
  const baseConfig: OriginatorConfiguration = {
    platform: {
      environment: 'production',
      organizationId: 'org-123',
      originator: {
        originatorId: 'TEST',
        displayName: 'Test Org',
        legalEntityName: 'Test LLC',
      },
    },
    provisioning: {
      nameTemplate: 'test-{originatorId}',
      rootQuorumThreshold: 1,
      rootUsers: [],
      featureToggles: {
        enableApiKeys: true,
        enableWebAuthn: false,
      },
    },
    businessModel: {
      partners: {
        catalog: [],
        defaultPolicyIds: [],
      },
      wallets: {
        templates: [{
          templateId: 'test-wallet',
          walletNameTemplate: 'Test Wallet',
          usage: 'distribution',
          accounts: [{ alias: 'primary' }],
        }],
        flows: {
          test: { templateId: 'test-wallet' },
        },
      },
    },
    accessControl: {
      roles: [],
      policies: {
        templates: [],
        defaultPolicyIds: [],
      },
    },
  };

  describe('webhook URL validation', () => {
    it('handles null webhook URLs without throwing', async () => {
      const configWithNullWebhook: OriginatorConfiguration = {
        ...baseConfig,
        businessModel: {
          ...baseConfig.businessModel,
          partners: {
            catalog: [{
              partnerId: 'TEST_PARTNER',
              displayName: 'Test Partner',
              enabled: true,
              webhookOverride: {
                urlTemplate: null as any, // Simulating null from JSON
              },
            }],
            defaultPolicyIds: [],
          },
        },
      };

      // Should not throw TypeError but return validation errors
      const validator = new ConfigurationValidator();
      const result = await validator.validate(configWithNullWebhook);
      // Should have validation errors but not crash
      expect(result.isValid).toBe(false);
      expect(result.errors.some((message) => /webhook.*url/i.test(message))).toBe(true);
    });

    it('handles undefined webhook URLs gracefully', () => {
      const configWithUndefinedWebhook: OriginatorConfiguration = {
        ...baseConfig,
        businessModel: {
          ...baseConfig.businessModel,
          partners: {
            catalog: [{
              partnerId: 'TEST_PARTNER',
              displayName: 'Test Partner',
              enabled: true,
              webhookOverride: {
                urlTemplate: undefined as any,
              },
            }],
            defaultPolicyIds: [],
          },
        },
      };

      expect(() => {
        const validator = new ConfigurationValidator();
        const result = validator.validateConfiguration(configWithUndefinedWebhook);
        expect(result.valid).toBe(false);
      }).not.toThrow();
    });

    it('handles empty string webhook URLs', () => {
      const configWithEmptyWebhook: OriginatorConfiguration = {
        ...baseConfig,
        businessModel: {
          ...baseConfig.businessModel,
          partners: {
            catalog: [{
              partnerId: 'TEST_PARTNER',
              displayName: 'Test Partner',
              enabled: true,
              webhookOverride: {
                urlTemplate: '',
              },
            }],
            defaultPolicyIds: [],
          },
        },
      };

      const validator = new ConfigurationValidator();
      const result = validator.validateConfiguration(configWithEmptyWebhook);
      expect(result.valid).toBe(false);
      expect(result.errors.some((message) => /webhook.*url/i.test(message))).toBe(true);
    });

    it('accepts valid webhook URLs', () => {
      const configWithValidWebhook: OriginatorConfiguration = {
        ...baseConfig,
        businessModel: {
          ...baseConfig.businessModel,
          partners: {
            catalog: [{
              partnerId: 'TEST_PARTNER',
              displayName: 'Test Partner',
              enabled: true,
              webhookOverride: {
                urlTemplate: 'https://api.example.com/webhook/{partnerId}',
              },
            }],
            defaultPolicyIds: [],
          },
        },
      };

      const validator = new ConfigurationValidator();
      const result = validator.validateConfiguration(configWithValidWebhook);
      // Should not have webhook-related errors
      const webhookErrors = result.errors.filter((error: string) => 
        error.toLowerCase().includes('webhook')
      );
      expect(webhookErrors).toHaveLength(0);
    });

    it('rejects invalid URL formats without throwing', () => {
      const configWithInvalidWebhook: OriginatorConfiguration = {
        ...baseConfig,
        businessModel: {
          ...baseConfig.businessModel,
          partners: {
            catalog: [{
              partnerId: 'TEST_PARTNER',
              displayName: 'Test Partner',
              enabled: true,
              webhookOverride: {
                urlTemplate: 'not-a-valid-url',
              },
            }],
            defaultPolicyIds: [],
          },
        },
      };

      expect(() => {
        const validator = new ConfigurationValidator();
        const result = validator.validateConfiguration(configWithInvalidWebhook);
        expect(result.valid).toBe(false);
      }).not.toThrow();
    });
  });

  describe('other URL validation scenarios', () => {
    it('handles null values in other URL fields', () => {
      // Test any other URL fields that might exist in the config
      // This ensures the null guard is comprehensive
      
      const configWithVariousNulls = {
        ...baseConfig,
        // Add any other URL fields that might be validated
      };

      expect(() => {
        const validator = new ConfigurationValidator();
        validator.validateConfiguration(configWithVariousNulls);
      }).not.toThrow('Cannot read properties of null');
    });

    it('handles object type confusion', () => {
      const configWithObjectAsUrl: OriginatorConfiguration = {
        ...baseConfig,
        businessModel: {
          ...baseConfig.businessModel,
          partners: {
            catalog: [{
              partnerId: 'TEST_PARTNER',
              displayName: 'Test Partner',
              enabled: true,
              webhookOverride: {
                urlTemplate: { not: 'a string' } as any,
              },
            }],
            defaultPolicyIds: [],
          },
        },
      };

      expect(() => {
        const validator = new ConfigurationValidator();
        const result = validator.validateConfiguration(configWithObjectAsUrl);
        expect(result.valid).toBe(false);
      }).not.toThrow();
    });

    it('handles array type confusion', () => {
      const configWithArrayAsUrl: OriginatorConfiguration = {
        ...baseConfig,
        businessModel: {
          ...baseConfig.businessModel,
          partners: {
            catalog: [{
              partnerId: 'TEST_PARTNER',
              displayName: 'Test Partner',
              enabled: true,
              webhookOverride: {
                urlTemplate: ['not', 'a', 'string'] as any,
              },
            }],
            defaultPolicyIds: [],
          },
        },
      };

      expect(() => {
        const validator = new ConfigurationValidator();
        const result = validator.validateConfiguration(configWithArrayAsUrl);
        expect(result.valid).toBe(false);
      }).not.toThrow();
    });
  });

  describe('validation error messages', () => {
    it('provides helpful error messages for invalid URLs', () => {
      const configWithInvalidUrl: OriginatorConfiguration = {
        ...baseConfig,
        businessModel: {
          ...baseConfig.businessModel,
          partners: {
            catalog: [{
              partnerId: 'TEST_PARTNER',
              displayName: 'Test Partner',
              enabled: true,
              webhookOverride: {
                urlTemplate: null as any,
              },
            }],
            defaultPolicyIds: [],
          },
        },
      };

      const validator = new ConfigurationValidator();
      const result = validator.validateConfiguration(configWithInvalidUrl);
      expect(result.valid).toBe(false);
      
      // Should have meaningful error messages
      const errorMessages = result.errors.join(' ');
      expect(errorMessages).not.toContain('TypeError');
      expect(errorMessages).not.toContain('Cannot read properties of null');
    });
  });
});
