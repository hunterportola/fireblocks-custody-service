# Fireblocks Custody Service – Development Roadmap to MVP

This document lays out the step-by-step path from planning through MVP delivery for the Fireblocks Custody Service. Each phase highlights the objectives, key design decisions, and exit criteria so the team can move quickly while maintaining rigor and alignment.

---

## Phase 0 – Discovery & Alignment

**Objectives**
- Capture business goals, partner loan workflows, compliance obligations, and performance expectations.
- Enumerate stakeholders (product, compliance, security, engineering) and secure their sponsorship.
- Identify external dependencies (Fireblocks workspace access, AML providers, legal counsel, auditors).

**Design Decisions**
- Define the target client personas (loan officers, approvers, compliance reviewers) and their user journeys.
- Decide on the scope of the MVP (supported asset, transaction volume, approval complexity).
- Document non-negotiable requirements (asset segregation, approval time limits, audit traceability).

**Exit Criteria**
- Approved product requirements brief and success metrics.
- Stakeholder alignment on MVP feature set and go-to-market timing.
- Fireblocks sandbox/testnet credentials and webhook endpoints provisioned or scheduled.

---

## Phase 1 – Architecture Blueprint

**Objectives**
- Translate requirements into a high-level system design covering APIs, services, data stores, and integrations.
- Map Fireblocks SDK capabilities to service responsibilities (provisioning, approvals, monitoring).
- Choose supportive tooling: TypeScript standards, linting, formatting, testing strategy, CI/CD tooling.

**Design Decisions**
- Service decomposition (configuration validator, provisioning orchestrator, approval service, monitoring/reporting).
- Data model outlines (originator configuration, approval events, transaction ledger entries).
- Secret-management and credential-rotation approach (HSM, Vault, AWS KMS, etc.).
- Observability stack (logging schema, metrics, alerting thresholds).

**Exit Criteria**
- Architectural diagrams and sequence flows signed off.
- ADRs (architecture decision records) drafted for key choices (data store, queueing, deployment target).
- CI/CD skeleton identified (pipeline stages, required checks) and timeboxed for setup.

---

## Phase 2 – Environment & Tooling Setup

**Objectives**
- Bootstrap the repository with enforced TypeScript configuration, lint rules, formatting, commit hooks.
- Create CI pipelines covering install, lint, type-check, unit tests, and artifact packaging.
- Establish environment configuration strategy (dotenv templating, secrets storage, environment matrices).

**Design Decisions**
- Branching strategy (GitFlow vs trunk-based), pull request policies, and review requirements.
- Approach for local Fireblocks emulation vs sandbox connectivity for integration tests.
- Definition of build artifacts (npm package, container image) and publishing workflow.

**Exit Criteria**
- Automated pipeline running on every PR push with required checks.
- Shared `.env.example` / environment variable reference and secret storage guidelines.
- Documentation of developer onboarding steps with time-to-productive target.

---

## Phase 3 – Foundation Implementation

**Objectives**
- Implement configuration validation (schema enforcement, warning vs error handling, extension hooks).
- Build provisioning workflows (vault creation, asset activation, API user setup, TAP scaffolding) with idempotency keys.
- Implement the approval service skeleton (state machine, pending queue, notification hooks).

**Design Decisions**
- Error-handling patterns (FireblocksResponse parsing, retry behavior, circuit breakers).
- Storage approach for configuration, approval state, and audit trails (e.g., PostgreSQL vs document DB).
- Message queue/event bus needs for asynchronous processing (webhooks, approval notifications).

**Exit Criteria**
- End-to-end happy-path flow in sandbox: configuration validated → vaults created → assets active.
- Unit tests covering validators and provisioning logic; integration test hitting Fireblocks sandbox once.
- Clear TODO log for remaining edge cases (duplicate vault handling, API throttling).

---

## Phase 4 – Feature Iteration Toward MVP

**Objectives**
- Expand approval flows (threshold rules, multi-role assignments, timeouts/escalations).
- Wire webhook processing (Fireblocks webhooks v2) for transaction status updates and policy violations.
- Implement compliance integrations (AML screening endpoints, policy synchronization).
- Build reconciliation/reporting exports and operational dashboards (or CLI scripts for MVP).

**Design Decisions**
- Approval escalation strategy (timeouts, notification channels, fallback approvers).
- Reconciliation cadence and report formats (CSV, API, dashboards).
- Monitoring coverage: key metrics (approval latency, transaction throughput) and alert thresholds.

**Exit Criteria**
- MVP scenarios validated: automated disbursement, single approval, threshold approval, webhook-driven monitoring.
- Documentation of failure handling (transaction errors, webhook retries, policy blocks).
- Internal demo showcasing full loan disbursement workflow with audit trail.

---

## Phase 5 – Quality & Security Hardening

**Objectives**
- Expand automated testing: integration suite, contract tests with Fireblocks sandbox, negative paths, performance benchmarks.
- Conduct security review: credential handling, TAP enforcement, RBAC for API users, webhook validation, logging hygiene.
- Finalize observability: structured logs, metrics dashboards, alert routing, runbooks for incident response.

**Design Decisions**
- Load/performance targets and acceptable error budgets.
- Security testing plan (manual review, static analysis, dependency scanning, optional third-party assessment).
- Rollback strategy and data backup policy.

**Exit Criteria**
- All automated tests green in CI; performance benchmarks documented with pass/fail thresholds.
- Security findings triaged and addressed; approvals obtained from security/compliance stakeholders.
- Runbooks and operational SLAs drafted (response time, recovery steps, escalation contacts).

---

## Phase 6 – Release Preparation & Launch

**Objectives**
- Finalize deployment pipeline (staging, testnet, production promotions) with gates and approvals.
- Execute production readiness checklist (TAP rules confirmed, webhook endpoints verified, secrets rotated).
- Communicate launch plan (stakeholder sign-off, support coverage, rollback triggers).

**Design Decisions**
- Release cadence post-MVP, change management process, feature flag strategy.
- Data migration or seeding plan for production (initial originator configuration, approval roles).
- Monitoring of first transactions and support escalation path.

**Exit Criteria**
- Production deployment rehearsed in staging/testnet with sign-offs recorded.
- Launch communication and documentation distributed (playbooks, FAQs, contact matrix).
- MVP release executed with go/no-go checkpoint and contingency plan.

---

## Phase 7 – Post-Launch Operations & Continuous Improvement

**Objectives**
- Monitor key metrics (transaction success rate, approval latency, system errors) and track against SLAs.
- Gather customer feedback (loan officers, compliance teams) and feed into backlog prioritization.
- Schedule regular governance rituals (change review, compliance attestations, TAP audits).

**Design Decisions**
- Backlog intake process (support tickets, customer success insights, incident retrospectives).
- Cadence for Fireblocks SDK updates and regression testing.
- Long-term roadmap items (multi-asset support, advanced reporting, integration marketplace).

**Exit Criteria**
- Operational dashboards and alerts tuned with real data.
- Continuous improvement backlog established with owners and timelines.
- Quarterly review cycle defined for compliance, security, and product enhancements.

---

## Fast-Track Milestones (Target Timeline)

1. **Week 0–1:** Discovery & Alignment, Architecture Blueprint.
2. **Week 1–2:** Environment & Tooling Setup.
3. **Week 2–4:** Foundation Implementation (core provisioning + validation).
4. **Week 4–6:** Feature Iteration (approvals, webhooks, compliance hooks).
5. **Week 6–7:** Quality & Security Hardening.
6. **Week 7–8:** Release Preparation & Launch of MVP.
7. **Post Launch:** Ongoing operations and iterative improvement.

This staged roadmap guides the team from preparation to MVP deployment while leaving room for iterative enhancement in production.
