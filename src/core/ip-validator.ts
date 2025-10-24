/**
 * IP Address validation and allowlist management
 * Ensures only authorized IPs can interact with the service
 */

import * as net from 'net';

export interface IPAllowlistConfig {
  allowedIPs: string[];
  allowPrivateIPs: boolean;
  enforceAllowlist: boolean;
}

export class IPValidator {
  private readonly config: IPAllowlistConfig;
  private readonly allowedCIDRs: Array<{ network: string; prefix: number }> = [];

  constructor(config: IPAllowlistConfig) {
    this.config = config;
    this.parseAllowedIPs();
  }

  /**
   * Parse allowed IPs and CIDR ranges
   */
  private parseAllowedIPs(): void {
    // Clear existing CIDR entries before re-parsing
    this.allowedCIDRs.length = 0;

    for (const entry of this.config.allowedIPs) {
      if (entry.includes('/')) {
        // CIDR notation
        const [network, prefixStr] = entry.split('/');
        const prefix = parseInt(prefixStr, 10);

        if (!this.isValidIPv4(network) || prefix < 0 || prefix > 32) {
          throw new Error(`Invalid CIDR notation: ${entry}`);
        }

        this.allowedCIDRs.push({ network, prefix });
      } else {
        // Single IP
        if (!this.isValidIPv4(entry)) {
          throw new Error(`Invalid IP address: ${entry}`);
        }
      }
    }
  }

  /**
   * Validate if an IP address is allowed
   */
  isAllowed(ipAddress: string): boolean {
    if (!this.config.enforceAllowlist) {
      return true;
    }

    if (!this.isValidIPv4(ipAddress)) {
      return false;
    }

    // Check if it's a private IP
    if (!this.config.allowPrivateIPs && this.isPrivateIP(ipAddress)) {
      return false;
    }

    // Check exact matches
    if (this.config.allowedIPs.includes(ipAddress)) {
      return true;
    }

    // Check CIDR ranges
    for (const cidr of this.allowedCIDRs) {
      if (this.isIPInCIDR(ipAddress, cidr.network, cidr.prefix)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if IP is valid IPv4
   */
  private isValidIPv4(ip: string): boolean {
    return net.isIPv4(ip);
  }

  /**
   * Check if IP is in private range
   */
  private isPrivateIP(ip: string): boolean {
    const octets = ip.split('.').map((o) => parseInt(o, 10));

    // 10.0.0.0/8
    if (octets[0] === 10) return true;

    // 172.16.0.0/12
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;

    // 192.168.0.0/16
    if (octets[0] === 192 && octets[1] === 168) return true;

    // 127.0.0.0/8 (loopback)
    if (octets[0] === 127) return true;

    return false;
  }

  /**
   * Check if IP is within CIDR range
   */
  private isIPInCIDR(ip: string, network: string, prefixLength: number): boolean {
    const ipBinary = this.ipToBinary(ip);
    const networkBinary = this.ipToBinary(network);

    const relevantBits = ipBinary.substring(0, prefixLength);
    const networkBits = networkBinary.substring(0, prefixLength);

    return relevantBits === networkBits;
  }

  /**
   * Convert IP to binary string
   */
  private ipToBinary(ip: string): string {
    return ip
      .split('.')
      .map((octet) => parseInt(octet, 10).toString(2).padStart(8, '0'))
      .join('');
  }

  /**
   * Get list of allowed IPs (for logging/debugging)
   */
  getAllowedIPs(): string[] {
    return [...this.config.allowedIPs];
  }

  /**
   * Add IP to allowlist (runtime modification)
   */
  addIP(ip: string): void {
    if (!this.isValidIPv4(ip)) {
      throw new Error(`Invalid IP address: ${ip}`);
    }

    if (!this.config.allowedIPs.includes(ip)) {
      this.config.allowedIPs.push(ip);
      this.parseAllowedIPs(); // Re-parse to update CIDR cache
    }
  }

  /**
   * Remove IP from allowlist (runtime modification)
   */
  removeIP(ip: string): void {
    const index = this.config.allowedIPs.indexOf(ip);
    if (index !== -1) {
      this.config.allowedIPs.splice(index, 1);
      this.parseAllowedIPs(); // Re-parse to update CIDR cache
    }
  }
}
