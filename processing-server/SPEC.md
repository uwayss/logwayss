# LogWayss Processing Server — SPEC

## Endpoint Config JSON Schema

## Request/Response JSON Schemas & Error Envelope

## Auth & Network Policy (MASTER_PASSWORD, localhost)

## Scripts Lifecycle (install, version, dependencies)

## Logs & Artifacts Locations

## Sandboxing (Deferred)

## Open Questions & Risks

---

## Implementation Checklist (Pseudocode)

- [ ] Config
  - [ ] Define `server.config.json` schema: `endpoints[]:{ name, method, path, script_path, timeout_ms, enabled }`
  - [ ] Validate on startup; fail closed with line/field errors
  - [ ] Hot reload or restart-on-change (MVP: restart)
- [ ] HTTP Server
  - [ ] Bind host from ENV (default 127.0.0.1), port default 8080
  - [ ] Global middleware: request size limit, JSON parsing, structured logging
- [ ] Authentication (MVP)
  - [ ] Read `MASTER_PASSWORD` from `.env`
  - [ ] Basic header or bearer token compare (constant-time)
  - [ ] Rate-limit + lockout after N failures (exponential backoff)
- [ ] Endpoint Dispatch
  - [ ] For each configured endpoint, map HTTP route → spawn script
  - [ ] Request schema: `{ entry_ids: string[], params: object }`
  - [ ] Serialize payload to script stdin (JSON); capture stdout/stderr
  - [ ] Timeout via `timeout_ms`; kill process on expiry
- [ ] Response Contract
  - [ ] Expected stdout JSON: `{ results?: any[], new_entries?: Entry[], warnings?: string[] }`
  - [ ] Error envelope on failure: `{ error: { code, message, details? } }`
- [ ] Scripts Runtime
  - [ ] Each script executes in working dir with venv (optional)
  - [ ] Deny network by default (documented only in MVP)
  - [ ] Resource limits (soft): max CPU time, max memory (configurable)
- [ ] Logging & Artifacts
  - [ ] Structured JSON logs; redact secrets
  - [ ] Store artifacts per-run under `runs/<date>/<endpoint>/<run-id>/`
  - [ ] Rotate logs (10MB x 5)
- [ ] Packaging
  - [ ] `pip install -e .` support later; simple `python main.py` for MVP

## Acceptance Criteria

- [ ] Invalid config prevents startup with precise field/line error
- [ ] Requests without/with wrong password are rejected and counted towards lockout
- [ ] Script exceeding `timeout_ms` returns `E_SCRIPT_TIMEOUT`; process is terminated
- [ ] Malformed script output yields `E_SCRIPT_OUTPUT` with captured stderr truncated
- [ ] Successful script run returns valid JSON; any `new_entries` pass schema validation
- [ ] Server binds to 127.0.0.1 by default; LAN requires explicit config
- [ ] Logs redact `MASTER_PASSWORD` and request secrets
