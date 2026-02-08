// Exa API - Semantic web search
// Docs: https://docs.exa.ai

import Exa from "exa-js";

export interface ExaSearchResult {
  success: boolean;
  data?: {
    results: Array<{
      title: string;
      url: string;
      snippet?: string;
      content?: string;
      publishedDate?: string;
      author?: string;
    }>;
    query: string;
    totalResults: number;
  };
  error?: string;
}

export interface ExaScrapeResult {
  success: boolean;
  data?: {
    markdown: string;
    url: string;
    title?: string;
  };
  error?: string;
}

interface ExaSearchOptions {
  numResults?: number;
  type?: "keyword" | "neural" | "auto";
  useAutoprompt?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  includeText?: boolean;
}

export function getExaClient(apiKey: string): Exa {
  return new Exa(apiKey);
}

export async function searchWithExa(
  query: string,
  apiKey: string,
  options: ExaSearchOptions = {}
): Promise<ExaSearchResult> {
  if (!apiKey) {
    return {
      success: false,
      error: "Exa API-Key nicht konfiguriert",
    };
  }

  try {
    const exa = new Exa(apiKey);

    const searchOptions: Parameters<typeof exa.searchAndContents>[1] = {
      numResults: options.numResults || 10,
      type: options.type || "auto",
      useAutoprompt: options.useAutoprompt ?? true,
      text: true, // Get text content
    };

    if (options.includeDomains && options.includeDomains.length > 0) {
      searchOptions.includeDomains = options.includeDomains;
    }

    if (options.excludeDomains && options.excludeDomains.length > 0) {
      searchOptions.excludeDomains = options.excludeDomains;
    }

    if (options.startPublishedDate) {
      searchOptions.startPublishedDate = options.startPublishedDate;
    }

    if (options.endPublishedDate) {
      searchOptions.endPublishedDate = options.endPublishedDate;
    }

    const response = await exa.searchAndContents(query, searchOptions);

    const results = response.results.map((result) => {
      // Type assertion for text property from searchAndContents
      const textResult = result as typeof result & { text?: string };
      return {
        title: result.title || "Untitled",
        url: result.url,
        snippet: textResult.text?.substring(0, 300) || "",
        content: textResult.text || "",
        publishedDate: result.publishedDate,
        author: result.author,
      };
    });

    return {
      success: true,
      data: {
        results,
        query,
        totalResults: results.length,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        return {
          success: false,
          error: "Ungültiger Exa API-Key",
        };
      }
      if (error.message.includes("402") || error.message.includes("Payment")) {
        return {
          success: false,
          error: "Exa Credits aufgebraucht",
        };
      }
      return {
        success: false,
        error: `Exa Fehler: ${error.message}`,
      };
    }
    return {
      success: false,
      error: "Unbekannter Exa Fehler",
    };
  }
}

export async function scrapeWithExa(
  url: string,
  apiKey: string
): Promise<ExaScrapeResult> {
  if (!apiKey) {
    return {
      success: false,
      error: "Exa API-Key nicht konfiguriert",
    };
  }

  try {
    const exa = new Exa(apiKey);

    const response = await exa.getContents([url], {
      text: true,
    });

    if (!response.results || response.results.length === 0) {
      return {
        success: false,
        error: "Keine Inhalte gefunden",
      };
    }

    const result = response.results[0];
    const textResult = result as typeof result & { text?: string };

    return {
      success: true,
      data: {
        markdown: textResult.text || "",
        url: result.url,
        title: result.title || undefined,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: `Exa Fehler: ${error.message}`,
      };
    }
    return {
      success: false,
      error: "Unbekannter Exa Fehler",
    };
  }
}

export async function findSimilarWithExa(
  url: string,
  apiKey: string,
  options: { numResults?: number; includeDomains?: string[]; excludeDomains?: string[] } = {}
): Promise<ExaSearchResult> {
  if (!apiKey) {
    return {
      success: false,
      error: "Exa API-Key nicht konfiguriert",
    };
  }

  try {
    const exa = new Exa(apiKey);

    const searchOptions: Parameters<typeof exa.findSimilarAndContents>[1] = {
      numResults: options.numResults || 10,
      text: true,
    };

    if (options.includeDomains && options.includeDomains.length > 0) {
      searchOptions.includeDomains = options.includeDomains;
    }

    if (options.excludeDomains && options.excludeDomains.length > 0) {
      searchOptions.excludeDomains = options.excludeDomains;
    }

    const response = await exa.findSimilarAndContents(url, searchOptions);

    const results = response.results.map((result) => {
      const textResult = result as typeof result & { text?: string };
      return {
        title: result.title || "Untitled",
        url: result.url,
        snippet: textResult.text?.substring(0, 300) || "",
        content: textResult.text || "",
        publishedDate: result.publishedDate,
        author: result.author,
      };
    });

    return {
      success: true,
      data: {
        results,
        query: `Similar to: ${url}`,
        totalResults: results.length,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: `Exa Fehler: ${error.message}`,
      };
    }
    return {
      success: false,
      error: "Unbekannter Exa Fehler",
    };
  }
}
