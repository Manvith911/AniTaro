const STORAGE_KEY = "continue_watching";

export interface ContinueWatchingEntry {
  animeId: string;
  animeName: string;
  animePoster: string;
  episodeId: string;
  episodeNumber: number;
  timestamp: number; // when last watched
}

export function getContinueWatching(): ContinueWatchingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getContinueWatchingForAnime(animeId: string): ContinueWatchingEntry | null {
  const entries = getContinueWatching();
  return entries.find((e) => e.animeId === animeId) || null;
}

export function setContinueWatching(entry: ContinueWatchingEntry) {
  const entries = getContinueWatching().filter((e) => e.animeId !== entry.animeId);
  entries.unshift({ ...entry, timestamp: Date.now() });
  // Keep max 20 entries
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 20)));
}

export function removeContinueWatching(animeId: string) {
  const entries = getContinueWatching().filter((e) => e.animeId !== animeId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
