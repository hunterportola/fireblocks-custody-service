# Fireblocks Custody MVP – Composable Delivery Plan

Goal: enable an originator to submit a loan disbursement request that moves funds from a dedicated vault, enforces business rules (only approved loans, correct destination, amounts within limits), and operates with a single automated signer (API key + co-signer) plus optional manual review hooks for later phases.

Each module below can be built, tested, and deployed independently while composing into a functional MVP.

---

## Module 0 – Baseline Environment

**Purpose**: guarantee we can interact with Fireblocks safely and reproducibly.

- Secure storage for onboarding service API key + secret (env management, secret vault, IP allow-list).
- TypeScript project skeleton with lint, formatting, `tsc --noEmit`, and unit-test harness.
- Shared configuration contract (originatorID, approved loan payload schema, asset IDs).
- Basic CI check: lint + type-check + unit smoke test.

**Deliverable**: baseline repo + CI passing; secrets procedure documented.

---

## Module 1 – Originator Segmentation

**Purpose**: provision and track the dedicated vault/asset container for each originator.

- Service function `provisionOriginatorVault`:
  - Create vault account (`hiddenOnUI: true`), fail-fast if duplicate `customerRefId`.
  - Activate allowed asset wallets (loan asset + fuel asset if needed).
  - Persist mapping: `originatorId → vaultAccountId`.
- Naming + `customerRefId` conventions decided and documented.
- Automated tests: stubbed Fireblocks API verifying idempotent behavior.

**Deliverable**: originator vault provisioning endpoint with tests + audit log entry per originator.

---

## Module 2 – Disbursement Intake API

**Purpose**: accept loan disbursement POST requests from originators, validate payload, and enqueue execution.

- REST endpoint `/originators/{id}/disbursements` (auth TBD).
- Validation rules:
  - loan ID uniqueness per originator.
  - destination address belongs to approved whitelist.
  - amount within configured limit.
- Persistence of approved requests (status: `pending_automation`).
- Fixtures/tests covering happy path + rejection scenarios.

**Deliverable**: documented API contract + integration test hitting in-memory store.

---

## Module 3 – Automated Execution Service

**Purpose**: transform approved requests into Fireblocks transactions with enforced restrictions.

- Worker/service reading `pending_automation` requests.
- Transaction construction:
  - `externalTxId = loanId`.
  - `source` vault = originator’s dedicated vault.
  - `destination` = whitelisted wallet from request.
  - Amount equals requested amount (no adjustments allowed).
- Fireblocks call via API user + co-signer credentials.
- Update request status to `submitted` / `failed` with reason.
- Unit + integration tests using SDK mocks verifying payload equality.

**Deliverable**: automated submission pipeline that runs in sandbox with example data.

---

## Module 4 – Enforcement & Monitoring Layer

**Purpose**: ensure vault is never used outside approved loan payloads.

- TAP policy template:
  - Restrict source to originator vault ID.
  - Require signer = automation API user.
  - Optionally require approval group for thresholds (hook for manual review).
- Webhook v2 subscription for transaction updates.
- Rule: any transaction status change inconsistent with stored request triggers alert (log + notification hook).
- Tests verifying TAP JSON matches expectations; webhook handler unit tests.

**Deliverable**: published TAP rules per originator + webhook consumer updating disbursement records.

---

## Module 5 – Automated Guardrails

**Purpose**: detect policy drift or unauthorized activity automatically.

- Scheduled job to list recent transactions for each originator vault; compare with approved requests.
- Assertions:
  - Every transaction has matching `externalTxId`.
  - No additional assets moved.
  - Source/destination match stored record.
- Test suite with synthetic data verifying detection logic.

**Deliverable**: guardrail report (pass/fail per originator) exportable to logs or monitoring dashboard.

---

## Module 6 – Credential & Co-Signer Setup

**Purpose**: provision the automated signer safely.

- Process documentation + scripts:
  - Generate CSR + private key for originator API user.
  - Create API user (`role: SIGNER`, `coSignerSetupType`).
  - Hand-off pairing token + private key via one-time secure channel.
- Checklist for originator to install API co-signer (self-hosted).
- Basic health check (e.g., sign test transaction or heartbeat endpoint).

**Deliverable**: runbook consumed by success team + confirmation workflow stored in system.

---

## Module 7 – MVP Assembly & Verification

**Purpose**: stitch modules into a coherent minimal product.

- Smoke flow in sandbox:
  1. Provision originator via Module 1.
  2. Submit loan disbursement using Module 2 API.
  3. Automation worker (Module 3) sends transaction.
  4. TAP + webhook (Module 4) confirm execution.
  5. Guardrails (Module 5) report clean state.
- Checklists for deployment (config files, env vars, API keys).
- Postman/Insomnia collection or CLI script to demonstrate flow.

**Deliverable**: MVP sign-off doc with logs/screenshots showing end-to-end run.

---

## Optional Next Steps (Beyond MVP)

- Manual review queue integrating with approval groups.
- Enhanced reporting/UI surfaces for originators.
- Multi-asset support + repayment collection workflows.
- Callback handler support for custom co-signer logic.

This plan keeps the scope narrowly focused on the loan disbursement automation and its safety checks, while structuring the work into composable modules that can be owned and delivered incrementally.
