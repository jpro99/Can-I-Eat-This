# CAN-1 Hiring Plan and Delegation Record

## Status

- Issue: CAN-1 - Hire your first engineer and create a hiring plan
- CEO disposition: blocked on Paperclip API availability for first-class child issue creation/commenting
- Latest board direction: "try again"
- Heartbeat action taken: retried Paperclip API, confirmed it is unreachable at the runtime URL, and prepared the delegation package below for posting as soon as the API is reachable

## Hiring decision

Hire a founding engineer under the CTO function. The role should own the first technical execution lane for Caveman: stabilizing the app, validating the core flows, and turning the product roadmap into shippable engineering tasks.

Recommended title: Founding Engineer / CTO-track technical lead.

## Role charter

The founding engineer owns:

1. Technical roadmap decomposition for Caveman.
2. App boot, environment, lint/typecheck/test/build verification.
3. Security and data-flow review of profile, food logging, AI/OCR, and export paths.
4. Implementation planning for the highest-risk product gaps.
5. Engineering handoffs to specialist agents when additional capacity is needed.

The CEO retains:

1. Priority calls.
2. Cross-functional tradeoffs.
3. Board communication.
4. Approval of major product scope changes.

## Acceptance criteria for the founding engineer

- Map the current app architecture and confirm framework, package manager, data layer, and environment dependencies.
- Run the smallest useful verification commands for the current state.
- Produce a ranked engineering roadmap with evidence, severity, owner, and validation step for each item.
- Create implementation-ready child tasks for the first execution batch.
- Escalate blockers that require board decisions, credentials, or scope changes.

## Initial delegated child issue package

The CEO should create this child issue under CAN-1 when Paperclip API access is restored.

### Child issue: Engineering onboarding and roadmap decomposition

- Parent: CAN-1
- Assignee: CTO
- Priority: medium
- Objective: Convert Caveman's current product and architecture state into an implementation-ready engineering roadmap.
- Context:
  - App: Caveman, a mobile-first nutrition PWA built with Next.js 15, TypeScript, Prisma, OpenAI, Serwist, and Vitest.
  - Relevant files:
    - `README.md`
    - `docs/ARCHITECTURE.md`
    - `package.json`
    - `AGENTS.md`
  - Known commands:
    - `npm run lint`
    - `npm run typecheck`
    - `npm run test`
    - `npm run build`
- Acceptance criteria:
  - Identify the highest-risk technical gaps in the current repo.
  - Break the roadmap into concrete engineering tasks with owners and validation steps.
  - Recommend the first implementation batch for CEO approval.
  - Do not implement code until the roadmap tasks are approved or explicitly assigned.
- Next action for assignee: perform a read-only repo reconnaissance pass and report the prioritized engineering execution plan.

## Hiring plan

### Immediate priorities

1. Install the founding engineer into the CTO lane.
2. Have the CTO audit current app readiness and split work into implementable tasks.
3. Use specialist support for security, UX, integration, performance, and architecture review only after the CTO identifies the first execution batch.

### Evaluation rubric

- Product judgment: can separate MVP-critical work from polish.
- Engineering judgment: can identify risks with evidence, not speculation.
- Communication: leaves durable handoffs with objective, owner, acceptance criteria, blocker, and next action.
- Execution discipline: verifies work with focused commands before claiming completion.
- Security posture: protects secrets and treats credential gaps as blockers.

### Operating cadence

- CEO delegates technical execution to CTO.
- CTO creates or updates child issues for implementation-ready tasks.
- CEO reviews proposals requiring scope, priority, budget, or product tradeoff decisions.
- Board is asked only for explicit decisions that cannot be resolved internally.

## Current blocker

Paperclip API is unreachable from this heartbeat runtime:

- Attempted: `GET $PAPERCLIP_API_URL/api/issues/$PAPERCLIP_TASK_ID`
- Attempted: `GET $PAPERCLIP_API_URL/api/health`
- Result: connection refused on localhost port 3100

Unblock owner: Paperclip runtime / platform.

Required unblock action: restore the Paperclip API endpoint for this run, then create the CTO child issue above and post an update comment to CAN-1 acknowledging the board's "try again" request.
