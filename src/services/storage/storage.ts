import type { AppState } from "../../types/domain";

export const STORAGE_KEY = "canvas-model-ia-state-v1";
export const STORAGE_BACKUP_KEY = "canvas-model-ia-state-v1-backup";

export type StorageLoadResult = {
  state: AppState;
  persisted: boolean;
  available: boolean;
};

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

type PersistedState = Omit<AppState, "schemaVersion"> & { schemaVersion: 1 | 2 };

function isAppState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { schemaVersion?: number; organizations?: unknown; periods?: unknown; observations?: unknown; imports?: unknown; aiHistory?: unknown; activeOrganizationId?: unknown; activePeriodId?: unknown };
  return (candidate.schemaVersion === 1 || candidate.schemaVersion === 2)
    && Array.isArray(candidate.organizations)
    && Array.isArray(candidate.periods)
    && Array.isArray(candidate.observations)
    && Array.isArray(candidate.imports)
    && Array.isArray(candidate.aiHistory)
    && typeof candidate.activeOrganizationId === "string"
    && typeof candidate.activePeriodId === "string";
}

function migrateState(state: AppState): AppState {
  if (state.schemaVersion === 2) return state;
  return {
    ...state,
    schemaVersion: 2,
    scenarios: [],
    canvasVersions: [],
  };
}

type StoredSnapshot = { state: AppState; savedAt: string };

function parseSnapshot(raw: string | null): StoredSnapshot | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isAppState(parsed)) return { state: migrateState(parsed), savedAt: "1970-01-01T00:00:00.000Z" };
    if (!parsed || typeof parsed !== "object" || !("state" in parsed)) return null;
    const envelope = parsed as { state?: unknown; savedAt?: unknown };
    return isAppState(envelope.state)
      ? { state: migrateState(envelope.state), savedAt: typeof envelope.savedAt === "string" ? envelope.savedAt : "1970-01-01T00:00:00.000Z" }
      : null;
  } catch {
    return null;
  }
}

export function loadState(fallback: AppState): StorageLoadResult {
  if (!hasStorage()) return { state: fallback, persisted: false, available: false };

  try {
    const primary = parseSnapshot(window.localStorage.getItem(STORAGE_KEY));
    const backup = parseSnapshot(window.localStorage.getItem(STORAGE_BACKUP_KEY));
    const selected = primary && backup
      ? (primary.savedAt >= backup.savedAt ? primary : backup)
      : primary ?? backup;
    return selected
      ? { state: selected.state, persisted: true, available: true }
      : { state: fallback, persisted: false, available: true };
  } catch {
    return { state: fallback, persisted: false, available: false };
  }
}

export function saveState(state: AppState): boolean {
  if (!hasStorage()) return false;
  const snapshot = JSON.stringify({ state, savedAt: new Date().toISOString() } satisfies StoredSnapshot);
  try {
    window.localStorage.setItem(STORAGE_KEY, snapshot);
    window.localStorage.setItem(STORAGE_BACKUP_KEY, snapshot);
    return true;
  } catch {
    try {
      window.localStorage.setItem(STORAGE_BACKUP_KEY, snapshot);
      return false;
    } catch {
      return false;
    }
  }
}

export function clearState() {
  if (!hasStorage()) return false;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
