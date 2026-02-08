"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SEOAnalysisResult } from "@/lib/seo-analyzer";

interface SEOCheckResult {
  url: string;
  analysis: SEOAnalysisResult;
  formatted: string;
  provider: string;
}

export default function SEOPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SEOCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleCheck = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/seo-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Fehler bei der Analyse");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-600 text-2xl px-4 py-2">{score}</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-600 text-2xl px-4 py-2">{score}</Badge>;
    } else if (score >= 40) {
      return <Badge className="bg-orange-600 text-2xl px-4 py-2">{score}</Badge>;
    } else {
      return <Badge className="bg-red-600 text-2xl px-4 py-2">{score}</Badge>;
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Sehr gut";
    if (score >= 60) return "Gut";
    if (score >= 40) return "Verbesserungsbedarf";
    return "Kritisch";
  };

  const StatusIcon = ({ ok }: { ok: boolean }) => (
    <span className={ok ? "text-green-400" : "text-red-400"}>
      {ok ? "✅" : "❌"}
    </span>
  );

  const LengthBar = ({ length, min, max, optimal }: { length: number; min: number; max: number; optimal: boolean }) => {
    const percentage = Math.min(100, (length / max) * 100);
    const color = optimal ? "bg-green-500" : length < min ? "bg-red-500" : "bg-yellow-500";
    return (
      <div className="w-full bg-slate-600 rounded-full h-2 mt-1">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white"
              onClick={() => router.push("/dashboard")}
            >
              ← Zurück
            </Button>
            <h1 className="text-xl font-bold text-white">📊 SEO Quick-Check</h1>
          </div>
        </div>
      </header>

      {/* Loading Bar */}
      {loading && (
        <div className="fixed top-[65px] left-0 right-0 z-20">
          <Progress value={100} className="h-1 rounded-none animate-pulse" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">SEO analysieren</CardTitle>
              <CardDescription className="text-slate-400">
                Prüft Meta-Tags, Überschriften, Bilder und technisches SEO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">URL</Label>
                <Input
                  placeholder="https://example.com/page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                />
              </div>

              <Button
                onClick={handleCheck}
                disabled={loading || !url}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? "Analysiere..." : "SEO prüfen"}
              </Button>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Cards */}
          <div className="lg:col-span-2 space-y-6">
            {!result && !loading && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12">
                  <div className="text-center text-slate-400">
                    <span className="text-4xl">📊</span>
                    <p className="mt-4">Gib eine URL ein und starte die SEO-Analyse</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12">
                  <div className="text-center text-slate-400">
                    <span className="text-4xl animate-pulse">🔍</span>
                    <p className="mt-4">Analysiere SEO-Faktoren...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                {/* Score Card */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-slate-400 text-sm mb-1">SEO Score</h3>
                        <p className="text-2xl font-bold text-white">
                          {getScoreLabel(result.analysis.score)}
                        </p>
                      </div>
                      {getScoreBadge(result.analysis.score)}
                    </div>
                    <div className="mt-4">
                      <Progress value={result.analysis.score} className="h-3" />
                    </div>
                  </CardContent>
                </Card>

                {/* Title & Meta */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Title & Meta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon ok={result.analysis.title.exists && result.analysis.title.length >= 30} />
                        <span className="text-white font-medium">Title-Tag</span>
                        <span className="text-slate-400 text-sm">({result.analysis.title.length}/60 Zeichen)</span>
                      </div>
                      {result.analysis.title.exists ? (
                        <>
                          <p className="text-slate-300 text-sm mt-1">"{result.analysis.title.content}"</p>
                          <LengthBar length={result.analysis.title.length} min={30} max={70} optimal={result.analysis.title.optimal} />
                        </>
                      ) : (
                        <p className="text-red-400 text-sm">Nicht vorhanden!</p>
                      )}
                    </div>

                    {/* Meta Description */}
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon ok={result.analysis.metaDescription.exists && result.analysis.metaDescription.length >= 120} />
                        <span className="text-white font-medium">Meta-Description</span>
                        <span className="text-slate-400 text-sm">({result.analysis.metaDescription.length}/160 Zeichen)</span>
                      </div>
                      {result.analysis.metaDescription.exists ? (
                        <>
                          <p className="text-slate-300 text-sm mt-1 line-clamp-2">
                            "{result.analysis.metaDescription.content}"
                          </p>
                          <LengthBar length={result.analysis.metaDescription.length} min={120} max={170} optimal={result.analysis.metaDescription.optimal} />
                        </>
                      ) : (
                        <p className="text-red-400 text-sm">Nicht vorhanden!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Headings */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Überschriften</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <StatusIcon ok={result.analysis.headings.h1Count === 1} />
                          <span className="text-2xl font-bold text-white">{result.analysis.headings.h1Count}</span>
                        </div>
                        <p className="text-slate-400 text-sm">H1</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <span className="text-2xl font-bold text-white">{result.analysis.headings.h2Count}</span>
                        <p className="text-slate-400 text-sm">H2</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <span className="text-2xl font-bold text-white">{result.analysis.headings.h3Count}</span>
                        <p className="text-slate-400 text-sm">H3</p>
                      </div>
                    </div>
                    {result.analysis.headings.h1Content.length > 0 && (
                      <div className="bg-slate-700/30 rounded p-2">
                        <p className="text-slate-400 text-xs mb-1">H1-Inhalt:</p>
                        <p className="text-white text-sm">{result.analysis.headings.h1Content[0]}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Images & Links */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Images */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-lg">Bilder</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Gesamt:</span>
                          <span className="text-white">{result.analysis.images.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Mit Alt-Text:</span>
                          <span className="text-green-400">{result.analysis.images.withAlt}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Ohne Alt-Text:</span>
                          <span className={result.analysis.images.withoutAlt > 0 ? "text-red-400" : "text-white"}>
                            {result.analysis.images.withoutAlt}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Lazy Loading:</span>
                          <span className="text-white">{result.analysis.images.lazyLoaded}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Links */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-lg">Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Intern:</span>
                          <span className="text-white">{result.analysis.links.internal}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Extern:</span>
                          <span className="text-white">{result.analysis.links.external}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Nofollow:</span>
                          <span className="text-white">{result.analysis.links.nofollow}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Technical SEO */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Technisches SEO</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={result.analysis.technical.hasCanonical} />
                        <span className="text-slate-300 text-sm">Canonical</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={result.analysis.technical.hasViewport} />
                        <span className="text-slate-300 text-sm">Viewport</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={result.analysis.technical.hasOpenGraph} />
                        <span className="text-slate-300 text-sm">Open Graph</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={result.analysis.technical.hasTwitterCards} />
                        <span className="text-slate-300 text-sm">Twitter Cards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={result.analysis.technical.hasStructuredData} />
                        <span className="text-slate-300 text-sm">Schema.org</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={result.analysis.technical.hasFavicon} />
                        <span className="text-slate-300 text-sm">Favicon</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={result.analysis.technical.hasCharset} />
                        <span className="text-slate-300 text-sm">Charset</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon ok={result.analysis.technical.hasHreflang} />
                        <span className="text-slate-300 text-sm">Hreflang</span>
                      </div>
                    </div>
                    {result.analysis.technical.structuredDataTypes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <p className="text-slate-400 text-xs mb-2">Schema.org Types:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.analysis.technical.structuredDataTypes.map((type, i) => (
                            <Badge key={i} variant="secondary" className="bg-slate-600 text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {result.analysis.recommendations.length > 0 && (
                  <Card className="bg-yellow-900/20 border-yellow-700/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-yellow-300 text-lg">💡 Empfehlungen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.analysis.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                            <span className="text-yellow-400">→</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Provider Info */}
                <p className="text-xs text-slate-500 text-center">
                  Daten geladen via {result.provider}
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
