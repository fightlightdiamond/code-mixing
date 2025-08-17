# LogRocket Monitoring

This project uses [LogRocket](https://logrocket.com) to collect error logs in production. Any log with level `ERROR` or higher is sent to LogRocket when the application runs outside of development.

## Setup

1. Create a LogRocket project and copy its **App ID** (e.g. `your-org/your-app`).
2. Add the App ID to your environment variables:

```env
NEXT_PUBLIC_LOGROCKET_ID=your-org/your-app
```

3. Build and run the application. LogRocket initializes automatically in non-development environments.

## Viewing logs

1. Sign in to the [LogRocket dashboard](https://logrocket.com).
2. Select the project matching your App ID.
3. Use the **Issues** or **Sessions** views to explore captured logs and playback sessions.
