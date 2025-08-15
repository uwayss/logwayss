# Git & PR Primer (Quick)

## 1) Issues
- Create an issue per task/bug.
- Good titles: action + scope (e.g., "Implement config validator").
- Add labels: bug, enhancement, docs.

## 2) Branching
- Never work on `main`.
- Create a feature branch:
  - `git checkout -b feature/123-config-validator`

## 3) Commits
- Small, focused, imperative messages.
- Example: `Add schema validator for server.config.json`
- Commit often: `git add -p` then `git commit`.

## 4) Keep in sync
- Update your branch regularly:
  - `git fetch origin`
  - `git rebase origin/main` (or merge if you prefer)

## 5) Pull Requests
- Push your branch: `git push -u origin feature/123-config-validator`
- Open PR against `main` using the template.
- In the description, link the issue (e.g., `Closes #123`).
- Ensure checks pass and respond to review comments.

## 6) Reviews & Merging
- Self-review first (scan diff, run tests).
- Squash merge for tidy history (recommended).

## 7) Releases (later)
- Tag with semantic version: `git tag v1.0.0 && git push --tags`.
- Write brief release notes.

## 8) Tips
- Keep PRs < ~300 lines when possible.
- Prefer descriptive names, avoid WIP PRs unless requested.
- Draft PRs are fine for early feedback.
