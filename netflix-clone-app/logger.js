'use strict';

const pino = require('pino');
const { Client } = require('@elastic/elasticsearch');
const { context, trace } = require('@opentelemetry/api');

const appName = process.env.APP_NAME || 'netflix-clone-app';
const logLevel = process.env.LOG_LEVEL || 'info';
const elasticNode = process.env.ELASTIC_NODE;
const elasticApiKey = process.env.ELASTIC_API_KEY;
const elasticIndex = process.env.ELASTIC_LOG_INDEX || 'netflix-clone-logs';

const logger = pino({
  level: logLevel,
  base: {
    app: appName,
    env: process.env.NODE_ENV || 'development'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

const elasticClient =
  elasticNode && elasticApiKey
    ? new Client({
        node: elasticNode,
        auth: { apiKey: elasticApiKey }
      })
    : null;

async function writeLog(level, message, details = {}) {
  const span = trace.getSpan(context.active());
  const traceId = span ? span.spanContext().traceId : null;
  const payload = {
    ...details,
    trace_id: traceId
  };

  logger[level](payload, message);

  if (elasticClient) {
    try {
      await elasticClient.index({
        index: elasticIndex,
        document: {
          '@timestamp': new Date().toISOString(),
          level,
          message,
          service: appName,
          environment: process.env.NODE_ENV || 'development',
          trace_id: traceId,
          ...details
        }
      });
    } catch (error) {
      logger.error({ err: error.message }, 'Failed to write log to Elastic Cloud');
    }
  }
}

module.exports = {
  logger,
  writeLog
};
