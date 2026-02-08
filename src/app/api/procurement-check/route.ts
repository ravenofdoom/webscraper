import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { detectProcurement, formatProcurementResult } from "@/lib/procurement-detector";
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

    // Detect procurement features from HTML
    const procurementResult = detectProcurement(scrapeResult.data.html);
    const formattedResult = formatProcurementResult(procurementResult);

    return NextResponse.json({
      success: true,
      data: {
        url,
        detection: procurementResult,
        formatted: formattedResult,
        provider: scrapeResult.provider,
      },
    });
  } catch (error) {
    console.error("Procurement detection error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Fehler bei E-Procurement Check",
    }, { status: 500 });
  }
}
