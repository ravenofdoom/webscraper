// Jina Reader API - Free web-to-markdown conversion
// Docs: https://jina.ai/reader

const JINA_READER_URL = "https://r.jina.ai";

export interface JinaScrapeResult {
  success: boolean;
  data?: {
    markdown: string;
    title?: string;
    url: string;
  };
  error?: string;
}

export async function scrapeWithJina(
  url: string,
  apiKey?: string
): Promise<JinaScrapeResult> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Optional API key for higher rate limits (200/min vs 20/min)
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${JINA_READER_URL}/${url}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          error: "Rate limit erreicht. Bitte warte einen Moment und versuche es erneut.",
        };
      }
      return {
        success: false,
        error: `Jina Reader Fehler: ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return {
        success: true,
        data: {
          markdown: data.content || data.text || "",
          title: data.title,
          url: data.url || url,
        },
      };
    } else {
      // Plain text/markdown response
      const text = await response.text();
      return {
        success: true,
        data: {
          markdown: text,
          url: url,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Jina Reader Fehler",
    };
  }
}
