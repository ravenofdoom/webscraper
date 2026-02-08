import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scrape, isProviderConfigured } from "@/lib/scrapers";
import { ProviderType } from "@/lib/providers";
import { getFirecrawlClient } from "@/lib/firecrawl";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, provider, enableFallback = true, jsRendering = false } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL ist erforderlich" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Ungültige URL" },
        { status: 400 }
      );
    }

    // Special handling for Firecrawl (uses its own client)
    if (provider === "firecrawl") {
      if (!isProviderConfigured("firecrawl")) {
        return NextResponse.json(
          { error: "Firecrawl API-Key nicht konfiguriert" },
          { status: 400 }
        );
      }

      const firecrawl = getFirecrawlClient();
      const result = await firecrawl.scrape(url, {
        formats: ["markdown"],
      });

      const data = result as { success?: boolean; markdown?: string; error?: string };

      if (!data.success) {
        return NextResponse.json({
          success: false,
          provider: "firecrawl",
          error: data.error || "Firecrawl scraping fehlgeschlagen",
        });
      }

      return NextResponse.json({
        success: true,
        provider: "firecrawl",
        data: {
          markdown: data.markdown || "",
          url: url,
        },
      });
    }

    // Use unified scraper for other providers
    const result = await scrape(url, {
      provider: provider as ProviderType,
      enableFallback,
      jsRendering,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Scraping fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check which providers are configured
export async function GET() {
  const providers: Record<string, boolean> = {
    firecrawl: isProviderConfigured("firecrawl"),
    exa: isProviderConfigured("exa"),
    jina: isProviderConfigured("jina"),
    scrapingant: isProviderConfigured("scrapingant"),
    native: true, // Always available
  };

  return NextResponse.json({ providers });
}
