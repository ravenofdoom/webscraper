"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getHistory,
  deleteHistoryEntry,
  clearHistory,
  getHistoryStats,
  formatTimestamp,
  getTypeLabel,
  getTypeIcon,
  type HistoryEntry,
} from "@/lib/history-storage";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getHistoryStats> | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [urlFilter, setUrlFilter] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    let filtered = history;

    if (typeFilter !== "all") {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }

    if (urlFilter) {
      const search = urlFilter.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.url.toLowerCase().includes(search) ||
          e.title?.toLowerCase().includes(search) ||
          e.preview?.toLowerCase().includes(search)
      );
    }

    setFilteredHistory(filtered);
  }, [history, typeFilter, urlFilter]);

  const loadHistory = () => {
    const h = getHistory();
    setHistory(h);
    setFilteredHistory(h);
    setStats(getHistoryStats());
  };

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    loadHistory();
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  const handleClearAll = () => {
    if (confirm("Alle History-Einträge löschen?")) {
      clearHistory();
      loadHistory();
      setSelectedEntry(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const uniqueTypes = [...new Set(history.map((e) => e.type))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
              onClick={() => router.push("/dashboard")}
            >
              ← Zurück
            </Button>
            <h1 className="text-xl font-bold text-white">📜 Scraping-History</h1>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
              onClick={handleClearAll}
            >
              Alles löschen
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <p className="text-slate-400 text-sm">Gesamt</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <p className="text-slate-400 text-sm">Letzte 7 Tage</p>
                <p className="text-2xl font-bold text-white">{stats.lastWeek}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <p className="text-slate-400 text-sm">Domains</p>
                <p className="text-2xl font-bold text-white">
                  {Object.keys(stats.byDomain).length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <p className="text-slate-400 text-sm">Häufigster Typ</p>
                <p className="text-2xl font-bold text-white">
                  {Object.entries(stats.byType).sort(([, a], [, b]) => b - a)[0]?.[0] || "-"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* History List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="URL oder Inhalt suchen..."
                      value={urlFilter}
                      onChange={(e) => setUrlFilter(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Alle Typen" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">Alle Typen</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTypeIcon(type)} {getTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Empty State */}
            {filteredHistory.length === 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <span className="text-4xl">📜</span>
                  <p className="mt-4 text-slate-400">
                    {history.length === 0
                      ? "Noch keine Scraping-Ergebnisse gespeichert"
                      : "Keine Ergebnisse für diese Filter"}
                  </p>
                  {history.length === 0 && (
                    <p className="mt-2 text-slate-500 text-sm">
                      Ergebnisse werden automatisch nach jedem Scrape gespeichert
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* History Entries */}
            {filteredHistory.map((entry) => (
              <Card
                key={entry.id}
                className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-colors ${
                  selectedEntry?.id === entry.id ? "ring-2 ring-blue-500" : "hover:border-slate-600"
                }`}
                onClick={() => setSelectedEntry(entry)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-slate-600 text-xs">
                          {getTypeIcon(entry.type)} {getTypeLabel(entry.type)}
                        </Badge>
                        <span className="text-slate-400 text-xs">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-white font-medium truncate">
                        {entry.title || entry.url}
                      </p>
                      <p className="text-slate-400 text-sm truncate">{entry.url}</p>
                      {entry.preview && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">
                          {entry.preview}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail View */}
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Details</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedEntry ? (
                  <p className="text-slate-400 text-center py-8">
                    Wähle einen Eintrag aus der Liste
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Typ</p>
                      <Badge className="bg-slate-600">
                        {getTypeIcon(selectedEntry.type)} {getTypeLabel(selectedEntry.type)}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-slate-400 text-xs mb-1">Zeitpunkt</p>
                      <p className="text-white text-sm">
                        {new Date(selectedEntry.timestamp).toLocaleString("de-DE")}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-xs mb-1">URL</p>
                      <p className="text-white text-sm break-all">{selectedEntry.url}</p>
                    </div>

                    {selectedEntry.provider && (
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Provider</p>
                        <p className="text-white text-sm">{selectedEntry.provider}</p>
                      </div>
                    )}

                    {selectedEntry.title && (
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Titel</p>
                        <p className="text-white text-sm">{selectedEntry.title}</p>
                      </div>
                    )}

                    {selectedEntry.preview && (
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Vorschau</p>
                        <div className="bg-slate-700/50 rounded p-2 max-h-48 overflow-y-auto">
                          <p className="text-slate-300 text-xs whitespace-pre-wrap">
                            {selectedEntry.preview}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedEntry.data !== undefined && (
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Vollständige Daten</p>
                        <div className="bg-slate-700/50 rounded p-2 max-h-64 overflow-y-auto">
                          <pre className="text-slate-300 text-xs overflow-x-auto">
                            {JSON.stringify(selectedEntry.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-700 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(selectedEntry, null, 2)
                          );
                        }}
                      >
                        📋 Kopieren
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-600 text-red-400 hover:bg-red-900/20"
                        onClick={() => handleDelete(selectedEntry.id)}
                      >
                        🗑️ Löschen
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
