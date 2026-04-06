# Netflix Clone App (AKS-ready with Grafana + ELK + OpenTelemetry)

A Netflix-style app built with Node.js/Express and integrated observability:

- **Metrics** via Prometheus endpoint (`/metrics`)
- **Traces** via OpenTelemetry OTLP exporter
- **Logs** via structured JSON + Elastic Cloud indexing

## Quick Start (No Docker build required)

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Observability environment variables

Set these before starting the app:

```bash
export OTEL_SERVICE_NAME=netflix-clone-app
export OTEL_ENVIRONMENT=local
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=<grafana-or-elastic-otlp-endpoint>
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer <otlp-token>"

export ELASTIC_NODE=<https://your-deployment.es.region.aws.elastic-cloud.com>
export ELASTIC_API_KEY=<elastic-api-key>
export ELASTIC_LOG_INDEX=netflix-clone-logs
```

## Endpoints

- `GET /` - UI
- `GET /api/content` - sample catalog API
- `GET /healthz` - health check
- `GET /metrics` - Prometheus metrics

## Grafana + ELK + OTel integration details

### 1) Traces (OpenTelemetry)

- Application telemetry bootstrap is in `telemetry.js`.
- By default, traces are exported via OTLP HTTP.
- For multi-destination trace fanout (Grafana Cloud + Elastic), use OTel Collector config in:
  - `observability/otel-collector-config.yaml`

### 2) Metrics (Prometheus)

- Custom metrics are created in `server.js`:
  - `http_requests_total`
  - `http_request_duration_seconds`
- Prometheus scrape config file:
  - `observability/prometheus.yml`

### 3) Logs (Elastic Cloud / ELK)

- Logging is handled by `logger.js`.
- App logs are written to stdout and optionally indexed to Elastic Cloud when `ELASTIC_NODE` + `ELASTIC_API_KEY` are set.
- Each log includes `trace_id` for correlation with distributed traces.

## Optional local observability containers

You can run local Prometheus + OTel Collector:

```bash
docker compose -f docker-compose.observability.yml up -d
```

## AKS deployment

1. Build image in ACR (remote build, no local Docker needed):

```bash
export ACR_NAME=<your-acr-name>
az acr build --registry $ACR_NAME --image netflix-clone-app:latest .
```

2. Create Kubernetes secret (replace placeholders):

```bash
kubectl create secret generic observability-secrets \
  --from-literal=otlp_traces_endpoint='<otlp-endpoint>' \
  --from-literal=otlp_headers='Authorization=Bearer <token>' \
  --from-literal=elastic_node='<elastic-url>' \
  --from-literal=elastic_api_key='<elastic-api-key>'
```

3. Deploy:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

4. See roadmap:

- `OBSERVABILITY_ROADMAP.md`
