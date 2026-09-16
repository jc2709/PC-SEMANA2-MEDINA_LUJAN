import type { AppState } from "../../types/domain";

export const STORAGE_KEY = "canvas-model-ia-state-v1";

export type StorageLoadResult = {
  state: AppState;
  persisted: boolean;
  available: boolean;
};

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppState>;
  return candidate.schemaVersion === 1
    && Array.isArray(candidate.organizations)
    && Array.isArray(candidate.periods)
    && Array.isArray(candidate.observations)
    && Array.isArray(candidate.imports)
    && Array.isArray(candidate.aiHistory)
    && typeof candidate.activeOrganizationId === "string"
    && typeof candidate.activePeriodId === "string";
}

export function loadState(fallback: AppState): StorageLoadResult {
  if (!hasStorage()) return { state: fallback, persisted: false, available: false };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: fallback, persisted: false, available: true };
    const parsed: unknown = JSON.parse(raw);
    return isAppState(parsed)
      ? { state: parsed, persisted: true, available: true }
      : { state: fallback, persisted: false, available: true };
  } catch {
    return { state: fallback, persisted: false, available: false };
  }
}

export function saveState(state: AppState): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
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
