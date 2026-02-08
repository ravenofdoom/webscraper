// E-Commerce Analysis Templates for Agent
// Vordefinierte Prompts für häufige Wettbewerber-Analysen

export interface AnalysisTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  prompt: string;
  category: "competitor" | "technical" | "seo" | "procurement";
}

export const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  // Wettbewerber-Analyse Templates (Priorität Hoch)
  {
    id: "competitor-overview",
    name: "Wettbewerber-Übersicht",
    icon: "🏢",
    description: "Allgemeine Analyse eines Wettbewerbers",
    category: "competitor",
    prompt: `Analysiere diesen Online-Shop als Wettbewerber und erstelle einen strukturierten Bericht:

1. **Unternehmensprofil**
   - Name, Standort, Gründungsjahr (falls erkennbar)
   - Branche und Spezialisierung
   - Zielgruppe (B2B, B2C, oder beides)

2. **Sortiment & Kategorien**
   - Hauptproduktgruppen
   - Geschätzte Anzahl Produkte
   - Besondere/einzigartige Produkte

3. **Preisstruktur**
   - Preisniveau (Budget, Mittelklasse, Premium)
   - Rabatte und Aktionen
   - Staffelpreise für B2B

4. **Lieferung & Service**
   - Lieferoptionen und Zeiten
   - Versandkosten
   - Rückgabepolitik

5. **Zahlungsarten**
   - Verfügbare Zahlungsmethoden
   - Kauf auf Rechnung (B2B wichtig)

6. **Stärken & Schwächen**
   - Was macht der Shop gut?
   - Wo gibt es Verbesserungspotenzial?

Formatiere die Ausgabe übersichtlich mit Markdown.`,
  },
  {
    id: "price-analysis",
    name: "Preisanalyse",
    icon: "💰",
    description: "Detaillierte Preis- und Rabattstruktur",
    category: "competitor",
    prompt: `Führe eine detaillierte Preisanalyse dieses Online-Shops durch:

1. **Preisniveau**
   - Einstiegspreise, Durchschnitt, Hochpreisig
   - Vergleich mit Marktstandard

2. **Rabatte & Aktionen**
   - Aktuelle Angebote und Rabatte
   - Mengenrabatte / Staffelpreise
   - Saisonale Aktionen

3. **B2B-Preisgestaltung** (falls vorhanden)
   - Netto-Preise
   - Kundengruppen-Rabatte
   - Rahmenverträge

4. **Versandkosten**
   - Standardversand
   - Expressoptionen
   - Kostenlose Lieferung ab welchem Bestellwert?

5. **Preispsychologie**
   - Wie werden Preise dargestellt?
   - Streichpreise, UVP-Vergleiche
   - Vertrauenssignale

6. **Zusammenfassung**
   - Preisstrategie des Shops
   - Potenzial für eigene Preisanpassungen

Formatiere als strukturierten Bericht mit Markdown.`,
  },
  {
    id: "product-range",
    name: "Sortimentsanalyse",
    icon: "📦",
    description: "Produktkategorien und Sortimentstiefe",
    category: "competitor",
    prompt: `Analysiere das Sortiment und die Produktstruktur dieses Online-Shops:

1. **Kategoriestruktur**
   - Hauptkategorien
   - Unterkategorien
   - Navigationstiefe

2. **Sortimentsbreite**
   - Anzahl Hauptkategorien
   - Geschätzte Gesamtproduktanzahl
   - Markenvielfalt

3. **Sortimentstiefe**
   - Varianten pro Produkt
   - Größen, Farben, Ausführungen
   - Zubehör und Ergänzungsprodukte

4. **Top-Seller / Fokusprodukte**
   - Welche Produkte werden prominent beworben?
   - Bestseller-Markierungen
   - Empfehlungssysteme

5. **Unique Selling Points**
   - Exklusivprodukte
   - Eigenmarken
   - Besondere Services (Gravur, Konfiguration)

6. **Sortimentslücken**
   - Was fehlt im Vergleich zum Markt?
   - Potenzielle Ergänzungen

Erstelle eine übersichtliche Markdown-Analyse.`,
  },
  {
    id: "delivery-service",
    name: "Lieferung & Service",
    icon: "🚚",
    description: "Versandoptionen, Zeiten, Kundenservice",
    category: "competitor",
    prompt: `Analysiere die Liefer- und Serviceleistungen dieses Online-Shops:

1. **Versandoptionen**
   - Standard, Express, Same-Day
   - Paketdienste (DHL, DPD, Hermes, etc.)
   - Speditionslieferung für große Artikel

2. **Lieferzeiten**
   - Standardlieferzeit
   - Express-Optionen
   - Verfügbarkeitsanzeigen

3. **Versandkosten**
   - Kosten nach Bestellwert
   - Gratisversand-Schwelle
   - Kosten für Express

4. **Rückgabe & Umtausch**
   - Rückgabefrist
   - Rücksendekosten
   - Umtauschprozess

5. **Kundenservice**
   - Kontaktmöglichkeiten (Telefon, E-Mail, Chat)
   - Servicezeiten
   - FAQ / Hilfebereich

6. **Zusatzservices**
   - Installation / Montage
   - Altgeräte-Mitnahme
   - Beratungsangebote

Erstelle einen strukturierten Servicevergleich mit Markdown.`,
  },
  {
    id: "payment-methods",
    name: "Zahlungsarten",
    icon: "💳",
    description: "Akzeptierte Zahlungsmethoden und Konditionen",
    category: "competitor",
    prompt: `Analysiere die Zahlungsoptionen dieses Online-Shops:

1. **Sofortige Zahlungsarten**
   - Kreditkarten (Visa, Mastercard, Amex)
   - PayPal
   - Sofortüberweisung / Klarna
   - Apple Pay / Google Pay

2. **Kauf auf Rechnung**
   - Verfügbar?
   - Anbieter (Klarna, PayPal, Billie)
   - Zahlungsziel

3. **Ratenzahlung**
   - Verfügbar?
   - Anbieter
   - Konditionen (Zinsen, Laufzeiten)

4. **B2B-Zahlungsarten**
   - Kauf auf Rechnung für Geschäftskunden
   - SEPA-Lastschrift
   - Vorkasse mit Skonto

5. **Sicherheit**
   - SSL-Zertifikat
   - Trusted Shops / Käuferschutz
   - Gütesiegel

6. **Checkout-Prozess**
   - Gastbestellung möglich?
   - Anzahl Schritte
   - Registrierungszwang?

Formatiere als übersichtliche Markdown-Analyse.`,
  },

  // Technische Analyse Templates
  {
    id: "tech-stack",
    name: "Tech-Stack Erkennung",
    icon: "🔧",
    description: "Shop-System, PIM, ERP und verwendete Technologien",
    category: "technical",
    prompt: `Analysiere die technische Infrastruktur dieses Online-Shops:

1. **Shop-System / E-Commerce Platform**
   - Shopify, Magento, WooCommerce, Shopware, OXID, Spryker?
   - Version falls erkennbar
   - Hinweise in HTML, Meta-Tags, Cookies

2. **PIM-System** (Product Information Management)
   - Akeneo, Pimcore, Salsify?
   - Erkennbare Strukturen

3. **CMS** (falls separat)
   - WordPress, TYPO3, Contentful?
   - Blog-System

4. **Frontend-Technologien**
   - React, Vue, Angular?
   - PWA-Fähigkeit
   - Mobile-Optimierung

5. **Drittanbieter-Integrationen**
   - Analytics (GA, Matomo)
   - Marketing-Tools
   - Chat-Widgets
   - Bewertungssysteme

6. **Performance-Indikatoren**
   - CDN im Einsatz?
   - Lazy Loading
   - Bildoptimierung

7. **Hosting / Infrastruktur**
   - Cloud-Provider (AWS, Azure, GCP)?
   - Geografische Verteilung

Erstelle einen technischen Bericht mit Markdown.`,
  },

  // SEO Templates
  {
    id: "seo-check",
    name: "SEO Quick-Check",
    icon: "📊",
    description: "Meta-Tags, Struktur, technisches SEO",
    category: "seo",
    prompt: `Führe einen SEO-Quick-Check für diesen Online-Shop durch:

1. **Title & Meta-Description**
   - Sind sie vorhanden?
   - Länge und Qualität
   - Keywords enthalten?

2. **Heading-Struktur**
   - H1 vorhanden und einzigartig?
   - Logische H2-H6 Hierarchie
   - Keywords in Überschriften

3. **URL-Struktur**
   - Sprechende URLs?
   - Kategorie-Struktur erkennbar?
   - Canonical Tags

4. **Bilder-SEO**
   - Alt-Texte vorhanden?
   - Dateinamen optimiert?
   - Lazy Loading

5. **Technisches SEO**
   - Mobile-Optimierung
   - Ladezeit-Indikatoren
   - Strukturierte Daten (Schema.org)

6. **Content-Qualität**
   - Unique Content auf Produktseiten?
   - Kategorietexte vorhanden?
   - Blog/Ratgeber-Bereich

7. **Empfehlungen**
   - Top 3 Verbesserungspotenziale
   - Quick Wins

Erstelle einen SEO-Audit mit Markdown-Formatierung.`,
  },

  // E-Procurement Templates
  {
    id: "b2b-features",
    name: "B2B-Features Check",
    icon: "🏭",
    description: "Geschäftskunden-Funktionen und B2B-Portal",
    category: "procurement",
    prompt: `Analysiere die B2B-Funktionen dieses Online-Shops:

1. **B2B-Portal / Geschäftskundenzugang**
   - Separater Bereich für Geschäftskunden?
   - Registrierungsprozess
   - Nettopreisanzeige

2. **Bestellprozesse**
   - Schnellbestellung / CSV-Upload
   - Bestelllisten / Favoriten
   - Wiederbestellung

3. **Kundenspezifische Preise**
   - Individuelle Rabatte
   - Rahmenverträge
   - Staffelpreise

4. **Budgetierung & Freigaben**
   - Kostenstellen
   - Freigabeworkflows
   - Bestelllimits

5. **Integration & Schnittstellen**
   - Punchout-Katalog (OCI/cXML)
   - EDI-Anbindung
   - API verfügbar?

6. **Abrechnungsfunktionen**
   - Sammelrechnung
   - Kauf auf Rechnung
   - SEPA-Lastschrift

7. **Zusatzservices für B2B**
   - Persönlicher Ansprechpartner
   - Technische Beratung
   - Vor-Ort-Service

Erstelle einen strukturierten B2B-Capability-Report.`,
  },
  {
    id: "eprocurement-check",
    name: "E-Procurement Schnittstellen",
    icon: "🔗",
    description: "OCI, cXML, Punchout-Katalog Prüfung",
    category: "procurement",
    prompt: `Prüfe die E-Procurement-Fähigkeiten dieses Online-Shops:

1. **Punchout-Katalog**
   - OCI (Open Catalog Interface) Support?
   - cXML Punchout verfügbar?
   - Hinweise auf SAP Ariba, Coupa, etc.

2. **Katalog-Formate**
   - BMEcat Export?
   - CSV/Excel Download?
   - ETIM-Klassifizierung?

3. **Integration in ERP-Systeme**
   - SAP-Anbindung erwähnt?
   - Microsoft Dynamics
   - Andere ERP-Systeme

4. **EDI-Fähigkeit**
   - Elektronischer Datenaustausch
   - Bestellübertragung
   - Rechnungsdaten

5. **Technische Dokumentation**
   - API-Dokumentation verfügbar?
   - Entwickler-Bereich
   - Integrationsanleitungen

6. **Zertifizierungen**
   - Procurement-Plattform-Zertifizierungen
   - Branchenstandards

Erstelle einen E-Procurement Readiness Report.`,
  },
];

// Kategorien für die UI-Gruppierung
export const TEMPLATE_CATEGORIES = {
  competitor: {
    name: "Wettbewerber-Analyse",
    icon: "🏢",
    color: "green",
  },
  technical: {
    name: "Technische Analyse",
    icon: "🔧",
    color: "orange",
  },
  seo: {
    name: "SEO-Analyse",
    icon: "📊",
    color: "purple",
  },
  procurement: {
    name: "E-Procurement",
    icon: "🔗",
    color: "cyan",
  },
};

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): AnalysisTemplate[] {
  return ANALYSIS_TEMPLATES.filter((t) => t.category === category);
}

// Helper function to get template by ID
export function getTemplateById(id: string): AnalysisTemplate | undefined {
  return ANALYSIS_TEMPLATES.find((t) => t.id === id);
}
