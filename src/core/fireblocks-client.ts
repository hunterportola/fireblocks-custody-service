/**
 * Fireblocks SDK client initialization and management
 * Provides a singleton instance of the Fireblocks SDK client
 */

import { Fireblocks, BasePath } from "@fireblocks/ts-sdk";

/**
 * Manages the Fireblocks SDK client instance
 * Ensures a single client is used throughout the application
 */
export class FireblocksClientManager {
  private static instance: Fireblocks;
  
  /**
   * Get the singleton Fireblocks client instance
   * @returns Configured Fireblocks client
   * @throws Error if API key or secret key are not configured
   */
  static getInstance(): Fireblocks {
    if (!this.instance) {
      const apiKey = process.env.FIREBLOCKS_API_KEY;
      const secretKey = process.env.FIREBLOCKS_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        throw new Error(
          "Fireblocks credentials not configured. " +
          "Please set FIREBLOCKS_API_KEY and FIREBLOCKS_SECRET_KEY environment variables."
        );
      }
      
      // Determine base path based on environment
      const environment = process.env.FIREBLOCKS_ENV || 'sandbox';
      let basePath: string;
      
      switch (environment) {
        case 'sandbox':
          basePath = BasePath.Sandbox;
          break;
        case 'testnet':
        case 'mainnet':
          basePath = BasePath.US; // Both use the same production URL
          break;
        default:
          basePath = BasePath.Sandbox;
      }
      
      this.instance = new Fireblocks({
        apiKey,
        basePath,
        secretKey,
        // Optional: Add timeout and retry configuration
        // timeout: 60000, // 60 seconds
        // maxBodyLength: Infinity,
      });
    }
    
    return this.instance;
  }
  
  /**
   * Reset the client instance (useful for testing)
   */
  static resetInstance(): void {
    this.instance = null as any;
  }
}