# WebScraper Setup Guide

Diese Anleitung erklärt, wie du alle benötigten API-Keys für die verschiedenen Scraping-Provider erhältst.

---

## Übersicht der Provider

| Provider | Kostenlos | API-Key nötig? | Registrierung |
|----------|-----------|----------------|---------------|
| **Firecrawl** | 500 Credits (einmalig) | ✅ Ja | Bereits vorhanden |
| **Exa** | $10 Credits | ✅ Ja | Bereits vorhanden |
| **Jina Reader** | Unbegrenzt (Rate-Limited) | ⚠️ Optional | Kostenlos |
| **ScrapingAnt** | 10.000/Monat | ✅ Ja | Kostenlos |
| **Native Fetch** | Unbegrenzt | ❌ Nein | - |

---

## 1. Firecrawl (Bereits vorhanden)

**Status:** ✅ API-Key vorhanden

- **Dashboard:** https://firecrawl.dev/app
- **Kostenlos:** 500 Credits (einmalig)
- **Funktionen:** Scrape, Crawl, Map, Agent

### API-Key erstellen:
1. Gehe zu https://firecrawl.dev/signin
2. Registriere dich oder logge dich ein
3. Navigiere zum Dashboard
4. Kopiere deinen API-Key

**Umgebungsvariable:** `FIRECRAWL_API_KEY`

---

## 2. Exa (Bereits vorhanden)

**Status:** ✅ API-Key vorhanden

- **Dashboard:** https://dashboard.exa.ai/api-keys
- **Kostenlos:** $10 Credits für neue Nutzer
- **Funktionen:** Semantische Suche, Content-Extraktion

### API-Key erstellen:
1. Gehe zu https://exa.ai
2. Klicke auf "Get Started" oder "Sign Up"
3. Navigiere zu https://dashboard.exa.ai/api-keys
4. Erstelle einen neuen API-Key

**Umgebungsvariable:** `EXA_API_KEY`

---

## 3. Jina Reader (NEU - Optional)

**Status:** 🆕 Noch kein API-Key

- **Website:** https://jina.ai/reader
- **Dashboard:** https://jina.ai/api-dashboard
- **Kostenlos:**
  - Ohne API-Key: 20 Requests/Minute
  - Mit API-Key: 200 Requests/Minute
- **Funktionen:** URL zu Markdown Konvertierung

### API-Key erstellen:
1. Gehe zu https://jina.ai
2. Klicke auf "API" oder navigiere zu https://jina.ai/api-dashboard
3. Registriere dich mit Email oder Google
4. Generiere einen kostenlosen API-Key
5. Der Key beginnt mit `jina_`

**Umgebungsvariable:** `JINA_API_KEY`

**Hinweis:** Jina funktioniert auch OHNE API-Key, aber mit niedrigerem Rate-Limit.

---

## 4. ScrapingAnt (NEU)

**Status:** 🆕 API-Key benötigt

- **Website:** https://scrapingant.com
- **Dashboard:** https://app.scrapingant.com/dashboard
- **Kostenlos:** 10.000 Credits/Monat (keine Kreditkarte nötig!)
- **Funktionen:** Scraping mit Proxy-Rotation, JS-Rendering

### API-Key erstellen:
1. Gehe zu https://scrapingant.com
2. Klicke auf "Start Free" oder "Sign Up"
3. Registriere dich mit Email (keine Kreditkarte nötig)
4. Nach der Registrierung: Navigiere zum Dashboard
5. Der API-Key wird direkt im Dashboard angezeigt

**Umgebungsvariable:** `SCRAPINGANT_API_KEY`

**Credit-Verbrauch:**
- Standard Scrape: 1 Credit
- Mit JavaScript-Rendering: 10 Credits
- Mit Premium Proxies: 10 Credits

---

## 5. Native Fetch (Kein API-Key nötig)

**Status:** ✅ Immer verfügbar

- **Kostenlos:** Unbegrenzt
- **Funktionen:** Einfaches HTTP-Scraping

Dieser Provider benötigt keinen API-Key und ist immer als Fallback verfügbar.

---

## Umgebungsvariablen (.env.local)

Erstelle eine `.env.local` Datei im Projektverzeichnis mit folgendem Inhalt:

```env
# === AUTHENTIFIZIERUNG ===
NEXTAUTH_SECRET=dein-geheimer-schluessel-hier
NEXTAUTH_URL=http://localhost:3000

# === SCRAPING PROVIDER ===

# Firecrawl (500 kostenlose Credits)
# Dashboard: https://firecrawl.dev/app
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Exa ($10 kostenlose Credits)
# Dashboard: https://dashboard.exa.ai/api-keys
EXA_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Jina Reader (Optional - erhöht Rate-Limit von 20 auf 200/min)
# Dashboard: https://jina.ai/api-dashboard
JINA_API_KEY=jina_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ScrapingAnt (10.000 kostenlose Credits/Monat)
# Dashboard: https://app.scrapingant.com/dashboard
SCRAPINGANT_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# === BENUTZER ===
# Standard-Admin (Passwort kann in Settings geändert werden)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dein-sicheres-passwort
```

---

## Vercel Deployment

Für das Deployment auf Vercel müssen die Umgebungsvariablen in den Vercel-Einstellungen hinterlegt werden:

1. Gehe zu https://vercel.com/dashboard
2. Wähle dein Projekt
3. Navigiere zu "Settings" → "Environment Variables"
4. Füge alle Variablen aus der `.env.local` hinzu

**Wichtig:** `NEXTAUTH_URL` muss auf deine Vercel-Domain zeigen (z.B. `https://webscraper.vercel.app`)

---

## Priorität der Provider

Die App verwendet automatisch den besten verfügbaren Provider basierend auf:

1. **Für Scraping:** Jina → ScrapingAnt → Firecrawl → Native
2. **Für Suche:** Exa → Firecrawl
3. **Für Crawling:** Firecrawl (einziger Provider)
4. **Für Agent:** Firecrawl (einziger Provider)

Wenn ein Provider nicht konfiguriert ist oder sein Limit erreicht hat, wird automatisch der nächste verwendet.

---

## Schnellstart-Checkliste

- [ ] Firecrawl API-Key kopieren (bereits vorhanden)
- [ ] Exa API-Key kopieren (bereits vorhanden)
- [ ] Jina Account erstellen und API-Key generieren
- [ ] ScrapingAnt Account erstellen und API-Key kopieren
- [ ] `.env.local` Datei erstellen und alle Keys eintragen
- [ ] `npm install` ausführen
- [ ] `npm run dev` starten
- [ ] Auf http://localhost:3000 testen

---

## Support & Dokumentation

- **Firecrawl Docs:** https://docs.firecrawl.dev
- **Exa Docs:** https://docs.exa.ai
- **Jina Reader Docs:** https://jina.ai/reader
- **ScrapingAnt Docs:** https://docs.scrapingant.com

---

*Zuletzt aktualisiert: Februar 2026*
