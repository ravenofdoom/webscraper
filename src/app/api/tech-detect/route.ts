import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { detectTechStack, formatTechStackResult } from "@/lib/tech-detector";
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

    // Detect tech stack from HTML
    const techResult = detectTechStack(scrapeResult.data.html);
    const formattedResult = formatTechStackResult(techResult);

    return NextResponse.json({
      success: true,
      data: {
        url,
        detection: techResult,
        formatted: formattedResult,
        provider: scrapeResult.provider,
      },
    });
  } catch (error) {
    console.error("Tech detection error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Fehler bei Tech-Erkennung",
    }, { status: 500 });
  }
}
