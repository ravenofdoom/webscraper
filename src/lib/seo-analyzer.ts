// SEO Analyzer - Quick SEO Check from HTML

export interface SEOAnalysisResult {
  score: number; // 0-100
  title: TitleAnalysis;
  metaDescription: MetaDescriptionAnalysis;
  headings: HeadingsAnalysis;
  images: ImagesAnalysis;
  links: LinksAnalysis;
  technical: TechnicalSEO;
  content: ContentAnalysis;
  issues: SEOIssue[];
  recommendations: string[];
}

export interface TitleAnalysis {
  exists: boolean;
  content: string;
  length: number;
  optimal: boolean; // 50-60 chars
  hasKeywords: boolean;
}

export interface MetaDescriptionAnalysis {
  exists: boolean;
  content: string;
  length: number;
  optimal: boolean; // 150-160 chars
}

export interface HeadingsAnalysis {
  h1Count: number;
  h1Content: string[];
  h2Count: number;
  h3Count: number;
  hasProperHierarchy: boolean;
  headingStructure: string[];
}

export interface ImagesAnalysis {
  total: number;
  withAlt: number;
  withoutAlt: number;
  missingAltUrls: string[];
  lazyLoaded: number;
}

export interface LinksAnalysis {
  internal: number;
  external: number;
  nofollow: number;
  brokenSuspects: string[]; // Links that might be broken (empty href, javascript:void)
}

export interface TechnicalSEO {
  hasCanonical: boolean;
  canonicalUrl: string;
  hasRobotsMeta: boolean;
  robotsContent: string;
  hasViewport: boolean;
  hasCharset: boolean;
  hasOpenGraph: boolean;
  hasTwitterCards: boolean;
  hasStructuredData: boolean;
  structuredDataTypes: string[];
  hasFavicon: boolean;
  hasHreflang: boolean;
}

export interface ContentAnalysis {
  wordCount: number;
  paragraphCount: number;
  hasVideo: boolean;
  readabilityScore: "good" | "average" | "poor";
}

export interface SEOIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
}

export function analyzeSEO(html: string, url?: string): SEOAnalysisResult {
  const issues: SEOIssue[] = [];
  const recommendations: string[] = [];

  // Title Analysis
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleContent = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";
  const title: TitleAnalysis = {
    exists: !!titleMatch,
    content: titleContent,
    length: titleContent.length,
    optimal: titleContent.length >= 50 && titleContent.length <= 60,
    hasKeywords: titleContent.length > 10, // Simplified check
  };

  if (!title.exists) {
    issues.push({ severity: "critical", category: "Title", message: "Kein Title-Tag gefunden" });
  } else if (title.length < 30) {
    issues.push({ severity: "warning", category: "Title", message: `Title zu kurz (${title.length} Zeichen)` });
  } else if (title.length > 70) {
    issues.push({ severity: "warning", category: "Title", message: `Title zu lang (${title.length} Zeichen)` });
  }

  // Meta Description Analysis
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDescContent = metaDescMatch ? decodeHtmlEntities(metaDescMatch[1].trim()) : "";
  const metaDescription: MetaDescriptionAnalysis = {
    exists: !!metaDescMatch,
    content: metaDescContent,
    length: metaDescContent.length,
    optimal: metaDescContent.length >= 150 && metaDescContent.length <= 160,
  };

  if (!metaDescription.exists) {
    issues.push({ severity: "critical", category: "Meta", message: "Keine Meta-Description gefunden" });
  } else if (metaDescription.length < 120) {
    issues.push({ severity: "warning", category: "Meta", message: `Meta-Description zu kurz (${metaDescription.length} Zeichen)` });
  } else if (metaDescription.length > 170) {
    issues.push({ severity: "warning", category: "Meta", message: `Meta-Description zu lang (${metaDescription.length} Zeichen)` });
  }

  // Headings Analysis
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Contents = h1Matches.map((h) => stripHtml(h).trim());
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;

  const headings: HeadingsAnalysis = {
    h1Count: h1Matches.length,
    h1Content: h1Contents,
    h2Count,
    h3Count,
    hasProperHierarchy: h1Matches.length === 1 && h2Count > 0,
    headingStructure: extractHeadingStructure(html),
  };

  if (headings.h1Count === 0) {
    issues.push({ severity: "critical", category: "Headings", message: "Keine H1-Überschrift gefunden" });
  } else if (headings.h1Count > 1) {
    issues.push({ severity: "warning", category: "Headings", message: `Mehrere H1-Überschriften (${headings.h1Count})` });
  }

  if (h2Count === 0) {
    issues.push({ severity: "info", category: "Headings", message: "Keine H2-Überschriften für Struktur" });
  }

  // Images Analysis
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const imagesWithAlt = imgMatches.filter((img) => /alt=["'][^"']+["']/i.test(img));
  const imagesWithoutAlt = imgMatches.filter((img) => !/alt=["'][^"']+["']/i.test(img));
  const missingAltUrls = imagesWithoutAlt
    .map((img) => {
      const srcMatch = img.match(/src=["']([^"']*)["']/i);
      return srcMatch ? srcMatch[1] : "";
    })
    .filter((src) => src)
    .slice(0, 5);

  const lazyLoadedCount = imgMatches.filter(
    (img) => /loading=["']lazy["']/i.test(img) || /data-src/i.test(img)
  ).length;

  const images: ImagesAnalysis = {
    total: imgMatches.length,
    withAlt: imagesWithAlt.length,
    withoutAlt: imagesWithoutAlt.length,
    missingAltUrls,
    lazyLoaded: lazyLoadedCount,
  };

  if (images.withoutAlt > 0) {
    issues.push({
      severity: "warning",
      category: "Images",
      message: `${images.withoutAlt} Bilder ohne Alt-Text`,
    });
  }

  // Links Analysis
  const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  const internalLinks = linkMatches.filter((link) => {
    const href = link.match(/href=["']([^"']*)["']/i)?.[1] || "";
    return href.startsWith("/") || href.startsWith("#") || (url && href.includes(new URL(url).hostname));
  });
  const externalLinks = linkMatches.filter((link) => {
    const href = link.match(/href=["']([^"']*)["']/i)?.[1] || "";
    return href.startsWith("http") && (!url || !href.includes(new URL(url).hostname));
  });
  const nofollowLinks = linkMatches.filter((link) => /rel=["'][^"']*nofollow[^"']*["']/i.test(link));
  const brokenSuspects = linkMatches
    .filter((link) => {
      const href = link.match(/href=["']([^"']*)["']/i)?.[1] || "";
      return href === "" || href === "#" || href.startsWith("javascript:");
    })
    .slice(0, 5)
    .map((link) => link.match(/href=["']([^"']*)["']/i)?.[1] || "empty");

  const links: LinksAnalysis = {
    internal: internalLinks.length,
    external: externalLinks.length,
    nofollow: nofollowLinks.length,
    brokenSuspects,
  };

  // Technical SEO
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);
  const charsetMatch = html.match(/<meta[^>]*charset=/i);
  const ogMatch = html.match(/<meta[^>]*property=["']og:/i);
  const twitterMatch = html.match(/<meta[^>]*name=["']twitter:/i);
  const structuredDataMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const structuredTypes = structuredDataMatches
    .map((script) => {
      const typeMatch = script.match(/"@type"\s*:\s*"([^"]+)"/);
      return typeMatch ? typeMatch[1] : null;
    })
    .filter(Boolean) as string[];
  const faviconMatch = html.match(/<link[^>]*rel=["'](icon|shortcut icon)["']/i);
  const hreflangMatch = html.match(/<link[^>]*hreflang=/i);

  const technical: TechnicalSEO = {
    hasCanonical: !!canonicalMatch,
    canonicalUrl: canonicalMatch?.[1] || "",
    hasRobotsMeta: !!robotsMatch,
    robotsContent: robotsMatch?.[1] || "",
    hasViewport: !!viewportMatch,
    hasCharset: !!charsetMatch,
    hasOpenGraph: !!ogMatch,
    hasTwitterCards: !!twitterMatch,
    hasStructuredData: structuredDataMatches.length > 0,
    structuredDataTypes: structuredTypes,
    hasFavicon: !!faviconMatch,
    hasHreflang: !!hreflangMatch,
  };

  if (!technical.hasCanonical) {
    issues.push({ severity: "warning", category: "Technical", message: "Kein Canonical-Tag gefunden" });
  }
  if (!technical.hasViewport) {
    issues.push({ severity: "critical", category: "Technical", message: "Kein Viewport-Meta-Tag (Mobile!)" });
  }
  if (!technical.hasOpenGraph) {
    issues.push({ severity: "info", category: "Social", message: "Keine Open Graph Tags für Social Sharing" });
  }
  if (!technical.hasStructuredData) {
    issues.push({ severity: "info", category: "Technical", message: "Keine strukturierten Daten (Schema.org)" });
  }

  // Content Analysis
  const textContent = stripHtml(html);
  const words = textContent.split(/\s+/).filter((w) => w.length > 2);
  const paragraphs = (html.match(/<p[^>]*>/gi) || []).length;
  const hasVideo = /<video|youtube|vimeo/i.test(html);

  const content: ContentAnalysis = {
    wordCount: words.length,
    paragraphCount: paragraphs,
    hasVideo,
    readabilityScore: words.length > 300 ? "good" : words.length > 100 ? "average" : "poor",
  };

  if (content.wordCount < 300) {
    issues.push({ severity: "warning", category: "Content", message: `Wenig Text-Inhalt (${content.wordCount} Wörter)` });
  }

  // Calculate Score
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "critical") score -= 15;
    else if (issue.severity === "warning") score -= 5;
    else score -= 2;
  }
  score = Math.max(0, Math.min(100, score));

  // Generate Recommendations
  if (!title.exists || title.length < 30) {
    recommendations.push("Füge einen aussagekräftigen Title-Tag mit 50-60 Zeichen hinzu");
  }
  if (!metaDescription.exists || metaDescription.length < 120) {
    recommendations.push("Erstelle eine Meta-Description mit 150-160 Zeichen");
  }
  if (headings.h1Count !== 1) {
    recommendations.push("Verwende genau eine H1-Überschrift pro Seite");
  }
  if (images.withoutAlt > 0) {
    recommendations.push(`Füge Alt-Texte zu ${images.withoutAlt} Bildern hinzu`);
  }
  if (!technical.hasStructuredData) {
    recommendations.push("Implementiere strukturierte Daten (Schema.org) für Rich Snippets");
  }
  if (!technical.hasOpenGraph) {
    recommendations.push("Füge Open Graph Tags für besseres Social Media Sharing hinzu");
  }

  return {
    score,
    title,
    metaDescription,
    headings,
    images,
    links,
    technical,
    content,
    issues,
    recommendations,
  };
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadingStructure(html: string): string[] {
  const headings: string[] = [];
  const matches = html.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi);
  for (const match of matches) {
    const level = match[1].toUpperCase();
    const text = stripHtml(match[2]).substring(0, 50);
    headings.push(`${level}: ${text}${text.length >= 50 ? "..." : ""}`);
  }
  return headings.slice(0, 15);
}

// Format result as readable text
export function formatSEOResult(result: SEOAnalysisResult): string {
  const lines: string[] = [];

  lines.push("## SEO Quick-Check\n");
  lines.push(`**Score: ${result.score}/100**\n`);

  lines.push("### Title");
  if (result.title.exists) {
    lines.push(`✅ "${result.title.content}"`);
    lines.push(`   Länge: ${result.title.length} Zeichen ${result.title.optimal ? "(optimal)" : ""}\n`);
  } else {
    lines.push("❌ Nicht vorhanden\n");
  }

  lines.push("### Meta-Description");
  if (result.metaDescription.exists) {
    lines.push(`✅ "${result.metaDescription.content.substring(0, 100)}..."`);
    lines.push(`   Länge: ${result.metaDescription.length} Zeichen ${result.metaDescription.optimal ? "(optimal)" : ""}\n`);
  } else {
    lines.push("❌ Nicht vorhanden\n");
  }

  lines.push("### Überschriften-Struktur");
  lines.push(`- H1: ${result.headings.h1Count} (${result.headings.h1Count === 1 ? "✅" : "⚠️"})`);
  lines.push(`- H2: ${result.headings.h2Count}`);
  lines.push(`- H3: ${result.headings.h3Count}\n`);

  lines.push("### Bilder");
  lines.push(`- Gesamt: ${result.images.total}`);
  lines.push(`- Mit Alt-Text: ${result.images.withAlt} ✅`);
  lines.push(`- Ohne Alt-Text: ${result.images.withoutAlt} ${result.images.withoutAlt > 0 ? "⚠️" : ""}\n`);

  lines.push("### Technisches SEO");
  lines.push(`- Canonical: ${result.technical.hasCanonical ? "✅" : "❌"}`);
  lines.push(`- Viewport: ${result.technical.hasViewport ? "✅" : "❌"}`);
  lines.push(`- Open Graph: ${result.technical.hasOpenGraph ? "✅" : "❌"}`);
  lines.push(`- Schema.org: ${result.technical.hasStructuredData ? "✅" : "❌"}\n`);

  if (result.recommendations.length > 0) {
    lines.push("### Empfehlungen");
    for (const rec of result.recommendations) {
      lines.push(`- ${rec}`);
    }
  }

  return lines.join("\n");
}
