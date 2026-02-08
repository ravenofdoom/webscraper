import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { search, findSimilar, isProviderConfigured } from "@/lib/scrapers";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      query,
      type = "search", // "search" or "similar"
      url, // For similar search
      numResults = 10,
      includeDomains,
      excludeDomains,
    } = body;

    if (type === "similar") {
      if (!url) {
        return NextResponse.json(
          { error: "URL ist für die Ähnlichkeitssuche erforderlich" },
          { status: 400 }
        );
      }

      if (!isProviderConfigured("exa")) {
        return NextResponse.json(
          { error: "Exa API-Key nicht konfiguriert" },
          { status: 400 }
        );
      }

      const result = await findSimilar(url, {
        numResults,
        includeDomains,
        excludeDomains,
      });

      return NextResponse.json(result);
    }

    // Regular search
    if (!query) {
      return NextResponse.json(
        { error: "Suchanfrage ist erforderlich" },
        { status: 400 }
      );
    }

    if (!isProviderConfigured("exa")) {
      return NextResponse.json(
        { error: "Exa API-Key nicht konfiguriert. Suche benötigt Exa." },
        { status: 400 }
      );
    }

    const result = await search(query, {
      provider: "exa",
      numResults,
      includeDomains,
      excludeDomains,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Suche fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}
