# Semgrep Initial Canary Verification

**Date:** 2026-04-25
**PR:** #21 (chore/security-semgrep-ci-gate)
**Context:** First dedicated security workflow for smd-console. Previously, smd-web-ci.yml ran `npm audit --audit-level=critical` only; no static analysis, no secret detection. This PR installs the full crane-console security stack adapted to the flat smd-web/ structure.

## Canary file

`scripts/semgrep-canary.ts` was committed to the draft PR with three deliberate `detect-child-process` findings — `execSync` and `spawn` calls where an argument traces back to a function parameter. All three are exact matches for rules in the pinned pack combination.

Canary content (removed before merge):

```typescript
import { execSync, spawn } from 'child_process'

export function canaryChildProcessExec(userName: string): string {
  return execSync(`echo hello ${userName}`).toString()
}

export function canaryChildProcessSpawn(cmd: string): void {
  spawn(cmd)
}

export function canaryExecThird(venture: string): void {
  execSync(`gh repo list ${venture}`)
}
```

## CI run — with canary (RED, as expected)

**Run:** https://github.com/venturecrane/smd-console/actions/runs/24942125438

**Static Analysis (Semgrep) job:** FAILED

Findings (3 total, 3 blocking):

```
   ❯❯❱ javascript.lang.security.detect-child-process.detect-child-process
           Blocking — scripts/semgrep-canary.ts (userName)

   ❯❯❱ javascript.lang.security.detect-child-process.detect-child-process
           Blocking — scripts/semgrep-canary.ts (cmd)

   ❯❯❱ javascript.lang.security.detect-child-process.detect-child-process
           Blocking — scripts/semgrep-canary.ts (venture)
```

Semgrep scan metadata: `Rules run: 118`, `Targets scanned: 59`.

**nosemgrep Justification Audit job:** PASSED
**TypeScript Validation job:** PASSED (`astro check` — 0 errors, 0 warnings, 0 hints)
**Secret Detection job:** PASSED

## Pre-existing findings discovered

The first full CI run surfaced **pre-existing NPM vulnerabilities** that the previous `smd-web-ci.yml` had not caught (it used `--audit-level=critical`; the new gate uses `--audit-level=high`):

- 18 vulnerabilities initially (10 moderate, 8 high)
- After `npm audit fix` (non-breaking): 11 remaining (6 moderate, 5 high)
- The remaining 5 high-severity all traced to `serialize-javascript <=7.0.4` via `workbox-build → @rollup/plugin-terser → @vite-pwa/astro`
- `workbox-build` pins `@rollup/plugin-terser ^0.4.x` (old range) which only allows up to `0.4.4`; all `0.4.x` versions depend on `serialize-javascript <=7.0.4`
- `serialize-javascript@7.0.5` fixes both CVEs (`GHSA-5c6j-r48x-rmvq`, `GHSA-qj8w-gfj5-8c6v`)
- **Fix applied:** added `"overrides": {"serialize-javascript": "^7.0.5"}` to `smd-web/package.json` to force the patched version through the workbox chain
- `astro check` verified still passes (0 errors) after the override

**NPM Audit job:** FAILED in red run (as documented above); resolved via override before green push.

**Summary job:** FAILED in red run (aggregated as expected).

## CI run — canary removed (GREEN, post-fix)

After removing `scripts/semgrep-canary.ts`, applying the `npm audit fix` package-lock changes, and adding the `serialize-javascript` override:

**Run (canary-removed):** _(URL appended below after CI completes)_

## Ruleset application to live repo

**Applied:** _(after green CI and merge)_
**Ruleset ID:** _(to be filled)_
**Enforcement:** active
**Required status checks:** `Security Summary` (the aggregate gate; all 5 sub-jobs must pass)
