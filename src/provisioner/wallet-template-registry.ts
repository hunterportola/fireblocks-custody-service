import type { WalletArchitecture, WalletTemplate } from '../config/types';

export class WalletTemplateRegistry {
  constructor(private readonly wallets: WalletArchitecture) {
    if (wallets === undefined || wallets === null || !Array.isArray(wallets.templates) || wallets.templates.length === 0) {
      throw new Error('wallets.templates must contain at least one wallet template');
    }
  }

  listTemplates(): ReadonlyArray<WalletTemplate> {
    return this.wallets.templates;
  }

  getTemplateById(templateId: string): WalletTemplate {
    const template = this.wallets.templates.find((candidate) => candidate.templateId === templateId);
    if (template === undefined) {
      throw new Error(`Wallet template "${templateId}" not found`);
    }
    return template;
  }

  getAccountAliases(templateId: string): ReadonlyArray<string> {
    const template = this.getTemplateById(templateId);
    return template.accounts.map((account) => account.alias);
  }
}
