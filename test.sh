#!/usr/bin/env bash
set -uo pipefail

# --- Configuration ---
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${ROOT_DIR}/.test-logs"
mkdir -p "$LOG_DIR"

# --- Colors and Formatting ---
if command -v tput >/dev/null && tput setaf 1 >/dev/null 2>&1; then
    GREEN=$(tput setaf 2)
    CYAN=$(tput setaf 6)
    YELLOW=$(tput setaf 3)
    RED=$(tput setaf 1)
    BOLD=$(tput bold)
    RESET=$(tput sgr0)
else
    GREEN='\033[0;32m'
    CYAN='\033[0;36m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    BOLD='\033[1m'
    RESET='\033[0m'
fi

# --- Logging Functions ---
info() { echo -e "\n${CYAN}${BOLD}==>${RESET}${BOLD} ${1}${RESET}"; }
hr() { printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' '-'; }

# --- Test Runner ---
declare -A results
declare -A logs
overall_status=0

# $1: Name (e.g., "core-go")
# $2: Type for parser (go, py, js)
# $3: Directory to run in
# $4...: Command
run_test() {
    local name="$1"
    local type="$2"
    local dir="$3"
    shift 3
    local cmd=("$@")
    local log_file="${LOG_DIR}/${name}.log"

    info "Running tests for ${name}"
    logs["$name"]="$log_file"

    # Execute the command, capturing its output and status
    local output
    output=$((cd "$dir" && "${cmd[@]}") 2>&1)
    local status=$?
    echo "$output" > "$log_file"

    # Process output for clean, unified display
    if [[ "$type" == "go" ]]; then
        echo "$output" | awk '
            /^=== RUN/ { current_test = $2 }
            /^--- (PASS|FAIL|SKIP):/ {
                if ($2 == current_test) {
                    icon = "✅";
                    if ($1 == "--- FAIL:") icon = "❌";
                    if ($1 == "--- SKIP:") icon = "🚧";
                    printf "  %s %s\n", icon, current_test;
                }
            }'
    elif [[ "$type" == "py" ]]; then
        echo "$output" | sed -n -E \
            -e 's/^(test_[a-zA-Z0-9_]*) \(.*\) \.\.\. ok/  ✅ \1/p' \
            -e 's/^(test_[a-zA-Z0-9_]*) \(.*\) \.\.\. FAIL/  ❌ \1/p' \
            -e 's/^(test_[a-zA-Z0-9_]*) \(.*\) \.\.\. skipped/  🚧 \1/p'
    else # For JS, the output is already clean
        echo "$output" | grep -E '^(  ✅|  ❌|  🚧)'
    fi
    
    # Set final status for this run
    if [ "$status" -eq 0 ]; then
        results["$name"]="PASS"
    else
        results["$name"]="FAIL"
        overall_status=1
    fi
}

# --- Test Definitions ---
info "LogWayss Core Test Suite"

# core-go
run_test "core-go" "go" "${ROOT_DIR}/core-go" go test -v ./...

# core-js
if [ ! -d "${ROOT_DIR}/core-js/node_modules" ]; then
    (cd "${ROOT_DIR}/core-js" && npm install --silent &> "${LOG_DIR}/core-js-install.log")
fi
run_test "core-js" "js" "${ROOT_DIR}/core-js" npm test

# core-py
PY_DIR="${ROOT_DIR}/core-py"
VENV_DIR="${PY_DIR}/.venv"
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR" && \
    # shellcheck disable=SC1091
    source "${VENV_DIR}/bin/activate" && \
    python -m pip install -q --upgrade pip && \
    python -m pip install -e "$PY_DIR" -q --log "${LOG_DIR}/core-py-pip.log" && \
    deactivate
fi
run_test "core-py" "py" "$PY_DIR" \
    bash -c "source .venv/bin/activate && python -m unittest discover -s tests -p 'test_*.py' -v"

# --- Final Summary ---
info "Final Test Summary"
hr
for name in $(echo "${!results[@]}" | tr ' ' '\n' | sort); do
    status="${results[$name]}"
    log_file="${logs[$name]}"
    if [[ "$status" == "PASS" ]]; then
        printf "${GREEN}✅ %-12s${RESET} | Status: ${GREEN}%s${RESET}\n" "$name" "$status"
    else
        printf "${RED}❌ %-12s${RESET} | Status: ${RED}%s${RESET} | See full log: ${YELLOW}%s${RESET}\n" "$name" "$status" "$log_file"
    fi
done
hr

if [ "$overall_status" -ne 0 ]; then
    echo -e "${RED}Overall status: Some tests failed.${RESET}"
    exit 1
fi

echo -e "${GREEN}Overall status: All tests passed successfully!${RESET}"
exit 0