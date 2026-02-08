// Unified Scraper Interface
// Supports multiple providers with automatic fallback

import { ProviderType, FALLBACK_ORDER, getProviderConfig } from "../providers";
import { scrapeWithJina } from "./jina";
import { scrapeWithScrapingAnt } from "./scrapingant";
import { scrapeWithNative } from "./native";
import { searchWithExa, scrapeWithExa, findSimilarWithExa } from "./exa";

export interface ScrapeResult {
  success: boolean;
  provider: ProviderType;
  data?: {
    markdown: string;
    html?: string;
    url: string;
    title?: string;
  };
  error?: string;
  creditsUsed?: number;
  fallbackUsed?: boolean;
}

export interface SearchResult {
  success: boolean;
  provider: ProviderType;
  data?: {
    results: Array<{
      title: string;
      url: string;
      snippet?: string;
      content?: string;
      publishedDate?: string;
    }>;
    query: string;
    totalResults: number;
  };
  error?: string;
}

interface ScrapeOptions {
  provider?: ProviderType;
  enableFallback?: boolean;
  jsRendering?: boolean;
}

interface SearchOptions {
  provider?: ProviderType;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
}

// Get API keys from environment
function getApiKey(provider: ProviderType): string | undefined {
  const config = getProviderConfig(provider);
  if (!config.requiresApiKey) return undefined;
  return process.env[config.apiKeyEnvVar];
}

// Check if a provider is configured
export function isProviderConfigured(provider: ProviderType): boolean {
  const config = getProviderConfig(provider);
  if (!config.requiresApiKey) return true;
  return !!process.env[config.apiKeyEnvVar];
}

// Get all configured providers
export function getConfiguredProviders(): ProviderType[] {
  const providers: ProviderType[] = ["firecrawl", "exa", "jina", "scrapingant", "native"];
  return providers.filter(isProviderConfigured);
}

// Scrape a URL with the specified provider (or fallback chain)
export async function scrape(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const { provider, enableFallback = true, jsRendering = false } = options;

  // If a specific provider is requested, use only that
  if (provider) {
    return scrapeWithProvider(url, provider, { jsRendering });
  }

  // Use fallback chain
  const fallbackChain = FALLBACK_ORDER.scrape.filter(isProviderConfigured);

  if (fallbackChain.length === 0) {
    // Always have native as last resort
    fallbackChain.push("native");
  }

  let lastError: string | undefined;
  let fallbackUsed = false;

  for (let i = 0; i < fallbackChain.length; i++) {
    const currentProvider = fallbackChain[i];
    const result = await scrapeWithProvider(url, currentProvider, { jsRendering });

    if (result.success) {
      return {
        ...result,
        fallbackUsed: i > 0,
      };
    }

    lastError = result.error;
    fallbackUsed = true;

    if (!enableFallback) break;
  }

  return {
    success: false,
    provider: fallbackChain[fallbackChain.length - 1] || "native",
    error: lastError || "Alle Provider sind fehlgeschlagen",
    fallbackUsed,
  };
}

// Scrape with a specific provider
async function scrapeWithProvider(
  url: string,
  provider: ProviderType,
  options: { jsRendering?: boolean } = {}
): Promise<ScrapeResult> {
  const apiKey = getApiKey(provider);

  switch (provider) {
    case "jina": {
      const result = await scrapeWithJina(url, apiKey);
      return {
        success: result.success,
        provider: "jina",
        data: result.data,
        error: result.error,
      };
    }

    case "scrapingant": {
      if (!apiKey) {
        return {
          success: false,
          provider: "scrapingant",
          error: "ScrapingAnt API-Key nicht konfiguriert",
        };
      }
      const result = await scrapeWithScrapingAnt(url, apiKey, {
        jsRendering: options.jsRendering,
      });
      return {
        success: result.success,
        provider: "scrapingant",
        data: result.data,
        error: result.error,
        creditsUsed: result.creditsUsed,
      };
    }

    case "exa": {
      if (!apiKey) {
        return {
          success: false,
          provider: "exa",
          error: "Exa API-Key nicht konfiguriert",
        };
      }
      const result = await scrapeWithExa(url, apiKey);
      return {
        success: result.success,
        provider: "exa",
        data: result.data,
        error: result.error,
      };
    }

    case "firecrawl": {
      // Firecrawl uses its own implementation in the API route
      return {
        success: false,
        provider: "firecrawl",
        error: "Firecrawl wird über eine separate API-Route verarbeitet",
      };
    }

    case "native":
    default: {
      const result = await scrapeWithNative(url);
      return {
        success: result.success,
        provider: "native",
        data: result.data,
        error: result.error,
      };
    }
  }
}

// Search the web
export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const { provider = "exa", numResults = 10, includeDomains, excludeDomains } = options;

  switch (provider) {
    case "exa": {
      const apiKey = getApiKey("exa");
      if (!apiKey) {
        return {
          success: false,
          provider: "exa",
          error: "Exa API-Key nicht konfiguriert",
        };
      }
      const result = await searchWithExa(query, apiKey, {
        numResults,
        includeDomains,
        excludeDomains,
      });
      return {
        success: result.success,
        provider: "exa",
        data: result.data,
        error: result.error,
      };
    }

    default:
      return {
        success: false,
        provider: provider as ProviderType,
        error: `Provider ${provider} unterstützt keine Suche`,
      };
  }
}

// Find similar pages
export async function findSimilar(
  url: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const apiKey = getApiKey("exa");
  if (!apiKey) {
    return {
      success: false,
      provider: "exa",
      error: "Exa API-Key nicht konfiguriert",
    };
  }

  const result = await findSimilarWithExa(url, apiKey, {
    numResults: options.numResults,
    includeDomains: options.includeDomains,
    excludeDomains: options.excludeDomains,
  });

  return {
    success: result.success,
    provider: "exa",
    data: result.data,
    error: result.error,
  };
}

// Export individual scrapers for direct use
export { scrapeWithJina } from "./jina";
export { scrapeWithScrapingAnt } from "./scrapingant";
export { scrapeWithNative } from "./native";
export { searchWithExa, scrapeWithExa, findSimilarWithExa } from "./exa";
