# Turnkey Custody Service SDK

A workflow-driven toolkit for provisioning loan originator environments on [Turnkey](https://docs.turnkey.com/). It transforms a high-level configuration into sub-organization provisioning plans, wallet assignments, automation users, and policy deployments.

## Key Capabilities

- **Config-driven sub-org provisioning** – describe root users, wallet flows, partner overrides, and the SDK prepares Turnkey activities.
- **Reusable policy templates** – policy bindings resolve wallet templates, partner IDs, automation users, and role tags before submission.
- **Runtime snapshots** – every provisioning run emits a `ProvisioningRuntimeSnapshot` that captures Turnkey IDs for persistence and auditing.
- **Wallet management helpers** – list/tag wallets, fetch balances via injected providers, and map wallet flows to accounts.

## Project Structure

```
src/
  config/                # Typed configuration & validator
  core/                  # Turnkey client manager, secrets, error handling
  provisioner/           # Sub-org planner, policy deployment, wallet utilities
  approvals/             # Policy template definitions & validation helpers
  docs/                  # Operational runbooks (in progress)
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Export Turnkey credentials** (parent org)
   ```bash
   export TURNKEY_API_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
   export TURNKEY_API_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
   export TURNKEY_API_KEY_ID="api-key-id"
   export TURNKEY_ORGANIZATION_ID="org-123"
   ```
   Optional helpers:
   ```bash
   export TURNKEY_AUTOMATION_KEYS='{"automation-template-id": {"apiPrivateKey": "...", "apiPublicKey": "...", "apiKeyId": "..."}}'
   export TURNKEY_PASSKEY_ATTESTATIONS='{"template-id": "..."}'
   ```

3. **Validate a configuration**
   ```ts
   import { ConfigurationValidator } from './src';
   const validator = new ConfigurationValidator();
   const result = await validator.validate(originatorConfig);
   if (!result.isValid) throw new Error(result.errors.join('\n'));
   ```

4. **Provision a sub-organization**
   ```ts
   import { TurnkeyClientManager, TurnkeySuborgProvisioner } from './src';

   await TurnkeyClientManager.initialize({ platform: originatorConfig.platform });
   const provisioner = new TurnkeySuborgProvisioner();
   const artifacts = await provisioner.provision(originatorConfig);
   console.log(artifacts.provisioningSnapshot.subOrganizationId);
   ```

5. **Explore runtime snapshots**
   ```ts
   artifacts.provisioningSnapshot.walletFlows.forEach((flow) => {
     console.log(flow.flowId, flow.walletId, flow.accountIdByAlias);
   });
   ```

## Example

`example-usage.ts` demonstrates:
- preparing a rich originator configuration
- validating input with `ConfigurationValidator`
- initializing the Turnkey API client
- running `TurnkeySuborgProvisioner` (skips if credentials missing)

Run it with `node -r ts-node/register example-usage.ts` once credentials are set.

## Scripts

- `npm run typecheck` – strict TypeScript compilation
- `npm test` – unit tests (`validator`, policy binding resolver, core helpers)
- `npm run build` – emit compiled output to `dist/`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `TURNKEY_API_PRIVATE_KEY` | PEM private key for server API requests |
| `TURNKEY_API_PUBLIC_KEY`  | PEM public key paired with the private key |
| `TURNKEY_API_KEY_ID`      | API key identifier |
| `TURNKEY_ORGANIZATION_ID` | Parent organization running the toolkit |
| `TURNKEY_API_BASE_URL`    | Optional Turnkey endpoint (defaults to production) |
| `TURNKEY_AUTOMATION_KEYS` | JSON map of automation template -> creds |
| `TURNKEY_PASSKEY_ATTESTATIONS` | JSON map of template -> attestation PEM |

## Testing

The repository includes smoke tests for the validator, secrets manager, policy binding resolver, and wallet planners. Execute `npm test` before committing changes.

> ℹ️ The project currently stubs direct Turnkey activity calls in unit tests. Integration runs (`example-usage.ts`) require valid sandbox credentials.

## Roadmap

- Turnkey activity mocks for offline testing
- Richer policy/payout automation samples
- Documentation for multi-originator orchestration

Contributions and feedback are welcome!
