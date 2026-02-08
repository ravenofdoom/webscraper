"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
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
import type { TechDetectionResult } from "@/lib/tech-detector";

interface TechCheckResult {
  url: string;
  detection: TechDetectionResult;
  formatted: string;
  provider: string;
}

export default function TechCheckPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TechCheckResult | null>(null);
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
      const response = await fetch("/api/tech-detect", {
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return <Badge className="bg-green-600">Hoch ({confidence}%)</Badge>;
    } else if (confidence >= 50) {
      return <Badge className="bg-yellow-600">Mittel ({confidence}%)</Badge>;
    } else {
      return <Badge className="bg-red-600">Niedrig ({confidence}%)</Badge>;
    }
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
            <h1 className="text-xl font-bold text-white">🔧 Tech-Stack Erkennung</h1>
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
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Shop analysieren</CardTitle>
              <CardDescription className="text-slate-400">
                Erkennt automatisch Shop-System, PIM, CMS und verwendete Technologien
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Shop-URL</Label>
                <Input
                  placeholder="https://example-shop.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                />
              </div>

              <Button
                onClick={handleCheck}
                disabled={loading || !url}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? "Analysiere..." : "Tech-Stack prüfen"}
              </Button>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                <h4 className="text-white font-medium mb-2">Was wird erkannt?</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>🛒 <strong>Shop-Systeme:</strong> Shopify, Magento, WooCommerce, Shopware, etc.</li>
                  <li>📦 <strong>PIM-Systeme:</strong> Akeneo, Pimcore, Salsify</li>
                  <li>📝 <strong>CMS:</strong> WordPress, TYPO3, Drupal, Contentful</li>
                  <li>⚛️ <strong>Frontend:</strong> React, Vue, Angular, Next.js</li>
                  <li>📊 <strong>Analytics:</strong> Google Analytics, Matomo, Hotjar</li>
                  <li>💬 <strong>Marketing:</strong> HubSpot, Klaviyo, Zendesk</li>
                  <li>💳 <strong>Payment:</strong> PayPal, Stripe, Klarna</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Analyse-Ergebnis</CardTitle>
            </CardHeader>
            <CardContent>
              {!result && !loading && (
                <div className="text-center py-12 text-slate-400">
                  <span className="text-4xl">🔍</span>
                  <p className="mt-4">Gib eine URL ein und starte die Analyse</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12 text-slate-400">
                  <span className="text-4xl animate-spin inline-block">⚙️</span>
                  <p className="mt-4">Analysiere HTML und erkenne Technologien...</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Shop System */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      🛒 Shop-System
                    </h4>
                    {result.detection.shopSystem ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-green-400">
                            {result.detection.shopSystem.name}
                          </span>
                          {getConfidenceBadge(result.detection.shopSystem.confidence)}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                          Erkannt durch: {result.detection.shopSystem.evidence.join(", ")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400 mt-2">Nicht eindeutig erkannt</p>
                    )}
                  </div>

                  {/* PIM */}
                  {result.detection.pim && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium">📦 PIM-System</h4>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-400">
                          {result.detection.pim.name}
                        </span>
                        {getConfidenceBadge(result.detection.pim.confidence)}
                      </div>
                    </div>
                  )}

                  {/* CMS */}
                  {result.detection.cms && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium">📝 CMS</h4>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-bold text-purple-400">
                          {result.detection.cms.name}
                        </span>
                        {getConfidenceBadge(result.detection.cms.confidence)}
                      </div>
                    </div>
                  )}

                  {/* Frontend */}
                  {result.detection.frontend.length > 0 && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium">⚛️ Frontend-Technologien</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.detection.frontend.map((tech) => (
                          <Badge key={tech.name} variant="secondary" className="bg-slate-600">
                            {tech.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analytics */}
                  {result.detection.analytics.length > 0 && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium">📊 Analytics & Tracking</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.detection.analytics.map((tech) => (
                          <Badge key={tech.name} variant="secondary" className="bg-slate-600">
                            {tech.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marketing */}
                  {result.detection.marketing.length > 0 && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium">💬 Marketing & CRM</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.detection.marketing.map((tech) => (
                          <Badge key={tech.name} variant="secondary" className="bg-slate-600">
                            {tech.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  {result.detection.payment.length > 0 && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium">💳 Zahlungsanbieter</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.detection.payment.map((tech) => (
                          <Badge key={tech.name} variant="secondary" className="bg-slate-600">
                            {tech.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Provider Info */}
                  <p className="text-xs text-slate-500 text-center">
                    Daten geladen via {result.provider}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
