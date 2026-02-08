"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ANALYSIS_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getTemplateById,
  type AnalysisTemplate,
} from "@/lib/ecommerce-templates";

type ToolType = "scrape" | "search" | "crawl" | "map" | "agent";
type ProviderType = "firecrawl" | "exa" | "jina" | "scrapingant" | "native" | "auto";

interface ApiResult {
  success: boolean;
  provider?: string;
  fallbackUsed?: boolean;
  data?: {
    markdown?: string;
    html?: string;
    links?: string[];
    results?: Array<{ title: string; url: string; snippet?: string; content?: string }>;
    data?: Array<{ markdown?: string }>;
    output?: string;
    result?: unknown;
    [key: string]: unknown;
  };
  error?: string;
}

// Provider configurations
const PROVIDERS = {
  auto: { name: "Auto (Fallback)", icon: "🔄", color: "slate", description: "Automatische Auswahl mit Fallback" },
  firecrawl: { name: "Firecrawl", icon: "🔥", color: "orange", description: "500 Credits, Agent & Crawl" },
  exa: { name: "Exa", icon: "🔮", color: "purple", description: "$10 Credits, Semantische Suche" },
  jina: { name: "Jina Reader", icon: "📖", color: "blue", description: "Unbegrenzt, Rate-Limited" },
  scrapingant: { name: "ScrapingAnt", icon: "🐜", color: "red", description: "10k/Monat, JS-Rendering" },
  native: { name: "Native Fetch", icon: "🌐", color: "green", description: "Unbegrenzt, nur statische Seiten" },
};

// Tool configurations with tips
const TOOLS = {
  scrape: {
    name: "Scrape",
    icon: "📄",
    description: "Extrahiert den Inhalt einer einzelnen URL als Markdown.",
    providers: ["auto", "jina", "scrapingant", "firecrawl", "native"],
    tips: [
      "Gib die vollständige URL ein (inkl. https://)",
      "Wähle 'Auto' für automatische Provider-Auswahl",
      "Aktiviere JS-Rendering für dynamische Seiten",
      "Ideal für Produktseiten, Blogs, Dokumentation",
    ],
  },
  search: {
    name: "Search",
    icon: "🔍",
    description: "Durchsucht das Web semantisch nach relevanten Inhalten.",
    providers: ["exa"],
    tips: [
      "Beschreibe, was du suchst - nicht nur Keywords",
      "Nutze 'Ähnliche Seiten' für Wettbewerber-Analyse",
      "Beispiel: 'Online-Shops für nachhaltige Mode'",
      "Ergebnisse enthalten Titel, URL und Inhalt",
    ],
  },
  crawl: {
    name: "Crawl",
    icon: "🕷️",
    description: "Durchsucht eine Website rekursiv und sammelt mehrere Seiten.",
    providers: ["firecrawl"],
    tips: [
      "Starte mit der Startseite der Domain",
      "Setze ein Limit um Credits zu sparen",
      "Ideal für Knowledge Base Aufbau",
      "Folgt automatisch internen Links",
    ],
  },
  map: {
    name: "Map",
    icon: "🗺️",
    description: "Erstellt eine Übersicht aller URLs einer Website.",
    providers: ["firecrawl"],
    tips: [
      "Schneller als Crawl - nur URLs, keine Inhalte",
      "Nutze Filter für spezifische Bereiche (z.B. 'blog')",
      "Gut zur Planung vor dem Scrapen",
      "Zeigt die Struktur einer Website",
    ],
  },
  agent: {
    name: "Agent",
    icon: "🤖",
    description: "KI-Agent sucht autonom im Web nach Informationen.",
    providers: ["firecrawl"],
    tips: [
      "Formuliere präzise Fragen in natürlicher Sprache",
      "URLs sind optional - Agent sucht selbstständig",
      "Beispiel: 'Welche PIM-Software nutzt shop.de?'",
      "Kann mehrere Minuten dauern - Geduld!",
    ],
  },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const resultRef = useRef<HTMLDivElement>(null);

  // Form states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [activeTab, setActiveTab] = useState<ToolType>("scrape");
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, boolean>>({});

  // Provider selection per tool
  const [scrapeProvider, setScrapeProvider] = useState<ProviderType>("auto");
  const [searchProvider, setSearchProvider] = useState<ProviderType>("exa");

  // Scrape form
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [jsRendering, setJsRendering] = useState(false);

  // Search form
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"search" | "similar">("search");
  const [similarUrl, setSimilarUrl] = useState("");
  const [numResults, setNumResults] = useState("10");

  // Crawl form
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlLimit, setCrawlLimit] = useState("10");

  // Map form
  const [mapUrl, setMapUrl] = useState("");
  const [mapSearch, setMapSearch] = useState("");
  const [mapLimit, setMapLimit] = useState("100");

  // Agent form
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentUrls, setAgentUrls] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Load configured providers on mount
  useEffect(() => {
    fetch("/api/scrape-multi")
      .then((res) => res.json())
      .then((data) => {
        if (data.providers) {
          setConfiguredProviders(data.providers);
        }
      })
      .catch(() => {});
  }, []);

  // Progress animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Redirect if not authenticated
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

  const getLoadingMessages = (tool: ToolType): string[] => {
    switch (tool) {
      case "agent":
        return ["Agent startet...", "Durchsuche das Web...", "Analysiere Inhalte...", "Extrahiere Informationen..."];
      case "scrape":
        return ["Lade Seite...", "Extrahiere Inhalte...", "Formatiere Daten..."];
      case "search":
        return ["Suche läuft...", "Analysiere Ergebnisse...", "Extrahiere Inhalte..."];
      case "crawl":
        return ["Starte Crawl...", "Folge Links...", "Sammle Seiten..."];
      case "map":
        return ["Analysiere Domain...", "Sammle URLs...", "Erstelle Sitemap..."];
      default:
        return ["Verarbeite..."];
    }
  };

  const handleSubmit = async (tool: ToolType) => {
    setLoading(true);
    setResult(null);

    const messages = getLoadingMessages(tool);
    let messageIndex = 0;
    setLoadingMessage(messages[0]);

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 2000);

    try {
      let response: Response;
      let body: Record<string, unknown> = {};

      switch (tool) {
        case "scrape":
          body = {
            url: scrapeUrl,
            provider: scrapeProvider === "auto" ? undefined : scrapeProvider,
            enableFallback: scrapeProvider === "auto",
            jsRendering,
          };
          response = await fetch("/api/scrape-multi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          break;

        case "search":
          body = {
            type: searchType,
            query: searchType === "search" ? searchQuery : undefined,
            url: searchType === "similar" ? similarUrl : undefined,
            numResults: parseInt(numResults),
          };
          response = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          break;

        case "crawl":
          body = { url: crawlUrl, limit: parseInt(crawlLimit) };
          response = await fetch("/api/crawl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          break;

        case "map":
          body = { url: mapUrl, search: mapSearch || undefined, limit: parseInt(mapLimit) };
          response = await fetch("/api/map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          break;

        case "agent":
          body = {
            prompt: agentPrompt,
            urls: agentUrls ? agentUrls.split("\n").filter((u) => u.trim()) : undefined,
          };
          response = await fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          break;

        default:
          throw new Error("Unknown tool");
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const exportToPdf = async () => {
    if (!resultRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: "#0f172a",
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`webscraper-result-${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("PDF Export fehlgeschlagen.");
    }
  };

  // Extract content from result for display
  const getDisplayContent = (): string => {
    if (!result?.data) return "";

    // Search results
    if (result.data.results && Array.isArray(result.data.results)) {
      return result.data.results.map((r, i) =>
        `## ${i + 1}. ${r.title}\n\n**URL:** ${r.url}\n\n${r.snippet || r.content || ""}`
      ).join("\n\n---\n\n");
    }

    // Agent output
    if (result.data.output) {
      if (typeof result.data.output === "string") return result.data.output;
      return "```json\n" + JSON.stringify(result.data.output, null, 2) + "\n```";
    }

    // Direct markdown
    if (result.data.markdown) return result.data.markdown;

    // Crawl results
    if (Array.isArray(result.data.data)) {
      return result.data.data
        .map((page, i) => `## Page ${i + 1}\n\n${page.markdown || "No content"}`)
        .join("\n\n---\n\n");
    }

    // Links from map
    if (Array.isArray(result.data.links)) {
      return "## Gefundene URLs\n\n" + result.data.links
        .map((link: string | { url?: string }) =>
          typeof link === "string" ? `- ${link}` : `- ${(link as { url?: string }).url || JSON.stringify(link)}`
        )
        .join("\n");
    }

    return "```json\n" + JSON.stringify(result.data, null, 2) + "\n```";
  };

  const ProviderBadge = ({ provider }: { provider: string }) => {
    const config = PROVIDERS[provider as keyof typeof PROVIDERS];
    if (!config) return null;
    return (
      <Badge variant="outline" className="text-xs">
        {config.icon} {config.name}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">🌐 WebScraper</h1>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 text-xs md:text-sm" onClick={() => router.push("/dashboard/compare")}>
              📊 Vergleich
            </Button>
            <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 text-xs md:text-sm" onClick={() => router.push("/dashboard/tech-check")}>
              🔧 Tech-Stack
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs md:text-sm" onClick={() => router.push("/docs/de")}>
              Hilfe
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs md:text-sm" onClick={() => router.push("/settings")}>
              Settings
            </Button>
            <span className="text-slate-400 text-sm hidden md:inline">{session?.user?.name}</span>
            <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-700" onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {loading && (
        <div className="fixed top-[65px] left-0 right-0 z-20">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tools Panel */}
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
            <CardHeader className="bg-slate-800/50 pb-4">
              <CardTitle className="text-white text-xl">Web Scraping Tools</CardTitle>
              <CardDescription className="text-slate-400">
                Wähle ein Tool und einen Provider für deine Anfrage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ToolType)}>
                <TabsList className="grid grid-cols-5 mb-6 bg-slate-700 h-auto p-1 rounded-lg overflow-hidden">
                  {Object.entries(TOOLS).map(([id, tool]) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      className="cursor-pointer data-[state=active]:bg-blue-600 flex flex-col gap-1 py-3 px-2 min-h-[60px]"
                    >
                      <span className="text-lg">{tool.icon}</span>
                      <span className="text-xs font-medium">{tool.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Scrape Tab */}
                <TabsContent value="scrape" className="space-y-4">
                  <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                    <p className="text-green-300 text-sm">{TOOLS.scrape.icon} {TOOLS.scrape.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Provider</Label>
                    <Select value={scrapeProvider} onValueChange={(v) => setScrapeProvider(v as ProviderType)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {TOOLS.scrape.providers.map((p) => (
                          <SelectItem key={p} value={p} disabled={p !== "auto" && p !== "native" && !configuredProviders[p]}>
                            {PROVIDERS[p as keyof typeof PROVIDERS].icon} {PROVIDERS[p as keyof typeof PROVIDERS].name}
                            {p !== "auto" && p !== "native" && !configuredProviders[p] && " (nicht konfiguriert)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-400">{PROVIDERS[scrapeProvider as keyof typeof PROVIDERS]?.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">URL</Label>
                    <Input
                      placeholder="https://example.com"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  {(scrapeProvider === "scrapingant" || scrapeProvider === "auto") && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="jsRendering"
                        checked={jsRendering}
                        onChange={(e) => setJsRendering(e.target.checked)}
                        className="rounded bg-slate-700"
                      />
                      <Label htmlFor="jsRendering" className="text-white text-sm">JavaScript Rendering (kostet 10 Credits bei ScrapingAnt)</Label>
                    </div>
                  )}

                  <Button onClick={() => handleSubmit("scrape")} disabled={loading || !scrapeUrl} className="w-full bg-green-600 hover:bg-green-700">
                    {loading && activeTab === "scrape" ? loadingMessage : "Scrape URL"}
                  </Button>
                </TabsContent>

                {/* Search Tab */}
                <TabsContent value="search" className="space-y-4">
                  <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-3">
                    <p className="text-purple-300 text-sm">{TOOLS.search.icon} {TOOLS.search.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Suchtyp</Label>
                    <Select value={searchType} onValueChange={(v) => setSearchType(v as "search" | "similar")}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="search">🔍 Semantische Suche</SelectItem>
                        <SelectItem value="similar">🔗 Ähnliche Seiten finden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {searchType === "search" ? (
                    <div className="space-y-2">
                      <Label className="text-white">Suchanfrage</Label>
                      <Textarea
                        placeholder="z.B. E-Commerce Shops die Shopify nutzen in Deutschland"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        rows={3}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-white">URL für Ähnlichkeitssuche</Label>
                      <Input
                        placeholder="https://example-shop.com"
                        value={similarUrl}
                        onChange={(e) => setSimilarUrl(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-white">Anzahl Ergebnisse</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={numResults}
                      onChange={(e) => setNumResults(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <Button
                    onClick={() => handleSubmit("search")}
                    disabled={loading || (searchType === "search" ? !searchQuery : !similarUrl) || !configuredProviders.exa}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {!configuredProviders.exa ? "Exa nicht konfiguriert" : loading && activeTab === "search" ? loadingMessage : "Suche starten"}
                  </Button>
                </TabsContent>

                {/* Crawl Tab */}
                <TabsContent value="crawl" className="space-y-4">
                  <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
                    <p className="text-orange-300 text-sm">{TOOLS.crawl.icon} {TOOLS.crawl.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Start URL</Label>
                    <Input
                      placeholder="https://example.com"
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Seiten-Limit</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={crawlLimit}
                      onChange={(e) => setCrawlLimit(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <Button
                    onClick={() => handleSubmit("crawl")}
                    disabled={loading || !crawlUrl || !configuredProviders.firecrawl}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {!configuredProviders.firecrawl ? "Firecrawl nicht konfiguriert" : loading && activeTab === "crawl" ? loadingMessage : "Start Crawl"}
                  </Button>
                </TabsContent>

                {/* Map Tab */}
                <TabsContent value="map" className="space-y-4">
                  <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-3">
                    <p className="text-cyan-300 text-sm">{TOOLS.map.icon} {TOOLS.map.description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Domain URL</Label>
                    <Input
                      placeholder="https://example.com"
                      value={mapUrl}
                      onChange={(e) => setMapUrl(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Suchfilter (optional)</Label>
                    <Input
                      placeholder="blog, docs, api..."
                      value={mapSearch}
                      onChange={(e) => setMapSearch(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Limit</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5000"
                      value={mapLimit}
                      onChange={(e) => setMapLimit(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <Button
                    onClick={() => handleSubmit("map")}
                    disabled={loading || !mapUrl || !configuredProviders.firecrawl}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    {!configuredProviders.firecrawl ? "Firecrawl nicht konfiguriert" : loading && activeTab === "map" ? loadingMessage : "Map URLs"}
                  </Button>
                </TabsContent>

                {/* Agent Tab */}
                <TabsContent value="agent" className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                    <p className="text-blue-300 text-sm">{TOOLS.agent.icon} {TOOLS.agent.description}</p>
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label className="text-white">Analyse-Vorlage (optional)</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        setSelectedTemplate(value);
                        if (value) {
                          const template = getTemplateById(value);
                          if (template) {
                            setAgentPrompt(template.prompt);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Vorlage wählen oder eigenen Prompt schreiben..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600 max-h-80">
                        <SelectItem value="custom" className="text-slate-300">
                          ✏️ Eigener Prompt
                        </SelectItem>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([catId, cat]) => (
                          <div key={catId}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 bg-slate-800">
                              {cat.icon} {cat.name}
                            </div>
                            {ANALYSIS_TEMPLATES
                              .filter((t) => t.category === catId)
                              .map((template) => (
                                <SelectItem key={template.id} value={template.id} className="text-white">
                                  {template.icon} {template.name}
                                </SelectItem>
                              ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTemplate && selectedTemplate !== "custom" && (
                      <p className="text-xs text-slate-400">
                        {getTemplateById(selectedTemplate)?.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">
                      {selectedTemplate && selectedTemplate !== "custom" ? "Analyse-Prompt (anpassbar)" : "Was möchtest du herausfinden?"}
                    </Label>
                    <Textarea
                      placeholder="z.B. Welche PIM-Software nutzt der Böttcher Online Shop?"
                      value={agentPrompt}
                      onChange={(e) => {
                        setAgentPrompt(e.target.value);
                        if (selectedTemplate && selectedTemplate !== "custom") {
                          // If user edits template prompt, switch to custom
                          const template = getTemplateById(selectedTemplate);
                          if (template && e.target.value !== template.prompt) {
                            setSelectedTemplate("custom");
                          }
                        }
                      }}
                      rows={6}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Ziel-URLs (eine pro Zeile)</Label>
                    <Textarea
                      placeholder="https://shop.example.com"
                      value={agentUrls}
                      onChange={(e) => setAgentUrls(e.target.value)}
                      rows={2}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-400">
                      Der Agent analysiert diese URLs mit dem gewählten Prompt
                    </p>
                  </div>

                  <Button
                    onClick={() => handleSubmit("agent")}
                    disabled={loading || !agentPrompt || !configuredProviders.firecrawl}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {!configuredProviders.firecrawl ? "Firecrawl nicht konfiguriert" : loading && activeTab === "agent" ? loadingMessage : "Analyse starten"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle className="text-white">Ergebnisse</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {result?.provider && <ProviderBadge provider={result.provider} />}
                  {result?.fallbackUsed && <Badge variant="secondary" className="text-xs">Fallback</Badge>}
                  {result?.success && (
                    <>
                      <Select value={viewMode} onValueChange={(v) => setViewMode(v as "formatted" | "raw")}>
                        <SelectTrigger className="w-28 h-8 bg-slate-700 border-slate-600 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="formatted">Formatiert</SelectItem>
                          <SelectItem value="raw">Raw JSON</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={exportToPdf} className="border-slate-600 text-white hover:bg-slate-700">
                        PDF
                      </Button>
                    </>
                  )}
                  {result && (
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Erfolg" : "Fehler"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <p className="text-slate-400 text-center">{loadingMessage}</p>
                </div>
              ) : !result ? (
                <div className="py-6 px-4">
                  <div className="text-center mb-6">
                    <span className="text-4xl mb-2 block">{TOOLS[activeTab].icon}</span>
                    <h3 className="text-xl font-semibold text-slate-300">{TOOLS[activeTab].name}</h3>
                    <p className="text-slate-500 text-sm mt-1">{TOOLS[activeTab].description}</p>
                  </div>
                  <div className="border-t border-slate-700 pt-4">
                    <h4 className="text-slate-400 text-sm font-medium mb-3 text-center">💡 Tipps</h4>
                    <ul className="space-y-2">
                      {TOOLS[activeTab].tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-slate-500 text-sm">
                          <span className="text-slate-600">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : result.error ? (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <p className="text-red-300 font-medium mb-2">Fehler</p>
                  <p className="text-red-200 text-sm">{result.error}</p>
                </div>
              ) : (
                <div ref={resultRef} className="bg-slate-900 rounded-lg p-6 max-h-[600px] overflow-auto">
                  {viewMode === "formatted" ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{getDisplayContent()}</ReactMarkdown>
                    </div>
                  ) : (
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap break-words font-mono">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Provider Overview */}
        <Card className="mt-8 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Verfügbare Provider</CardTitle>
            <CardDescription className="text-slate-400">
              Status der konfigurierten Scraping-Provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(PROVIDERS).filter(([id]) => id !== "auto").map(([id, provider]) => (
                <div
                  key={id}
                  className={`p-4 rounded-lg border ${
                    configuredProviders[id] || id === "native"
                      ? "border-green-700/50 bg-green-900/20"
                      : "border-slate-700 bg-slate-800/30"
                  }`}
                >
                  <div className="text-2xl mb-2">{provider.icon}</div>
                  <div className="font-medium text-white text-sm">{provider.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{provider.description}</div>
                  <Badge
                    variant={configuredProviders[id] || id === "native" ? "default" : "secondary"}
                    className="mt-2 text-xs"
                  >
                    {configuredProviders[id] || id === "native" ? "✓ Aktiv" : "Nicht konfiguriert"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
