import { useCallback, useEffect, useRef, useState } from "react";

export type ApiResource<T> = {
  data: T;
  error: string;
  loading: boolean;
  refetch: () => Promise<void>;
  setData: (value: T) => void;
};

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: unknown;
  };

  if (!response.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : "Requête impossible.";
    throw new Error(message);
  }

  return payload as T;
}

export function useApiResource<T>(
  path: string,
  enabled: boolean,
  fallback: T,
): ApiResource<T> {
  const fallbackRef = useRef(fallback);
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setData(fallbackRef.current);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setData(await apiJson<T>(path));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Requête impossible.");
    } finally {
      setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, error, loading, refetch, setData };
}
