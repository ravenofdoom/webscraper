// E-Procurement Detector - Erkennt B2B/Procurement Features aus HTML

export interface ProcurementResult {
  b2bPortal: B2BPortalInfo;
  punchout: PunchoutInfo;
  catalog: CatalogInfo;
  erpIntegration: ERPIntegrationInfo;
  b2bFeatures: B2BFeature[];
  score: number; // 0-100 B2B Readiness Score
  recommendation: string;
}

export interface B2BPortalInfo {
  detected: boolean;
  confidence: number;
  evidence: string[];
  loginType?: "separate" | "integrated" | "unknown";
}

export interface PunchoutInfo {
  ociSupport: { detected: boolean; confidence: number; evidence: string[] };
  cxmlSupport: { detected: boolean; confidence: number; evidence: string[] };
  aribaSupport: { detected: boolean; confidence: number; evidence: string[] };
  coupaSupport: { detected: boolean; confidence: number; evidence: string[] };
}

export interface CatalogInfo {
  bmecatSupport: { detected: boolean; confidence: number; evidence: string[] };
  datanormSupport: { detected: boolean; confidence: number; evidence: string[] };
  etimSupport: { detected: boolean; confidence: number; evidence: string[] };
  csvExport: { detected: boolean; confidence: number; evidence: string[] };
}

export interface ERPIntegrationInfo {
  sapSupport: { detected: boolean; confidence: number; evidence: string[] };
  microsoftDynamics: { detected: boolean; confidence: number; evidence: string[] };
  oracleSupport: { detected: boolean; confidence: number; evidence: string[] };
  apiAvailable: { detected: boolean; confidence: number; evidence: string[] };
}

export interface B2BFeature {
  name: string;
  detected: boolean;
  confidence: number;
  evidence: string[];
  category: "ordering" | "pricing" | "account" | "integration" | "payment";
}

// B2B Portal Detection Patterns
const B2B_PORTAL_PATTERNS = [
  { regex: /geschäftskund/i, weight: 80, evidence: "Geschäftskunden-Bereich" },
  { regex: /b2b(-|\s)?portal/i, weight: 90, evidence: "B2B-Portal" },
  { regex: /business(-|\s)?kund/i, weight: 75, evidence: "Business-Kunden" },
  { regex: /firmen(-|\s)?kund/i, weight: 80, evidence: "Firmenkunden" },
  { regex: /gewerblich/i, weight: 70, evidence: "Gewerbliche Kunden" },
  { regex: /für\s+unternehmen/i, weight: 75, evidence: "Für Unternehmen" },
  { regex: /b2b(-|\s)?shop/i, weight: 85, evidence: "B2B-Shop" },
  { regex: /großhandel/i, weight: 80, evidence: "Großhandel" },
  { regex: /händler(-|\s)?(portal|login|bereich)/i, weight: 85, evidence: "Händler-Portal" },
  { regex: /netto(-|\s)?preis/i, weight: 70, evidence: "Nettopreise" },
  { regex: /preis\s+exkl\.|preis\s+netto/i, weight: 65, evidence: "Exkl. Preise" },
];

// Punchout Patterns
const PUNCHOUT_PATTERNS = {
  oci: [
    { regex: /\boci\b/i, weight: 60, evidence: "OCI erwähnt" },
    { regex: /open\s*catalog\s*interface/i, weight: 90, evidence: "Open Catalog Interface" },
    { regex: /oci(-|\s)?anbindung/i, weight: 85, evidence: "OCI-Anbindung" },
    { regex: /oci(-|\s)?schnittstelle/i, weight: 85, evidence: "OCI-Schnittstelle" },
    { regex: /oci(-|\s)?punchout/i, weight: 90, evidence: "OCI-Punchout" },
    { regex: /hook_url|return_url.*oci/i, weight: 80, evidence: "OCI Parameter" },
  ],
  cxml: [
    { regex: /cxml/i, weight: 70, evidence: "cXML erwähnt" },
    { regex: /cxml(-|\s)?punchout/i, weight: 90, evidence: "cXML-Punchout" },
    { regex: /cxml(-|\s)?order/i, weight: 85, evidence: "cXML-Order" },
    { regex: /punchoutsetupre(quest|sponse)/i, weight: 95, evidence: "PunchOutSetup" },
  ],
  ariba: [
    { regex: /ariba/i, weight: 75, evidence: "Ariba erwähnt" },
    { regex: /sap\s*ariba/i, weight: 90, evidence: "SAP Ariba" },
    { regex: /ariba\s*network/i, weight: 85, evidence: "Ariba Network" },
    { regex: /ariba(-|\s)?punchout/i, weight: 90, evidence: "Ariba-Punchout" },
  ],
  coupa: [
    { regex: /coupa/i, weight: 80, evidence: "Coupa erwähnt" },
    { regex: /coupa(-|\s)?punchout/i, weight: 90, evidence: "Coupa-Punchout" },
    { regex: /coupa(-|\s)?integration/i, weight: 85, evidence: "Coupa-Integration" },
  ],
};

// Catalog Format Patterns
const CATALOG_PATTERNS = {
  bmecat: [
    { regex: /bmecat/i, weight: 85, evidence: "BMEcat erwähnt" },
    { regex: /bme\s*cat/i, weight: 80, evidence: "BME cat" },
    { regex: /katalog(-|\s)?export/i, weight: 50, evidence: "Katalog-Export" },
  ],
  datanorm: [
    { regex: /datanorm/i, weight: 90, evidence: "DATANORM" },
    { regex: /datanorm\s*\d/i, weight: 95, evidence: "DATANORM Version" },
  ],
  etim: [
    { regex: /\betim\b/i, weight: 70, evidence: "ETIM erwähnt" },
    { regex: /etim(-|\s)?klassifizierung/i, weight: 90, evidence: "ETIM-Klassifizierung" },
    { regex: /etim(-|\s)?klasse/i, weight: 85, evidence: "ETIM-Klasse" },
  ],
  csv: [
    { regex: /csv(-|\s)?export/i, weight: 70, evidence: "CSV-Export" },
    { regex: /csv(-|\s)?download/i, weight: 70, evidence: "CSV-Download" },
    { regex: /excel(-|\s)?export/i, weight: 65, evidence: "Excel-Export" },
  ],
};

// ERP Integration Patterns
const ERP_PATTERNS = {
  sap: [
    { regex: /\bsap\b(?!\s*ariba)/i, weight: 60, evidence: "SAP erwähnt" },
    { regex: /sap(-|\s)?integration/i, weight: 85, evidence: "SAP-Integration" },
    { regex: /sap(-|\s)?anbindung/i, weight: 85, evidence: "SAP-Anbindung" },
    { regex: /sap(-|\s)?schnittstelle/i, weight: 85, evidence: "SAP-Schnittstelle" },
    { regex: /idoc/i, weight: 80, evidence: "SAP IDoc" },
  ],
  dynamics: [
    { regex: /microsoft\s*dynamics/i, weight: 85, evidence: "Microsoft Dynamics" },
    { regex: /dynamics\s*(365|nav|ax)/i, weight: 90, evidence: "Dynamics Version" },
    { regex: /navision/i, weight: 80, evidence: "Navision" },
  ],
  oracle: [
    { regex: /oracle\s*(erp|cloud)/i, weight: 85, evidence: "Oracle ERP" },
    { regex: /netsuite/i, weight: 80, evidence: "NetSuite" },
  ],
  api: [
    { regex: /api(-|\s)?dokumentation/i, weight: 80, evidence: "API-Dokumentation" },
    { regex: /rest(-|\s)?api/i, weight: 75, evidence: "REST-API" },
    { regex: /api(-|\s)?schnittstelle/i, weight: 75, evidence: "API-Schnittstelle" },
    { regex: /entwickler(-|\s)?(portal|dokumentation)/i, weight: 85, evidence: "Entwickler-Portal" },
    { regex: /swagger|openapi/i, weight: 80, evidence: "OpenAPI/Swagger" },
  ],
};

// B2B Feature Patterns
const B2B_FEATURES: Array<{
  name: string;
  category: "ordering" | "pricing" | "account" | "integration" | "payment";
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>;
}> = [
  {
    name: "Schnellbestellung",
    category: "ordering",
    patterns: [
      { regex: /schnell(-|\s)?bestellung/i, weight: 90, evidence: "Schnellbestellung" },
      { regex: /quick(-|\s)?order/i, weight: 85, evidence: "Quick Order" },
      { regex: /csv(-|\s)?upload/i, weight: 80, evidence: "CSV-Upload" },
      { regex: /artikelliste\s*hochladen/i, weight: 85, evidence: "Artikelliste hochladen" },
    ],
  },
  {
    name: "Bestelllisten/Favoriten",
    category: "ordering",
    patterns: [
      { regex: /bestellliste/i, weight: 85, evidence: "Bestellliste" },
      { regex: /merkliste/i, weight: 70, evidence: "Merkliste" },
      { regex: /einkaufsliste/i, weight: 80, evidence: "Einkaufsliste" },
      { regex: /wunschliste/i, weight: 60, evidence: "Wunschliste" },
    ],
  },
  {
    name: "Wiederbestellung",
    category: "ordering",
    patterns: [
      { regex: /wieder(-|\s)?bestell/i, weight: 85, evidence: "Wiederbestellung" },
      { regex: /erneut\s*bestell/i, weight: 80, evidence: "Erneut bestellen" },
      { regex: /nachbestellung/i, weight: 80, evidence: "Nachbestellung" },
    ],
  },
  {
    name: "Staffelpreise",
    category: "pricing",
    patterns: [
      { regex: /staffel(-|\s)?preis/i, weight: 90, evidence: "Staffelpreise" },
      { regex: /mengen(-|\s)?rabatt/i, weight: 85, evidence: "Mengenrabatt" },
      { regex: /ab\s+\d+\s*(stück|stk)/i, weight: 75, evidence: "Ab X Stück" },
      { regex: /preis\s*ab\s*menge/i, weight: 80, evidence: "Preis ab Menge" },
    ],
  },
  {
    name: "Individuelle Preise",
    category: "pricing",
    patterns: [
      { regex: /individuelle\s*preis/i, weight: 85, evidence: "Individuelle Preise" },
      { regex: /kunden(-|\s)?preis/i, weight: 80, evidence: "Kundenpreise" },
      { regex: /vereinbarte\s*preis/i, weight: 85, evidence: "Vereinbarte Preise" },
      { regex: /rahmen(-|\s)?vertrag/i, weight: 90, evidence: "Rahmenvertrag" },
    ],
  },
  {
    name: "Kostenstellen",
    category: "account",
    patterns: [
      { regex: /kostenstelle/i, weight: 90, evidence: "Kostenstelle" },
      { regex: /cost\s*center/i, weight: 85, evidence: "Cost Center" },
      { regex: /budget(-|\s)?verwaltung/i, weight: 80, evidence: "Budgetverwaltung" },
    ],
  },
  {
    name: "Freigabeworkflow",
    category: "account",
    patterns: [
      { regex: /freigabe(-|\s)?workflow/i, weight: 90, evidence: "Freigabeworkflow" },
      { regex: /bestell(-|\s)?freigabe/i, weight: 85, evidence: "Bestellfreigabe" },
      { regex: /genehmigung/i, weight: 70, evidence: "Genehmigung" },
      { regex: /approval/i, weight: 70, evidence: "Approval" },
    ],
  },
  {
    name: "Mehrere Benutzer",
    category: "account",
    patterns: [
      { regex: /benutzer(-|\s)?verwaltung/i, weight: 80, evidence: "Benutzerverwaltung" },
      { regex: /unter(-|\s)?konten/i, weight: 85, evidence: "Unterkonten" },
      { regex: /mitarbeiter(-|\s)?zugang/i, weight: 85, evidence: "Mitarbeiterzugang" },
    ],
  },
  {
    name: "EDI-Anbindung",
    category: "integration",
    patterns: [
      { regex: /\bedi\b/i, weight: 75, evidence: "EDI erwähnt" },
      { regex: /edi(-|\s)?anbindung/i, weight: 90, evidence: "EDI-Anbindung" },
      { regex: /edifact/i, weight: 90, evidence: "EDIFACT" },
      { regex: /elektronischer\s*datenaustausch/i, weight: 85, evidence: "Elektronischer Datenaustausch" },
    ],
  },
  {
    name: "Kauf auf Rechnung",
    category: "payment",
    patterns: [
      { regex: /kauf\s*auf\s*rechnung/i, weight: 90, evidence: "Kauf auf Rechnung" },
      { regex: /rechnung(-|\s)?skauf/i, weight: 85, evidence: "Rechnungskauf" },
      { regex: /zahlungsziel/i, weight: 80, evidence: "Zahlungsziel" },
      { regex: /\d+\s*tage\s*zahlungsziel/i, weight: 90, evidence: "X Tage Zahlungsziel" },
    ],
  },
  {
    name: "SEPA-Lastschrift",
    category: "payment",
    patterns: [
      { regex: /sepa(-|\s)?lastschrift/i, weight: 90, evidence: "SEPA-Lastschrift" },
      { regex: /bankeinzug/i, weight: 80, evidence: "Bankeinzug" },
      { regex: /lastschrift(-|\s)?mandat/i, weight: 85, evidence: "Lastschriftmandat" },
    ],
  },
  {
    name: "Sammelrechnung",
    category: "payment",
    patterns: [
      { regex: /sammelrechnung/i, weight: 90, evidence: "Sammelrechnung" },
      { regex: /monatsrechnung/i, weight: 85, evidence: "Monatsrechnung" },
      { regex: /periodische\s*abrechnung/i, weight: 80, evidence: "Periodische Abrechnung" },
    ],
  },
];

function detectPatterns(
  html: string,
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>
): { detected: boolean; confidence: number; evidence: string[] } {
  let totalWeight = 0;
  const evidence: string[] = [];

  for (const pattern of patterns) {
    if (pattern.regex.test(html)) {
      totalWeight += pattern.weight;
      evidence.push(pattern.evidence);
    }
  }

  return {
    detected: evidence.length > 0,
    confidence: Math.min(100, totalWeight),
    evidence,
  };
}

export function detectProcurement(html: string): ProcurementResult {
  // Detect B2B Portal
  const b2bPortalResult = detectPatterns(html, B2B_PORTAL_PATTERNS);
  const b2bPortal: B2BPortalInfo = {
    detected: b2bPortalResult.confidence >= 50,
    confidence: b2bPortalResult.confidence,
    evidence: b2bPortalResult.evidence,
    loginType: b2bPortalResult.detected ? "unknown" : undefined,
  };

  // Detect Punchout capabilities
  const punchout: PunchoutInfo = {
    ociSupport: detectPatterns(html, PUNCHOUT_PATTERNS.oci),
    cxmlSupport: detectPatterns(html, PUNCHOUT_PATTERNS.cxml),
    aribaSupport: detectPatterns(html, PUNCHOUT_PATTERNS.ariba),
    coupaSupport: detectPatterns(html, PUNCHOUT_PATTERNS.coupa),
  };

  // Detect Catalog formats
  const catalog: CatalogInfo = {
    bmecatSupport: detectPatterns(html, CATALOG_PATTERNS.bmecat),
    datanormSupport: detectPatterns(html, CATALOG_PATTERNS.datanorm),
    etimSupport: detectPatterns(html, CATALOG_PATTERNS.etim),
    csvExport: detectPatterns(html, CATALOG_PATTERNS.csv),
  };

  // Detect ERP Integration
  const erpIntegration: ERPIntegrationInfo = {
    sapSupport: detectPatterns(html, ERP_PATTERNS.sap),
    microsoftDynamics: detectPatterns(html, ERP_PATTERNS.dynamics),
    oracleSupport: detectPatterns(html, ERP_PATTERNS.oracle),
    apiAvailable: detectPatterns(html, ERP_PATTERNS.api),
  };

  // Detect B2B Features
  const b2bFeatures: B2BFeature[] = B2B_FEATURES.map((feature) => {
    const result = detectPatterns(html, feature.patterns);
    return {
      name: feature.name,
      detected: result.confidence >= 50,
      confidence: result.confidence,
      evidence: result.evidence,
      category: feature.category,
    };
  }).filter((f) => f.detected);

  // Calculate B2B Readiness Score
  let score = 0;
  if (b2bPortal.detected) score += 20;
  if (punchout.ociSupport.detected || punchout.cxmlSupport.detected) score += 25;
  if (punchout.aribaSupport.detected || punchout.coupaSupport.detected) score += 10;
  if (catalog.bmecatSupport.detected) score += 10;
  if (erpIntegration.sapSupport.detected || erpIntegration.apiAvailable.detected) score += 15;
  score += Math.min(20, b2bFeatures.length * 3);

  // Generate recommendation
  let recommendation = "";
  if (score >= 80) {
    recommendation = "Exzellente B2B-Fähigkeiten. Der Shop ist sehr gut für E-Procurement geeignet.";
  } else if (score >= 60) {
    recommendation = "Gute B2B-Grundausstattung. Punchout-Kataloge und weitere Integrationen könnten ergänzt werden.";
  } else if (score >= 40) {
    recommendation = "Grundlegende B2B-Features vorhanden. Empfehlung: OCI/cXML-Schnittstellen und Katalogformate implementieren.";
  } else if (score >= 20) {
    recommendation = "Wenige B2B-Features erkannt. Der Shop ist primär auf B2C ausgerichtet.";
  } else {
    recommendation = "Keine B2B-Features erkannt. Der Shop scheint ausschließlich B2C zu sein.";
  }

  return {
    b2bPortal,
    punchout,
    catalog,
    erpIntegration,
    b2bFeatures,
    score,
    recommendation,
  };
}

// Format result as readable text
export function formatProcurementResult(result: ProcurementResult): string {
  const lines: string[] = [];

  lines.push("## E-Procurement Analyse\n");
  lines.push(`**B2B Readiness Score: ${result.score}/100**\n`);
  lines.push(`*${result.recommendation}*\n`);

  lines.push("### B2B-Portal");
  if (result.b2bPortal.detected) {
    lines.push(`✅ Erkannt (Konfidenz: ${result.b2bPortal.confidence}%)`);
    lines.push(`   - ${result.b2bPortal.evidence.join(", ")}\n`);
  } else {
    lines.push("❌ Nicht erkannt\n");
  }

  lines.push("### Punchout-Schnittstellen");
  const punchoutItems = [
    { name: "OCI", ...result.punchout.ociSupport },
    { name: "cXML", ...result.punchout.cxmlSupport },
    { name: "SAP Ariba", ...result.punchout.aribaSupport },
    { name: "Coupa", ...result.punchout.coupaSupport },
  ];
  for (const item of punchoutItems) {
    if (item.detected) {
      lines.push(`✅ ${item.name}: Erkannt (${item.confidence}%)`);
    }
  }
  if (!punchoutItems.some((p) => p.detected)) {
    lines.push("❌ Keine Punchout-Schnittstellen erkannt");
  }
  lines.push("");

  lines.push("### Katalogformate");
  const catalogItems = [
    { name: "BMEcat", ...result.catalog.bmecatSupport },
    { name: "DATANORM", ...result.catalog.datanormSupport },
    { name: "ETIM", ...result.catalog.etimSupport },
    { name: "CSV-Export", ...result.catalog.csvExport },
  ];
  for (const item of catalogItems) {
    if (item.detected) {
      lines.push(`✅ ${item.name}: Erkannt`);
    }
  }
  if (!catalogItems.some((c) => c.detected)) {
    lines.push("❌ Keine Katalogformate erkannt");
  }
  lines.push("");

  lines.push("### ERP-Integration");
  const erpItems = [
    { name: "SAP", ...result.erpIntegration.sapSupport },
    { name: "Microsoft Dynamics", ...result.erpIntegration.microsoftDynamics },
    { name: "Oracle/NetSuite", ...result.erpIntegration.oracleSupport },
    { name: "API verfügbar", ...result.erpIntegration.apiAvailable },
  ];
  for (const item of erpItems) {
    if (item.detected) {
      lines.push(`✅ ${item.name}: Erkannt`);
    }
  }
  if (!erpItems.some((e) => e.detected)) {
    lines.push("❌ Keine ERP-Integrationen erkannt");
  }
  lines.push("");

  if (result.b2bFeatures.length > 0) {
    lines.push("### B2B-Features");
    const byCategory: Record<string, B2BFeature[]> = {};
    for (const feature of result.b2bFeatures) {
      if (!byCategory[feature.category]) byCategory[feature.category] = [];
      byCategory[feature.category].push(feature);
    }

    const categoryNames: Record<string, string> = {
      ordering: "Bestellung",
      pricing: "Preise",
      account: "Konto",
      integration: "Integration",
      payment: "Zahlung",
    };

    for (const [cat, features] of Object.entries(byCategory)) {
      lines.push(`\n**${categoryNames[cat] || cat}:**`);
      for (const f of features) {
        lines.push(`- ✅ ${f.name}`);
      }
    }
  }

  return lines.join("\n");
}
