import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

export const isPostHogEnabled = Boolean(POSTHOG_KEY);

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    defaults: "2026-05-30",
    person_profiles: "identified_only",
  });
}

export function capturePageview(path: string) {
  if (!isPostHogEnabled) {
    return;
  }

  posthog.capture("$pageview", {
    $current_url: window.location.href,
    path,
  });
}

export function identifyPostHogUser(
  user: { id: string; name?: string | null; role?: unknown } | undefined,
) {
  if (!isPostHogEnabled) {
    return;
  }

  if (!user) {
    posthog.reset();
    return;
  }

  posthog.identify(user.id, {
    name: user.name ?? undefined,
    role: typeof user.role === "string" ? user.role : undefined,
  });
}

export { posthog };
