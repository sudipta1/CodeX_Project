# Observability Roadmap (Prometheus + Grafana Cloud + Elastic Cloud + OpenTelemetry)

## Phase 1: Instrument the application (Done in this repo)

- Add OpenTelemetry SDK for distributed tracing.
- Add Prometheus metrics endpoint (`/metrics`) with request counter and latency histogram.
- Add structured JSON logs and push logs to Elastic Cloud with API key.
- Attach `trace_id` into logs so traces and logs can be correlated.

## Phase 2: Cloud endpoint wiring

1. In Grafana Cloud, create an OTLP ingestion token and endpoint.
2. In Elastic Cloud, create:
   - Elasticsearch API key for logs
   - OTLP endpoint credentials for traces (if you want traces in Elastic APM too)
3. Store all secrets in AKS Kubernetes Secret `observability-secrets`.

## Phase 3: AKS deployment readiness

1. Deploy app manifests (`k8s/deployment.yaml`, `k8s/service.yaml`).
2. Configure Prometheus scraping:
   - Either self-managed Prometheus
   - Or Azure Managed Prometheus/Grafana Agent
3. Import/apply dashboards in Grafana Cloud:
   - Request throughput (http_requests_total)
   - Request latency p95/p99 (http_request_duration_seconds)
   - Error rate by route and status code

## Phase 4: ELK usage model

- Use Elastic Cloud as centralized log analytics.
- Build index template and ILM policy for `netflix-clone-logs*`.
- Create Kibana saved views:
  - Error logs by route
  - Slow request logs
  - Trace ID lookup panel (paste trace ID and retrieve logs)

## Phase 5: SLOs and alerting

1. Create SLOs in Grafana Cloud:
   - Availability SLO from `/healthz` and 5xx rate
   - Latency SLO from histogram metrics
2. Alerts:
   - 5xx error spike
   - p95 latency > threshold
   - pod restart count increase
3. Route alerts to Slack / Teams / PagerDuty.

## Phase 6: Hardening and scale

- Add sampling strategy (`OTEL_TRACES_SAMPLER`, ratio-based sampling).
- Add per-environment labels (`dev`, `qa`, `prod`).
- Extend traces to downstream dependencies (DB/cache/message broker) as the app evolves.
