# Turnkey Custody Service – Build Plan

1. **Configuration Authoring**
   - Collect originator requirements and map them into `OriginatorConfiguration`.
   - Validate with `ConfigurationValidator` to catch missing flows, policy bindings, or partner overrides.

2. **Provisioning**
   - Initialise `TurnkeyClientManager` with platform credentials.
   - Run `TurnkeySuborgProvisioner.provision(configuration)` to create the sub-organization, wallets, automation, and policies.
   - Persist the returned `ProvisioningRuntimeSnapshot` for downstream services.

3. **Automation & Wallet Operations**
   - Use `TurnkeyWalletManager` with a balance provider to monitor flows.
   - Refresh automation credentials via `SecretsManager.setAutomationCredentials` when rotating keys.

4. **Monitoring & Reporting**
   - Register Turnkey activity webhooks using the URLs supplied in `operations.monitoring.webhooks`.
   - Schedule exports based on `operations.reporting` settings.

5. **Compliance**
   - Apply AML and sanctions providers defined in `compliance` when interpreting wallet flows.
   - Maintain audit retention and encryption settings per snapshot metadata.
