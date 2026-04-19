import * as Sentry from "@sentry/nextjs";

const DSN = process.env.SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0,
    initialScope: { tags: { app: "pinara", phase: "1", side: "edge" } },
  });
}
