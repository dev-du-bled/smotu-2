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

// --- Cache partagé (stale-while-revalidate) --------------------------------
// On garde la dernière réponse de chaque endpoint en mémoire (et, pour quelques
// endpoints, dans le navigateur) : à la navigation on réaffiche la donnée cachée
// immédiatement, sans flicker « 0 -> data », et on ne re-render que si la
// nouvelle réponse diffère réellement de l'ancienne.

type CacheEntry = {
  data: unknown;
  error: string;
  loading: boolean;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<() => void>>();

// Endpoints dont on garde la dernière valeur dans le navigateur, pour qu'un
// rechargement complet de la page ne reflashe pas non plus.
const PERSISTED_PATHS = new Set<string>(["/api/profile"]);
const PERSIST_PREFIX = "smotu:cache:";

function persistKey(path: string): string {
  return `${PERSIST_PREFIX}${path}`;
}

function readPersisted(path: string): CacheEntry | undefined {
  if (!PERSISTED_PATHS.has(path)) {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(persistKey(path));
    if (!raw) {
      return undefined;
    }
    return { data: JSON.parse(raw), error: "", loading: false };
  } catch {
    return undefined;
  }
}

function getEntry(path: string): CacheEntry | undefined {
  const entry = cache.get(path);
  if (entry) {
    return entry;
  }

  const persisted = readPersisted(path);
  if (persisted) {
    cache.set(path, persisted);
  }
  return persisted;
}

function emit(path: string): void {
  listeners.get(path)?.forEach((listener) => listener());
}

function writeEntry(path: string, entry: CacheEntry): void {
  cache.set(path, entry);

  if (PERSISTED_PATHS.has(path)) {
    try {
      if (entry.data === undefined) {
        window.localStorage.removeItem(persistKey(path));
      } else {
        window.localStorage.setItem(persistKey(path), JSON.stringify(entry.data));
      }
    } catch {
      // Stockage indisponible (mode privé, quota) : on reste en cache mémoire.
    }
  }

  emit(path);
}

function subscribe(path: string, listener: () => void): () => void {
  let set = listeners.get(path);
  if (!set) {
    set = new Set();
    listeners.set(path, set);
  }
  set.add(listener);

  return () => {
    set?.delete(listener);
    if (set && set.size === 0) {
      listeners.delete(path);
    }
  };
}

function revalidate(path: string): Promise<void> {
  const pending = inflight.get(path);
  if (pending) {
    return pending;
  }

  const previous = getEntry(path);
  const hasData = previous !== undefined && previous.data !== undefined;

  // On n'affiche le skeleton (loading) que si on n'a rien à montrer.
  writeEntry(path, {
    data: previous?.data,
    error: "",
    loading: !hasData,
  });

  const promise = (async () => {
    try {
      const data = await apiJson<unknown>(path);
      const current = getEntry(path);
      const changed =
        !current || JSON.stringify(current.data) !== JSON.stringify(data);

      if (changed) {
        writeEntry(path, { data, error: "", loading: false });
      } else {
        writeEntry(path, { data: current.data, error: "", loading: false });
      }
    } catch (reason) {
      const current = getEntry(path);
      writeEntry(path, {
        data: current?.data,
        error: reason instanceof Error ? reason.message : "Requête impossible.",
        loading: false,
      });
    } finally {
      inflight.delete(path);
    }
  })();

  inflight.set(path, promise);
  return promise;
}

// Précharge un endpoint en arrière-plan (ex: au survol d'un lien) pour que la
// donnée soit déjà chaude au moment de la navigation.
export function prefetchResource(path: string): void {
  void revalidate(path);
}

// Vide le cache (ex: à la déconnexion) pour ne pas laisser fuiter les données
// d'un compte vers le suivant.
export function clearApiCache(): void {
  const paths = new Set([...cache.keys(), ...PERSISTED_PATHS]);
  cache.clear();
  inflight.clear();

  for (const path of PERSISTED_PATHS) {
    try {
      window.localStorage.removeItem(persistKey(path));
    } catch {
      // ignore
    }
  }

  for (const path of paths) {
    emit(path);
  }
}

export function useApiResource<T>(
  path: string,
  enabled: boolean,
  fallback: T,
): ApiResource<T> {
  const fallbackRef = useRef(fallback);
  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);

  const read = useCallback((): {
    data: T;
    error: string;
    loading: boolean;
  } => {
    if (!enabled) {
      return { data: fallbackRef.current, error: "", loading: false };
    }

    const entry = getEntry(path);
    if (!entry || entry.data === undefined) {
      return {
        data: fallbackRef.current,
        error: entry?.error ?? "",
        loading: entry?.loading ?? true,
      };
    }

    return { data: entry.data as T, error: entry.error, loading: entry.loading };
  }, [path, enabled]);

  const [snapshot, setSnapshot] = useState(read);

  useEffect(() => {
    setSnapshot(read());

    if (!enabled) {
      return;
    }

    const unsubscribe = subscribe(path, () => setSnapshot(read()));
    void revalidate(path);
    return unsubscribe;
  }, [path, enabled, read]);

  const refetch = useCallback(async () => {
    if (!enabled) {
      return;
    }
    await revalidate(path);
  }, [path, enabled]);

  const setData = useCallback(
    (value: T) => {
      writeEntry(path, { data: value, error: "", loading: false });
    },
    [path],
  );

  return {
    data: snapshot.data,
    error: snapshot.error,
    loading: snapshot.loading,
    refetch,
    setData,
  };
}
