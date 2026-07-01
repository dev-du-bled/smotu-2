import { useCallback, useEffect, useState } from "react";

export type ApiResource<T> = {
  data: T;
  error: string;
  loading: boolean;
  refetch: () => Promise<void>;
  setData: (value: T) => void;
};

export async function apiJson<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
  token: string | undefined,
  fallback: T,
): ApiResource<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    if (!token) {
      setData(fallback);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setData(await apiJson<T>(path, token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Requête impossible.");
    } finally {
      setLoading(false);
    }
  }, [fallback, path, token]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, error, loading, refetch, setData };
}
