#!/usr/bin/env bash
# Usage: facade.sh stop | start <label> [env assignments...]
# Starts the Protea facade (harness config, local CPU provider) on 127.0.0.1:8080 and waits for /readyz.
set -u
SP=${HARNESS_ROOT:-$HOME/protea-harness}
PROTEA=${PROTEA_ROOT:-$HOME/protea}
cmd=$1; shift
if [ "$cmd" = stop ]; then
  # kill the uvicorn process by its listening port (no ss/lsof here): match the python facade process only
  for pid in $(pgrep -f "python3 .*protea serve facade"); do kill "$pid" 2>/dev/null; done
  for i in $(seq 1 20); do curl -sf http://127.0.0.1:8080/healthz >/dev/null 2>&1 || break; sleep 1; done
  echo "facade stopped"; exit 0
fi
LABEL=$1; shift
export PROTEA_FACADE_TOKEN=dev-token HF_HUB_OFFLINE=1 PROTEA_LOCAL_THREADS=4 "$@"
cd "$PROTEA" && . .venv/bin/activate
nohup protea serve facade --config "$SP/protea/facade-harness.yaml" > "$SP/logs/facade-$LABEL.log" 2>&1 &
for i in $(seq 1 150); do sleep 2; curl -sf http://127.0.0.1:8080/readyz >/dev/null && break; done
echo "readyz after ~$((i*2))s: $(curl -s http://127.0.0.1:8080/readyz)"
