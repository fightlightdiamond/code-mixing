# 📈 Error Monitoring with Sentry

This application sends high-severity logs to [Sentry](https://sentry.io/) when running in production.

## 🚀 Setup

1. Create a project in Sentry and copy its DSN.
2. Configure the DSN in your environment:

```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

3. Run the app with `NODE_ENV=production`.

## 🔍 Viewing Logs

1. Sign in to your Sentry dashboard.
2. Select the project used by this application.
3. Navigate to the **Issues** tab to inspect error reports.
4. Use filters (e.g., release, user, request ID) to narrow results.

Errors logged with `logger.error` (and higher levels) will appear automatically.
