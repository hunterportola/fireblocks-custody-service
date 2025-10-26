// @ts-nocheck
import { createPolicyBindingResolver } from '../policy-binding-resolver';

describe('policy binding resolver', () => {
  const resolver = createPolicyBindingResolver({
    walletTemplateMap: {
      'wallet-distribution': 'wallet-123',
    },
    walletAliasMap: {
      distribution_primary: { walletId: 'wallet-123', accountId: 'account-abc' },
    },
    partnerIds: ['LP001'],
    userTagTemplates: ['role:senior_reviewer'],
    automationTemplateIds: ['auto-primary'],
    automationUserIds: { 'auto-primary': 'usr_automation_primary' },
  });

  it('resolves wallet template bindings', () => {
    const result = resolver.resolve({
      type: 'wallet_template',
      target: 'wallet-distribution',
    });
    expect(result.resolvedTarget).toBe('wallet-123');
  });

  it('resolves wallet alias bindings', () => {
    const result = resolver.resolve({
      type: 'wallet_alias',
      target: 'distribution_primary',
    });
    expect(result.resolvedTarget).toBe('account-abc');
  });

  it('throws for unknown partners', () => {
    expect(() =>
      resolver.resolve({
        type: 'partner',
        target: 'LP999',
      })
    ).toThrow('Partner "LP999" is not known to the current originator');
  });

  it('resolves automation user bindings to real user IDs', () => {
    const result = resolver.resolve({
      type: 'automation_user',
      target: 'auto-primary',
    });
    expect(result.resolvedTarget).toBe('usr_automation_primary');
  });
});
