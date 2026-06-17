const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enableLogs: true,
  tracesSampleRate: 1.0, 
  environment: process.env.NODE_ENV || "production", 
});