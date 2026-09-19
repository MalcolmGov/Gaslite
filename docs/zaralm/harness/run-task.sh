#!/usr/bin/env bash
# Usage: run-task.sh <label> <task text>   — runs dsh (protea-min profile, headless) in the scratch workspace,
# records stdout/stderr/timing under logs/, decodes the session log to logs/session-<label>.jsonl.
set -u
SP=${HARNESS_ROOT:-$HOME/protea-harness}
LABEL=$1; shift; TASK="$*"
export DSH_HOME="$SP/dsh/home" DSH_TELEMETRY_MODE=DISABLED PROTEA_FACADE_TOKEN=dev-token DSH_PERMISSION_MODE=workspace-write
export PATH="${PROTEA_ROOT:-$HOME/protea}/.venv/bin:$PATH"
cd "$SP/workspace" && git checkout -q -- . && git clean -qfd
rm -rf "$DSH_HOME/sessions"
start=$(date +%s)
timeout "${RUN_TIMEOUT:-900}" "$SP/dsh/node_modules/.bin/dsh" --profile protea-min "$TASK" > "$SP/logs/dsh-$LABEL.out" 2> "$SP/logs/dsh-$LABEL.err"
code=$?
elapsed=$(( $(date +%s) - start ))
echo "label=$LABEL exit=$code elapsed=${elapsed}s" | tee "$SP/logs/dsh-$LABEL.meta"
node "$SP/decode-session.js" "$DSH_HOME/sessions" "$SP/logs/session-$LABEL.jsonl" >/dev/null && cp -r "$DSH_HOME/sessions" "$SP/logs/sessions-$LABEL" && node "$SP/summarize-session.js" "$SP/logs/session-$LABEL.jsonl" | tee "$SP/logs/dsh-$LABEL.summary"
echo "--- workspace diff ---"; git -C "$SP/workspace" --no-pager diff --stat; git -C "$SP/workspace" status --short
echo "--- tests ---"; (cd "$SP/workspace" && python -m pytest -q 2>&1 | tail -2)
