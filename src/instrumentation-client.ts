import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/infra/observability/sentry";

Sentry.init(sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN));
