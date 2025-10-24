/**
 * Unit tests for IP Validator
 */

import { IPValidator, IPAllowlistConfig } from '../ip-validator';

describe('IPValidator', () => {
  describe('constructor and parsing', () => {
    it('should parse single IP addresses', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['192.168.1.1', '10.0.0.1'],
        allowPrivateIPs: true,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);
      expect(validator.getAllowedIPs()).toEqual(['192.168.1.1', '10.0.0.1']);
    });

    it('should parse CIDR notation', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
        allowPrivateIPs: true,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);
      expect(validator.getAllowedIPs()).toEqual(['192.168.1.0/24', '10.0.0.0/8']);
    });

    it('should throw error for invalid IP', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['256.256.256.256'],
        allowPrivateIPs: true,
        enforceAllowlist: true,
      };

      expect(() => new IPValidator(config)).toThrow('Invalid IP address: 256.256.256.256');
    });

    it('should throw error for invalid CIDR', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['192.168.1.0/33'],
        allowPrivateIPs: true,
        enforceAllowlist: true,
      };

      expect(() => new IPValidator(config)).toThrow('Invalid CIDR notation: 192.168.1.0/33');
    });
  });

  describe('isAllowed', () => {
    it('should allow all IPs when enforceAllowlist is false', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['192.168.1.1'],
        allowPrivateIPs: false,
        enforceAllowlist: false,
      };

      const validator = new IPValidator(config);

      expect(validator.isAllowed('8.8.8.8')).toBe(true);
      expect(validator.isAllowed('192.168.1.1')).toBe(true);
      expect(validator.isAllowed('10.0.0.1')).toBe(true);
    });

    it('should check exact IP matches', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['203.0.113.1', '203.0.113.2'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      expect(validator.isAllowed('203.0.113.1')).toBe(true);
      expect(validator.isAllowed('203.0.113.2')).toBe(true);
      expect(validator.isAllowed('203.0.113.3')).toBe(false);
    });

    it('should block private IPs when allowPrivateIPs is false', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['192.168.1.1', '10.0.0.1', '172.16.0.1', '127.0.0.1'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      expect(validator.isAllowed('192.168.1.1')).toBe(false);
      expect(validator.isAllowed('10.0.0.1')).toBe(false);
      expect(validator.isAllowed('172.16.0.1')).toBe(false);
      expect(validator.isAllowed('127.0.0.1')).toBe(false);
    });

    it('should allow private IPs when allowPrivateIPs is true', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['192.168.1.1', '10.0.0.1'],
        allowPrivateIPs: true,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      expect(validator.isAllowed('192.168.1.1')).toBe(true);
      expect(validator.isAllowed('10.0.0.1')).toBe(true);
    });

    it('should check CIDR ranges', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['203.0.113.0/24'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      expect(validator.isAllowed('203.0.113.0')).toBe(true);
      expect(validator.isAllowed('203.0.113.1')).toBe(true);
      expect(validator.isAllowed('203.0.113.255')).toBe(true);
      expect(validator.isAllowed('203.0.114.0')).toBe(false);
      expect(validator.isAllowed('203.0.112.255')).toBe(false);
    });

    it('should handle /32 CIDR (single host)', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['203.0.113.5/32'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      expect(validator.isAllowed('203.0.113.5')).toBe(true);
      expect(validator.isAllowed('203.0.113.4')).toBe(false);
      expect(validator.isAllowed('203.0.113.6')).toBe(false);
    });

    it('should return false for invalid IP format', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['203.0.113.1'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      expect(validator.isAllowed('not-an-ip')).toBe(false);
      expect(validator.isAllowed('256.256.256.256')).toBe(false);
      expect(validator.isAllowed('')).toBe(false);
    });
  });

  describe('addIP and removeIP', () => {
    it('should add IP to allowlist', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['203.0.113.1'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      validator.addIP('203.0.113.2');

      expect(validator.getAllowedIPs()).toContain('203.0.113.2');
      expect(validator.isAllowed('203.0.113.2')).toBe(true);
    });

    it('should not duplicate IPs', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['203.0.113.1'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      validator.addIP('203.0.113.1');

      expect(validator.getAllowedIPs().filter((ip) => ip === '203.0.113.1')).toHaveLength(1);
    });

    it('should throw error for invalid IP when adding', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: [],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      expect(() => validator.addIP('invalid-ip')).toThrow('Invalid IP address: invalid-ip');
    });

    it('should remove IP from allowlist', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['203.0.113.1', '203.0.113.2'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      validator.removeIP('203.0.113.1');

      expect(validator.getAllowedIPs()).not.toContain('203.0.113.1');
      expect(validator.isAllowed('203.0.113.1')).toBe(false);
      expect(validator.isAllowed('203.0.113.2')).toBe(true);
    });

    it('should handle removing non-existent IP', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['203.0.113.1'],
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      validator.removeIP('203.0.113.99');

      expect(validator.getAllowedIPs()).toEqual(['203.0.113.1']);
    });
  });

  describe('private IP detection', () => {
    it('should identify all private IP ranges', () => {
      const config: IPAllowlistConfig = {
        allowedIPs: ['0.0.0.0/0'], // Allow all for testing
        allowPrivateIPs: false,
        enforceAllowlist: true,
      };

      const validator = new IPValidator(config);

      // 10.0.0.0/8
      expect(validator.isAllowed('10.0.0.1')).toBe(false);
      expect(validator.isAllowed('10.255.255.255')).toBe(false);

      // 172.16.0.0/12
      expect(validator.isAllowed('172.16.0.1')).toBe(false);
      expect(validator.isAllowed('172.31.255.255')).toBe(false);

      // 192.168.0.0/16
      expect(validator.isAllowed('192.168.0.1')).toBe(false);
      expect(validator.isAllowed('192.168.255.255')).toBe(false);

      // 127.0.0.0/8 (loopback)
      expect(validator.isAllowed('127.0.0.1')).toBe(false);
      expect(validator.isAllowed('127.255.255.255')).toBe(false);

      // Public IPs should still work
      expect(validator.isAllowed('8.8.8.8')).toBe(true);
    });
  });
});
