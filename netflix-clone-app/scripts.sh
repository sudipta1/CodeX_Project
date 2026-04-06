#!/usr/bin/env bash
set -euo pipefail

CMD="${1:-help}"

case "$CMD" in
  local)
    npm install
    npm start
    ;;
  acr-build)
    : "${ACR_NAME:?Set ACR_NAME, e.g. export ACR_NAME=myregistry}"
    az acr build --registry "$ACR_NAME" --image netflix-clone-app:latest .
    ;;
  observability-up)
    docker compose -f docker-compose.observability.yml up -d
    ;;
  help|*)
    cat <<'USAGE'
Usage:
  ./scripts.sh local            # Run app on local machine without Docker build
  ACR_NAME=<name> ./scripts.sh acr-build
                                # Build image remotely in Azure ACR
  ./scripts.sh observability-up # Start local Prometheus + OTel Collector containers
USAGE
    ;;
esac
