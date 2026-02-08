import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeSEO, formatSEOResult } from "@/lib/seo-analyzer";
import { scrape } from "@/lib/scrapers";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Nicht autorisiert" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: "URL erforderlich" }, { status: 400 });
    }

    // Scrape the URL to get HTML
    const scrapeResult = await scrape(url, {
      enableFallback: true,
    });

    if (!scrapeResult.success || !scrapeResult.data?.html) {
      return NextResponse.json({
        success: false,
        error: scrapeResult.error || "Konnte HTML nicht laden",
      });
    }

    // Analyze SEO from HTML
    const seoResult = analyzeSEO(scrapeResult.data.html, url);
    const formattedResult = formatSEOResult(seoResult);

    return NextResponse.json({
      success: true,
      data: {
        url,
        analysis: seoResult,
        formatted: formattedResult,
        provider: scrapeResult.provider,
      },
    });
  } catch (error) {
    console.error("SEO analysis error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Fehler bei SEO-Analyse",
    }, { status: 500 });
  }
}
