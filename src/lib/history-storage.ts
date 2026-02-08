// History Storage - Speichert Scrape-Ergebnisse im localStorage

export interface HistoryEntry {
  id: string;
  timestamp: number;
  url: string;
  type: "scrape" | "search" | "crawl" | "map" | "agent" | "tech" | "seo" | "procurement";
  provider?: string;
  title?: string;
  preview?: string; // First 200 chars of content
  data?: unknown; // Full result data
  tags?: string[];
}

export interface HistoryFilter {
  type?: string;
  url?: string;
  startDate?: number;
  endDate?: number;
}

const STORAGE_KEY = "webscraper_history";
const MAX_ENTRIES = 100; // Keep last 100 entries

// Get all history entries
export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as HistoryEntry[];
  } catch {
    return [];
  }
}

// Add a new entry
export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry {
  const history = getHistory();

  const newEntry: HistoryEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
  };

  // Add to beginning
  history.unshift(newEntry);

  // Keep only MAX_ENTRIES
  const trimmed = history.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // If storage is full, remove old entries with full data
    const reduced = trimmed.map((entry, i) => {
      if (i > 20) {
        // Remove full data from older entries
        return { ...entry, data: undefined };
      }
      return entry;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
  }

  return newEntry;
}

// Get entry by ID
export function getHistoryEntry(id: string): HistoryEntry | null {
  const history = getHistory();
  return history.find((e) => e.id === id) || null;
}

// Delete entry
export function deleteHistoryEntry(id: string): void {
  const history = getHistory();
  const filtered = history.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Clear all history
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Filter history
export function filterHistory(filter: HistoryFilter): HistoryEntry[] {
  let history = getHistory();

  if (filter.type) {
    history = history.filter((e) => e.type === filter.type);
  }

  if (filter.url) {
    const searchUrl = filter.url.toLowerCase();
    history = history.filter((e) => e.url.toLowerCase().includes(searchUrl));
  }

  if (filter.startDate) {
    history = history.filter((e) => e.timestamp >= filter.startDate!);
  }

  if (filter.endDate) {
    history = history.filter((e) => e.timestamp <= filter.endDate!);
  }

  return history;
}

// Get history for a specific URL (for price comparison)
export function getHistoryForUrl(url: string): HistoryEntry[] {
  const history = getHistory();
  const domain = extractDomain(url);

  return history.filter((e) => {
    const entryDomain = extractDomain(e.url);
    return entryDomain === domain;
  });
}

// Group history by URL domain
export function groupHistoryByDomain(): Record<string, HistoryEntry[]> {
  const history = getHistory();
  const grouped: Record<string, HistoryEntry[]> = {};

  for (const entry of history) {
    const domain = extractDomain(entry.url);
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push(entry);
  }

  return grouped;
}

// Get statistics
export function getHistoryStats(): {
  total: number;
  byType: Record<string, number>;
  byDomain: Record<string, number>;
  lastWeek: number;
} {
  const history = getHistory();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const byType: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  let lastWeek = 0;

  for (const entry of history) {
    // Count by type
    byType[entry.type] = (byType[entry.type] || 0) + 1;

    // Count by domain
    const domain = extractDomain(entry.url);
    byDomain[domain] = (byDomain[domain] || 0) + 1;

    // Count last week
    if (entry.timestamp >= weekAgo) {
      lastWeek++;
    }
  }

  return {
    total: history.length,
    byType,
    byDomain,
    lastWeek,
  };
}

// Helper: Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper: Extract domain from URL
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `Vor ${diffMins} Min.`;
  if (diffHours < 24) return `Vor ${diffHours} Std.`;
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Get type label in German
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    scrape: "Scrape",
    search: "Suche",
    crawl: "Crawl",
    map: "Map",
    agent: "Agent",
    tech: "Tech-Stack",
    seo: "SEO",
    procurement: "E-Procurement",
  };
  return labels[type] || type;
}

// Get type icon
export function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    scrape: "📄",
    search: "🔍",
    crawl: "🕷️",
    map: "🗺️",
    agent: "🤖",
    tech: "🔧",
    seo: "📊",
    procurement: "🔗",
  };
  return icons[type] || "📁";
}
