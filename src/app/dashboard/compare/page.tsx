"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import * as XLSX from "xlsx";
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

// Comparison criteria
const COMPARISON_CRITERIA = [
  { id: "overview", name: "Allgemein", icon: "🏢", enabled: true },
  { id: "pricing", name: "Preisstruktur", icon: "💰", enabled: true },
  { id: "products", name: "Sortiment", icon: "📦", enabled: true },
  { id: "delivery", name: "Lieferung", icon: "🚚", enabled: true },
  { id: "payment", name: "Zahlung", icon: "💳", enabled: true },
  { id: "tech", name: "Technologie", icon: "🔧", enabled: false },
  { id: "seo", name: "SEO", icon: "📊", enabled: false },
  { id: "b2b", name: "B2B-Features", icon: "🏭", enabled: false },
];

interface ShopAnalysis {
  url: string;
  status: "pending" | "analyzing" | "done" | "error";
  results: Record<string, string>;
  error?: string;
}

// Prompts for each criteria
const CRITERIA_PROMPTS: Record<string, string> = {
  overview: `Analysiere diesen Online-Shop kurz und knapp:
- Shop-Name
- Branche/Spezialisierung
- Zielgruppe (B2B/B2C)
- USP (Unique Selling Point)
Antworte in 2-3 kurzen Sätzen pro Punkt.`,

  pricing: `Analysiere die Preisstruktur:
- Preisniveau (Budget/Mittel/Premium)
- Rabattaktionen vorhanden?
- Staffelpreise/Mengenrabatte?
- Versandkostenfrei ab welchem Betrag?
Kurze, prägnante Antworten.`,

  products: `Analysiere das Sortiment:
- Hauptkategorien (Top 5)
- Geschätzte Produktanzahl
- Markenvielfalt
- Besondere Produkte/Eigenmarken?
Kurz und übersichtlich.`,

  delivery: `Analysiere Lieferung & Service:
- Lieferzeit (Standard)
- Express verfügbar?
- Versandkosten
- Rückgabefrist
Kurze Fakten.`,

  payment: `Analysiere Zahlungsarten:
- Welche Zahlungsarten?
- Kauf auf Rechnung?
- Ratenzahlung?
- Checkout-Besonderheiten?
Stichpunktartig.`,

  tech: `Identifiziere die Technologie:
- Shop-System (Shopify/Magento/WooCommerce/etc.)
- Erkennbare Integrationen
- Mobile-Optimierung
Technische Fakten kurz.`,

  seo: `Quick SEO-Check:
- Title & Meta vorhanden?
- H1-Struktur?
- URL-Struktur?
- Ladezeit-Eindruck?
Kurze Bewertung.`,

  b2b: `B2B-Funktionen prüfen:
- B2B-Portal vorhanden?
- Nettopreise?
- Schnellbestellung?
- Punchout/OCI?
Ja/Nein mit Details.`,
};

export default function ComparePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [shopUrls, setShopUrls] = useState<string[]>(["", "", ""]);
  const [criteria, setCriteria] = useState<Record<string, boolean>>(
    Object.fromEntries(COMPARISON_CRITERIA.map((c) => [c.id, c.enabled]))
  );
  const [analyses, setAnalyses] = useState<ShopAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

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

  const activeShops = shopUrls.filter((url) => url.trim());
  const activeCriteria = Object.entries(criteria)
    .filter(([, enabled]) => enabled)
    .map(([id]) => id);

  const addShopField = () => {
    if (shopUrls.length < 5) {
      setShopUrls([...shopUrls, ""]);
    }
  };

  const removeShopField = (index: number) => {
    if (shopUrls.length > 2) {
      setShopUrls(shopUrls.filter((_, i) => i !== index));
    }
  };

  const updateShopUrl = (index: number, value: string) => {
    const newUrls = [...shopUrls];
    newUrls[index] = value;
    setShopUrls(newUrls);
  };

  const analyzeShops = async () => {
    if (activeShops.length < 2) return;

    setIsAnalyzing(true);
    setProgress(0);

    // Initialize analyses
    const initialAnalyses: ShopAnalysis[] = activeShops.map((url) => ({
      url,
      status: "pending",
      results: {},
    }));
    setAnalyses(initialAnalyses);

    const totalSteps = activeShops.length * activeCriteria.length;
    let completedSteps = 0;

    // Analyze each shop
    for (let shopIndex = 0; shopIndex < activeShops.length; shopIndex++) {
      const shopUrl = activeShops[shopIndex];

      // Update status to analyzing
      setAnalyses((prev) =>
        prev.map((a, i) => (i === shopIndex ? { ...a, status: "analyzing" } : a))
      );

      // Analyze each criteria
      for (const criteriaId of activeCriteria) {
        const criteriaName = COMPARISON_CRITERIA.find((c) => c.id === criteriaId)?.name || criteriaId;
        setCurrentStep(`${shopUrl} - ${criteriaName}`);

        try {
          const response = await fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: CRITERIA_PROMPTS[criteriaId],
              urls: [shopUrl],
            }),
          });

          const data = await response.json();

          if (data.success && data.data?.output) {
            setAnalyses((prev) =>
              prev.map((a, i) =>
                i === shopIndex
                  ? { ...a, results: { ...a.results, [criteriaId]: data.data.output } }
                  : a
              )
            );
          } else {
            setAnalyses((prev) =>
              prev.map((a, i) =>
                i === shopIndex
                  ? { ...a, results: { ...a.results, [criteriaId]: "Keine Daten" } }
                  : a
              )
            );
          }
        } catch (error) {
          setAnalyses((prev) =>
            prev.map((a, i) =>
              i === shopIndex
                ? { ...a, results: { ...a.results, [criteriaId]: "Fehler bei Analyse" } }
                : a
            )
          );
        }

        completedSteps++;
        setProgress((completedSteps / totalSteps) * 100);
      }

      // Mark shop as done
      setAnalyses((prev) =>
        prev.map((a, i) => (i === shopIndex ? { ...a, status: "done" } : a))
      );
    }

    setIsAnalyzing(false);
    setCurrentStep("");
  };

  const exportToExcel = () => {
    if (analyses.length === 0) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare data for matrix view
    const headers = ["Kriterium", ...analyses.map((a) => new URL(a.url).hostname)];
    const rows = activeCriteria.map((criteriaId) => {
      const criteriaName = COMPARISON_CRITERIA.find((c) => c.id === criteriaId)?.name || criteriaId;
      return [criteriaName, ...analyses.map((a) => a.results[criteriaId] || "-")];
    });

    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws["!cols"] = [{ wch: 15 }, ...analyses.map(() => ({ wch: 40 }))];

    XLSX.utils.book_append_sheet(wb, ws, "Vergleich");

    // Download
    XLSX.writeFile(wb, `shop-vergleich-${Date.now()}.xlsx`);
  };

  const exportToCsv = () => {
    if (analyses.length === 0) return;

    const headers = ["Kriterium", ...analyses.map((a) => new URL(a.url).hostname)];
    const rows = activeCriteria.map((criteriaId) => {
      const criteriaName = COMPARISON_CRITERIA.find((c) => c.id === criteriaId)?.name || criteriaId;
      return [
        criteriaName,
        ...analyses.map((a) => `"${(a.results[criteriaId] || "-").replace(/"/g, '""')}"`)
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `shop-vergleich-${Date.now()}.csv`;
    link.click();
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
            <h1 className="text-xl font-bold text-white">📊 Shop-Vergleichsmatrix</h1>
          </div>
          {analyses.length > 0 && !isAnalyzing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-900/30"
                onClick={exportToExcel}
              >
                📥 Excel Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={exportToCsv}
              >
                📄 CSV Export
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="fixed top-[65px] left-0 right-0 z-20">
          <Progress value={progress} className="h-1 rounded-none" />
          <div className="bg-slate-800/90 px-4 py-2 text-center">
            <p className="text-sm text-slate-300">{currentStep}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Setup Card */}
        {analyses.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Shops vergleichen</CardTitle>
              <CardDescription className="text-slate-400">
                Gib 2-5 Shop-URLs ein und wähle die Vergleichskriterien
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shop URLs */}
              <div className="space-y-3">
                <Label className="text-white">Shop-URLs</Label>
                {shopUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`https://shop${index + 1}.example.com`}
                      value={url}
                      onChange={(e) => updateShopUrl(index, e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                    {shopUrls.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => removeShopField(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
                {shopUrls.length < 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={addShopField}
                  >
                    + Weiteren Shop hinzufügen
                  </Button>
                )}
              </div>

              {/* Criteria Selection */}
              <div className="space-y-3">
                <Label className="text-white">Vergleichskriterien</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {COMPARISON_CRITERIA.map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        setCriteria((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                      }
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        criteria[c.id]
                          ? "bg-blue-900/30 border-blue-600 text-blue-300"
                          : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <span className="text-lg">{c.icon}</span>
                      <span className="ml-2 text-sm">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <Button
                onClick={analyzeShops}
                disabled={activeShops.length < 2 || activeCriteria.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {activeShops.length < 2
                  ? "Mindestens 2 Shops eingeben"
                  : activeCriteria.length === 0
                  ? "Mindestens 1 Kriterium wählen"
                  : `${activeShops.length} Shops vergleichen (${activeCriteria.length} Kriterien)`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Matrix */}
        {analyses.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Vergleichsergebnis</span>
                {!isAnalyzing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                    onClick={() => setAnalyses([])}
                  >
                    Neuer Vergleich
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-slate-400 border-b border-slate-700 min-w-[120px]">
                        Kriterium
                      </th>
                      {analyses.map((analysis, i) => (
                        <th
                          key={i}
                          className="p-3 text-left text-white border-b border-slate-700 min-w-[250px]"
                        >
                          <div className="flex items-center gap-2">
                            {analysis.status === "analyzing" && (
                              <span className="animate-spin">⏳</span>
                            )}
                            {analysis.status === "done" && <span>✅</span>}
                            {analysis.status === "pending" && <span>⏸️</span>}
                            <span className="truncate">
                              {(() => {
                                try {
                                  return new URL(analysis.url).hostname;
                                } catch {
                                  return analysis.url;
                                }
                              })()}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeCriteria.map((criteriaId) => {
                      const criteriaInfo = COMPARISON_CRITERIA.find(
                        (c) => c.id === criteriaId
                      );
                      return (
                        <tr key={criteriaId} className="border-b border-slate-700/50">
                          <td className="p-3 text-slate-300 font-medium align-top">
                            <span className="mr-2">{criteriaInfo?.icon}</span>
                            {criteriaInfo?.name}
                          </td>
                          {analyses.map((analysis, i) => (
                            <td
                              key={i}
                              className="p-3 text-slate-300 text-sm align-top"
                            >
                              {analysis.results[criteriaId] ? (
                                <div className="prose prose-invert prose-sm max-w-none">
                                  <ReactMarkdown>
                                    {analysis.results[criteriaId]}
                                  </ReactMarkdown>
                                </div>
                              ) : analysis.status === "analyzing" ? (
                                <span className="text-slate-500 animate-pulse">
                                  Analysiere...
                                </span>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
