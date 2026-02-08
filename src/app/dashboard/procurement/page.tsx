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
import type { ProcurementResult } from "@/lib/procurement-detector";

interface CheckResult {
  url: string;
  detection: ProcurementResult;
  formatted: string;
  provider: string;
}

export default function ProcurementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
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
      const response = await fetch("/api/procurement-check", {
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
      return <Badge className="bg-green-600 text-lg px-3 py-1">{score}/100 - Exzellent</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-blue-600 text-lg px-3 py-1">{score}/100 - Gut</Badge>;
    } else if (score >= 40) {
      return <Badge className="bg-yellow-600 text-lg px-3 py-1">{score}/100 - Basis</Badge>;
    } else if (score >= 20) {
      return <Badge className="bg-orange-600 text-lg px-3 py-1">{score}/100 - Gering</Badge>;
    } else {
      return <Badge className="bg-red-600 text-lg px-3 py-1">{score}/100 - Keine B2B-Features</Badge>;
    }
  };

  const FeatureCheck = ({ detected, label }: { detected: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      <span className={detected ? "text-green-400" : "text-slate-500"}>
        {detected ? "✅" : "❌"}
      </span>
      <span className={detected ? "text-white" : "text-slate-500"}>{label}</span>
    </div>
  );

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
            <h1 className="text-xl font-bold text-white">🔗 E-Procurement Checker</h1>
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
              <CardTitle className="text-white">B2B-Fähigkeiten prüfen</CardTitle>
              <CardDescription className="text-slate-400">
                Analysiert Punchout, Katalogformate, ERP-Integration und B2B-Features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Shop-URL</Label>
                <Input
                  placeholder="https://b2b-shop.example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                />
              </div>

              <Button
                onClick={handleCheck}
                disabled={loading || !url}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {loading ? "Analysiere..." : "E-Procurement Check"}
              </Button>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                <h4 className="text-white font-medium mb-2">Was wird geprüft?</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>🏢 <strong>B2B-Portal:</strong> Geschäftskunden-Bereich, Nettopreise</li>
                  <li>🔗 <strong>Punchout:</strong> OCI, cXML, SAP Ariba, Coupa</li>
                  <li>📦 <strong>Katalogformate:</strong> BMEcat, DATANORM, ETIM</li>
                  <li>🔌 <strong>ERP-Integration:</strong> SAP, Microsoft Dynamics, API</li>
                  <li>⚙️ <strong>B2B-Features:</strong> Schnellbestellung, Kostenstellen, etc.</li>
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
                  <p className="mt-4">Prüfe E-Procurement Fähigkeiten...</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Score */}
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm mb-2">B2B Readiness Score</p>
                    {getScoreBadge(result.detection.score)}
                    <p className="text-slate-300 text-sm mt-3 max-w-md mx-auto">
                      {result.detection.recommendation}
                    </p>
                  </div>

                  {/* B2B Portal */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                      🏢 B2B-Portal
                    </h4>
                    <FeatureCheck
                      detected={result.detection.b2bPortal.detected}
                      label={result.detection.b2bPortal.detected
                        ? `Erkannt (${result.detection.b2bPortal.confidence}%)`
                        : "Nicht erkannt"}
                    />
                    {result.detection.b2bPortal.evidence.length > 0 && (
                      <p className="text-slate-400 text-xs mt-1 ml-6">
                        {result.detection.b2bPortal.evidence.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Punchout */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                      🔗 Punchout-Schnittstellen
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FeatureCheck detected={result.detection.punchout.ociSupport.detected} label="OCI" />
                      <FeatureCheck detected={result.detection.punchout.cxmlSupport.detected} label="cXML" />
                      <FeatureCheck detected={result.detection.punchout.aribaSupport.detected} label="SAP Ariba" />
                      <FeatureCheck detected={result.detection.punchout.coupaSupport.detected} label="Coupa" />
                    </div>
                  </div>

                  {/* Catalog */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                      📦 Katalogformate
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FeatureCheck detected={result.detection.catalog.bmecatSupport.detected} label="BMEcat" />
                      <FeatureCheck detected={result.detection.catalog.datanormSupport.detected} label="DATANORM" />
                      <FeatureCheck detected={result.detection.catalog.etimSupport.detected} label="ETIM" />
                      <FeatureCheck detected={result.detection.catalog.csvExport.detected} label="CSV-Export" />
                    </div>
                  </div>

                  {/* ERP */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                      🔌 ERP-Integration
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <FeatureCheck detected={result.detection.erpIntegration.sapSupport.detected} label="SAP" />
                      <FeatureCheck detected={result.detection.erpIntegration.microsoftDynamics.detected} label="Dynamics" />
                      <FeatureCheck detected={result.detection.erpIntegration.oracleSupport.detected} label="Oracle" />
                      <FeatureCheck detected={result.detection.erpIntegration.apiAvailable.detected} label="API" />
                    </div>
                  </div>

                  {/* B2B Features */}
                  {result.detection.b2bFeatures.length > 0 && (
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                        ⚙️ B2B-Features
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.detection.b2bFeatures.map((feature) => (
                          <Badge key={feature.name} className="bg-green-900/50 text-green-300">
                            {feature.name}
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
