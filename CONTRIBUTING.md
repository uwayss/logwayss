# Contributing to LogWayss

Thanks for your interest in contributing! This document describes the minimal workflow so you can be productive fast.

## Code of Conduct

Please read and follow our `CODE_OF_CONDUCT.md`.

## How We Work (Quick Primer)

- Issues → Branches → Pull Requests → Review → Merge.
- Keep PRs small and focused. Add tests when relevant.
- No telemetry; keep logs privacy-safe and redact secrets.

## Development Setup

- Read `DEVELOPING.md` for environment setup.
- Specs live in root `specification.md` and per-package `SPEC.md`.

## Branching

- Create a branch per task: `feature/<issue-id>-<short-name>` or `fix/<issue-id>-<short-name>`.
- Never push to `main` directly.

## Commits

- Write small, clear commits (imperative mood):
  - Good: `Add entry validation for media_ref`
  - Good: `Fix: unlock backoff uses jitter`
- Reference issues in commit or PR description when possible (e.g., `Fixes #12`).

## Pull Requests

1. Ensure CI passes locally if applicable.
2. Open a PR against `main`. Fill in the template checklist.
3. Include screenshots/logs for UI or behavior changes.
4. Respond to review comments promptly; be kind and specific.

## Issues

- Use the issue templates under `.github/ISSUE_TEMPLATE/`.
- Provide reproduction steps, expected/actual results, and environment info.

## Coding Style

- Follow language conventions (Go/TS/Python formatters/linters where applicable).
- Avoid breaking public APIs without a migration note.

## Security

- Do not include secrets in code or logs.
- Report vulnerabilities via a private issue or email (to be added).

## License

By contributing, you agree your contributions are licensed under the repository license (MIT).
