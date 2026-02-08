// Native Fetch - Direct HTTP scraping without external APIs
// Free, unlimited, but limited to simple/static pages

export interface NativeScrapeResult {
  success: boolean;
  data?: {
    markdown: string;
    html?: string;
    url: string;
    title?: string;
  };
  error?: string;
}

export async function scrapeWithNative(url: string): Promise<NativeScrapeResult> {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        success: false,
        error: "Nur HTTP und HTTPS URLs werden unterstützt",
      };
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      if (response.status === 403) {
        return {
          success: false,
          error: "Zugriff verweigert (403). Diese Seite blockiert automatische Anfragen. Versuche einen anderen Provider.",
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          error: "Seite nicht gefunden (404)",
        };
      }
      return {
        success: false,
        error: `HTTP Fehler: ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return {
        success: false,
        error: `Nicht unterstützter Content-Type: ${contentType}. Native Fetch unterstützt nur HTML/Text.`,
      };
    }

    const html = await response.text();
    const title = extractTitle(html);
    const markdown = htmlToMarkdown(html);

    return {
      success: true,
      data: {
        markdown,
        html,
        url: response.url, // Final URL after redirects
        title,
      },
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        success: false,
        error: "Netzwerkfehler. Die URL ist möglicherweise nicht erreichbar.",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unbekannter Fehler beim Scraping",
    };
  }
}

function extractTitle(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1]
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }
  return undefined;
}

// Convert HTML to Markdown
function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let text = html;

  // Try to extract main content
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                    text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                    text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (mainMatch) {
    text = mainMatch[1];
  } else {
    // Remove common non-content elements
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
    text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
    text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
    text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
    text = text.replace(/<!--[\s\S]*?-->/g, "");
  }

  // Convert headers
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");
  text = text.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n##### $1\n");
  text = text.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "\n###### $1\n");

  // Convert links - preserve href
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  // Convert images
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)");
  text = text.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, "![$1]($2)");
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)");

  // Convert lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  text = text.replace(/<\/?[ou]l[^>]*>/gi, "\n");

  // Convert paragraphs and breaks
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");
  text = text.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, "\n$1\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<hr\s*\/?>/gi, "\n---\n");

  // Convert text formatting
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");

  // Convert code
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n");

  // Convert blockquotes
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n> $1\n");

  // Convert tables (basic)
  text = text.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, content) => {
    const rows = content.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    return "\n" + rows.map((row: string) => {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
      return "| " + cells.map((cell: string) => {
        return cell.replace(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/i, "$1").trim();
      }).join(" | ") + " |";
    }).join("\n") + "\n";
  });

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&euro;/g, "€");
  text = text.replace(/&copy;/g, "©");
  text = text.replace(/&reg;/g, "®");
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.split("\n").map(line => line.trim()).join("\n");
  text = text.trim();

  return text;
}
