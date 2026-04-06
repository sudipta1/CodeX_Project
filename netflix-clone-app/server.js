'use strict';

const express = require('express');
const path = require('path');
const client = require('prom-client');

const { startTelemetry, shutdownTelemetry } = require('./telemetry');
const { writeLog } = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

const contentCatalog = [
  {
    id: 1,
    title: 'CodeX Originals: Dark Matrix',
    genre: 'Sci-Fi',
    year: 2026,
    rating: 'U/A 16+',
    image:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 2,
    title: 'The Last Commit',
    genre: 'Thriller',
    year: 2025,
    rating: 'U/A 13+',
    image:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 3,
    title: 'Deploy Day',
    genre: 'Drama',
    year: 2024,
    rating: 'U',
    image:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 4,
    title: 'Cluster Wars',
    genre: 'Action',
    year: 2026,
    rating: 'A',
    image:
      'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 5,
    title: 'The Container',
    genre: 'Mystery',
    year: 2023,
    rating: 'U/A 13+',
    image:
      'https://images.unsplash.com/photo-1608170825938-a8ea0305d46c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 6,
    title: 'Azure Nights',
    genre: 'Romance',
    year: 2022,
    rating: 'U',
    image:
      'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1200&q=80'
  }
];

app.use((req, res, next) => {
  const endTimer = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };

    httpRequestsTotal.inc(labels);
    endTimer(labels);
    writeLog('info', 'HTTP request completed', {
      method: req.method,
      route,
      statusCode: res.statusCode
    });
  });

  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/content', (_req, res) => {
  res.json(contentCatalog);
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

async function startServer() {
  await startTelemetry();
  app.listen(PORT, async () => {
    await writeLog('info', `Netflix clone app running on port ${PORT}`);
  });
}

startServer().catch(async (error) => {
  await writeLog('error', 'Failed to start server', { err: error.message });
  process.exit(1);
});

async function gracefulShutdown(signal) {
  await writeLog('info', `Received ${signal}; shutting down...`);
  await shutdownTelemetry();
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
