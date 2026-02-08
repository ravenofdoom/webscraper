// ScrapingAnt API - Web scraping with proxy rotation
// Docs: https://docs.scrapingant.com

const SCRAPINGANT_API_URL = "https://api.scrapingant.com/v2/general";

export interface ScrapingAntResult {
  success: boolean;
  data?: {
    markdown: string;
    html?: string;
    url: string;
  };
  error?: string;
  creditsUsed?: number;
}

interface ScrapingAntOptions {
  jsRendering?: boolean;
  proxy?: "datacenter" | "residential";
  returnText?: boolean;
}

export async function scrapeWithScrapingAnt(
  url: string,
  apiKey: string,
  options: ScrapingAntOptions = {}
): Promise<ScrapingAntResult> {
  if (!apiKey) {
    return {
      success: false,
      error: "ScrapingAnt API-Key nicht konfiguriert",
    };
  }

  try {
    const params = new URLSearchParams({
      url: url,
    });

    // JS-Rendering kostet 10 Credits statt 1
    if (options.jsRendering) {
      params.append("browser", "true");
    }

    // Return plain text instead of HTML
    if (options.returnText) {
      params.append("return_text", "true");
    }

    const response = await fetch(`${SCRAPINGANT_API_URL}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "text/html,application/json",
        "x-api-key": apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: "Ungültiger ScrapingAnt API-Key",
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          error: "ScrapingAnt Credits aufgebraucht",
        };
      }
      if (response.status === 422) {
        return {
          success: false,
          error: "Ungültige URL oder Parameter",
        };
      }
      return {
        success: false,
        error: `ScrapingAnt Fehler: ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type");
    const creditsUsed = parseInt(response.headers.get("x-credits-used") || "1");

    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return {
        success: true,
        data: {
          markdown: htmlToMarkdown(data.content || ""),
          html: data.content,
          url: url,
        },
        creditsUsed,
      };
    } else {
      const html = await response.text();
      return {
        success: true,
        data: {
          markdown: htmlToMarkdown(html),
          html: html,
          url: url,
        },
        creditsUsed,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "ScrapingAnt Fehler",
    };
  }
}

// Simple HTML to Markdown conversion
function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let text = html;

  // Remove script and style tags
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

  // Convert headers
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n");
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\n##### $1\n");
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\n###### $1\n");

  // Convert links
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Convert images
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)");
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)");

  // Convert lists
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  text = text.replace(/<\/?[ou]l[^>]*>/gi, "\n");

  // Convert paragraphs and breaks
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Convert bold and italic
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

  // Convert code
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
}
