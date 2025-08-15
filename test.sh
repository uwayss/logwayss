#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RESET='\033[0m'

banner() { echo -e "${CYAN}==>${RESET} ${1}"; }
ok() { echo -e "✅ ${1}"; }
warn() { echo -e "🚧 ${1}"; }

status_line() {
  local name="$1"; local code="$2"
  if [ "$code" -eq 0 ]; then echo -e "✅ ${name}"; else echo -e "❌ ${name}"; fi
}

overall_status=0

banner "core-go: tests"
set +e
(
  cd "$ROOT_DIR/core-go" && go test -v ./...
)
status_go=$?
set -e
if [ "$status_go" -ne 0 ]; then overall_status=1; fi

banner "core-js: tests"
set +e
(
  cd "$ROOT_DIR/core-js" && npm test --silent
)
status_js=$?
set -e
if [ "$status_js" -ne 0 ]; then overall_status=1; fi

banner "core-py: venv + tests"
PY_DIR="$ROOT_DIR/core-py"
if [ ! -d "$PY_DIR/.venv" ]; then
  python3 -m venv "$PY_DIR/.venv"
fi
# shellcheck disable=SC1091
set +e
(
  source "$PY_DIR/.venv/bin/activate"
  python -m pip install -e "$PY_DIR" -q
  python -m unittest discover -s "$PY_DIR/tests" -p 'test_*.py' -v
  deactivate
)
status_py=$?
set -e
if [ "$status_py" -ne 0 ]; then overall_status=1; fi

banner "summary"
status_line "core-go" "$status_go"
status_line "core-js" "$status_js"
status_line "core-py" "$status_py"

if [ "$overall_status" -eq 0 ]; then
  ok "All tests completed"
else
  echo -e "❌ Some tests failed (see summary above)."
fi

exit "$overall_status"
