'use strict';

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const serviceName = process.env.OTEL_SERVICE_NAME || 'netflix-clone-app';
const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0';
const deploymentEnvironment = process.env.OTEL_ENVIRONMENT || 'dev';

const traceExporter = new OTLPTraceExporter({
  // Example (Grafana Cloud / Elastic APM OTLP endpoint):
  // OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://otlp.example.com/v1/traces
  // OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer <token>"
  url:
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces',
  headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS)
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: deploymentEnvironment
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

let isStarted = false;

async function startTelemetry() {
  if (isStarted || process.env.OTEL_SDK_DISABLED === 'true') {
    return;
  }

  await sdk.start();
  isStarted = true;
}

async function shutdownTelemetry() {
  if (!isStarted) {
    return;
  }

  await sdk.shutdown();
  isStarted = false;
}

function parseHeaders(headersValue) {
  if (!headersValue) {
    return {};
  }

  return headersValue.split(',').reduce((acc, pair) => {
    const [rawKey, rawValue] = pair.split('=');
    if (!rawKey || !rawValue) {
      return acc;
    }

    acc[rawKey.trim()] = rawValue.trim();
    return acc;
  }, {});
}

module.exports = {
  shutdownTelemetry,
  startTelemetry
};
