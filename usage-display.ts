type LimitWindow = { label: string; scope?: string; resetsAt?: string; usedPercent: number };
type ProviderUsage = {
  live?: { windows: LimitWindow[]; fetchedAt: string; ok: boolean; error?: string };
  local: { offlineWindows?: LimitWindow[]; offlineAt?: string };
};

export function terminalUsage(provider: ProviderUsage, now = Date.now()) {
  const live = provider.live;
  const useLive = !!live?.windows.length;
  const windows = useLive ? live!.windows : provider.local.offlineWindows ?? [];
  const updatedAt = useLive ? live!.fetchedAt : provider.local.offlineAt ?? null;
  const age = updatedAt ? now - Date.parse(updatedAt) : Infinity;
  const fresh = Number.isFinite(age) && age >= -60000 && age < 5 * 60000 && (!useLive || (live!.ok && !live!.error));
  const unscoped = windows.filter(w => !w.scope);
  const preferred = unscoped.length ? unscoped : windows;
  const selected: LimitWindow[] = [];
  for (const label of ["5h", "7d"]) {
    const found = preferred.find(w => w.label === label);
    if (found) selected.push(found);
  }
  if (!selected.length) selected.push(...preferred.slice(0, 2));
  return {
    updatedAt,
    source: windows.length ? (fresh ? (useLive ? "live" : "local") : "stale") : "unknown",
    error: live?.error ?? null,
    windows: selected.map(w => {
      const reset = w.resetsAt ? Date.parse(w.resetsAt) : null;
      const valid = fresh && Number.isFinite(w.usedPercent) && (reset === null || (Number.isFinite(reset) && reset > now));
      return { ...w, remaining: valid ? Math.max(0, Math.min(100, 100 - w.usedPercent)) : null };
    }),
  };
}
