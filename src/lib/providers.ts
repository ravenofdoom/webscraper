// Scraping Provider Configuration
// Supports multiple providers with automatic fallback

export type ProviderType = "firecrawl" | "exa" | "jina" | "scrapingant" | "native";

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  description: string;
  features: string[];
  limitations: string[];
  freeCredits: string;
  bestFor: string;
  color: string;
  icon: string;
  enabled: boolean;
  requiresApiKey: boolean;
  apiKeyEnvVar: string;
  docsUrl: string;
}

export const PROVIDERS: Record<ProviderType, ProviderConfig> = {
  firecrawl: {
    id: "firecrawl",
    name: "Firecrawl",
    description: "KI-gestütztes Web-Scraping mit Agent-Funktion. Verarbeitet JavaScript-Seiten und komplexe Websites.",
    features: [
      "Agent für autonome Web-Suche",
      "JavaScript-Rendering",
      "Anti-Bot-Umgehung",
      "Strukturierte Datenextraktion",
      "Crawling ganzer Websites",
      "Map für URL-Discovery",
    ],
    limitations: [
      "500 kostenlose Credits (einmalig)",
      "Danach kostenpflichtig",
    ],
    freeCredits: "500 Credits",
    bestFor: "Komplexe Shops, JS-Heavy Seiten, Agent-Aufgaben",
    color: "orange",
    icon: "🔥",
    enabled: true,
    requiresApiKey: true,
    apiKeyEnvVar: "FIRECRAWL_API_KEY",
    docsUrl: "https://firecrawl.dev",
  },
  exa: {
    id: "exa",
    name: "Exa",
    description: "Semantische Web-Suche mit KI. Findet relevante Inhalte basierend auf Bedeutung, nicht nur Keywords.",
    features: [
      "Semantische Suche",
      "Content-Extraktion",
      "Ähnliche Seiten finden",
      "News & Artikel durchsuchen",
      "Embedding-basierte Suche",
    ],
    limitations: [
      "$10 kostenlose Credits",
      "Pay-per-use danach",
    ],
    freeCredits: "$10 Credits (~2000 Suchen)",
    bestFor: "Wettbewerber-Recherche, Marktanalyse, Content-Discovery",
    color: "purple",
    icon: "🔮",
    enabled: true,
    requiresApiKey: true,
    apiKeyEnvVar: "EXA_API_KEY",
    docsUrl: "https://exa.ai",
  },
  jina: {
    id: "jina",
    name: "Jina Reader",
    description: "Konvertiert jede URL in sauberes Markdown. Einfachste Integration, ideal für LLM-ready Content.",
    features: [
      "URL zu Markdown Konvertierung",
      "Automatische Content-Extraktion",
      "Entfernt Werbung & Navigation",
      "Sehr einfache API (URL-Prefix)",
      "Schnell und zuverlässig",
    ],
    limitations: [
      "20 req/min ohne Key",
      "200 req/min mit kostenlosem Key",
      "Kein JavaScript-Rendering",
    ],
    freeCredits: "Unbegrenzt (Rate-Limited)",
    bestFor: "Blogs, Artikel, Produktseiten, Dokumentation",
    color: "blue",
    icon: "📖",
    enabled: true,
    requiresApiKey: false, // Optional, but increases rate limit
    apiKeyEnvVar: "JINA_API_KEY",
    docsUrl: "https://jina.ai/reader",
  },
  scrapingant: {
    id: "scrapingant",
    name: "ScrapingAnt",
    description: "Web-Scraping API mit Proxy-Rotation und Anti-Bot-Schutz. Großzügiges kostenloses Kontingent.",
    features: [
      "10.000 Credits/Monat kostenlos",
      "Proxy-Rotation",
      "JavaScript-Rendering",
      "Anti-Bot-Umgehung",
      "Headless Chrome",
    ],
    limitations: [
      "10.000 Credits/Monat",
      "JS-Rendering kostet 10 Credits",
      "Keine Kreditkarte nötig",
    ],
    freeCredits: "10.000 Credits/Monat",
    bestFor: "E-Commerce Shops, dynamische Seiten, regelmäßiges Scraping",
    color: "red",
    icon: "🐜",
    enabled: true,
    requiresApiKey: true,
    apiKeyEnvVar: "SCRAPINGANT_API_KEY",
    docsUrl: "https://scrapingant.com",
  },
  native: {
    id: "native",
    name: "Native Fetch",
    description: "Direkter HTTP-Abruf ohne externe API. Komplett kostenlos und unbegrenzt, aber nur für einfache Seiten.",
    features: [
      "Komplett kostenlos",
      "Keine API-Keys nötig",
      "Unbegrenzte Requests",
      "Schnellste Option",
      "HTML zu Markdown Konvertierung",
    ],
    limitations: [
      "Kein JavaScript-Rendering",
      "Keine Anti-Bot-Umgehung",
      "Nur öffentliche Seiten",
      "Keine Proxy-Rotation",
    ],
    freeCredits: "Unbegrenzt",
    bestFor: "Einfache Blogs, statische Seiten, öffentliche Produktseiten",
    color: "green",
    icon: "🌐",
    enabled: true,
    requiresApiKey: false,
    apiKeyEnvVar: "",
    docsUrl: "",
  },
};

// Tool types available for each provider
export type ToolType = "scrape" | "search" | "crawl" | "map" | "agent";

export interface ToolConfig {
  id: ToolType;
  name: string;
  description: string;
  icon: string;
  supportedProviders: ProviderType[];
}

export const TOOLS: Record<ToolType, ToolConfig> = {
  scrape: {
    id: "scrape",
    name: "Scrape",
    description: "Extrahiert den Inhalt einer einzelnen URL als Markdown oder strukturierte Daten.",
    icon: "📄",
    supportedProviders: ["firecrawl", "jina", "scrapingant", "native"],
  },
  search: {
    id: "search",
    name: "Search",
    description: "Durchsucht das Web nach relevanten Inhalten basierend auf einer Suchanfrage.",
    icon: "🔍",
    supportedProviders: ["exa", "firecrawl"],
  },
  crawl: {
    id: "crawl",
    name: "Crawl",
    description: "Durchsucht eine Website rekursiv und sammelt Inhalte von mehreren Unterseiten.",
    icon: "🕷️",
    supportedProviders: ["firecrawl"],
  },
  map: {
    id: "map",
    name: "Map",
    description: "Erstellt eine Übersicht aller URLs einer Website ohne die Inhalte zu extrahieren.",
    icon: "🗺️",
    supportedProviders: ["firecrawl"],
  },
  agent: {
    id: "agent",
    name: "Agent",
    description: "KI-Agent sucht autonom im Web nach Informationen basierend auf natürlicher Sprache.",
    icon: "🤖",
    supportedProviders: ["firecrawl"],
  },
};

export function getEnabledProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS).filter((p) => p.enabled);
}

export function getProviderConfig(id: ProviderType): ProviderConfig {
  return PROVIDERS[id];
}

export function getProvidersForTool(toolId: ToolType): ProviderConfig[] {
  const tool = TOOLS[toolId];
  return tool.supportedProviders.map((id) => PROVIDERS[id]).filter((p) => p.enabled);
}

export function getToolsForProvider(providerId: ProviderType): ToolConfig[] {
  return Object.values(TOOLS).filter((t) => t.supportedProviders.includes(providerId));
}

// Fallback order for each tool
export const FALLBACK_ORDER: Record<ToolType, ProviderType[]> = {
  scrape: ["jina", "scrapingant", "firecrawl", "native"],
  search: ["exa", "firecrawl"],
  crawl: ["firecrawl"],
  map: ["firecrawl"],
  agent: ["firecrawl"],
};
