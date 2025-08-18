# Developing LogWayss

Short guide to get you building quickly.

## Prerequisites

- Git, Node.js (for Electron), Go (for core-go)
- Android Studio (for client-android) if building Android

## Repo Layout

See subfolders: `core-go/`, `core-js/`, `client-android/`, `client-desktop/`, `processing-server/`.

## Setup at a glance

- Clone repo
- Create a feature branch: `git checkout -b feature/123-short-name`
- Follow each package's README and SPEC for local setup

## Building packages (high level)

- core-go: standard `go build`; gomobile AAR (later) per SPEC
- core-js: `npm install` / `pnpm install`, build scripts TBD

- client-desktop: `npm install`, `electron-builder` (later)
- client-android: Android Studio + Gradle (later)
- processing-server: standard `go build`; run local HTTP server

## Running tests

Conformance/tests will live in `spec-and-tests/` (skeleton for now).

## Git workflow

- Issues → Branches → PRs → Review → Merge. See `CONTRIBUTING.md`.

## Security & privacy

- No secrets in code or logs. Keep development data local.
