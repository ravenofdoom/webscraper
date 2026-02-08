// Tech Stack Detector - Erkennt Shop-Systeme und Technologien aus HTML

export interface TechDetectionResult {
  shopSystem: DetectedTech | null;
  pim: DetectedTech | null;
  cms: DetectedTech | null;
  frontend: DetectedTech[];
  analytics: DetectedTech[];
  marketing: DetectedTech[];
  payment: DetectedTech[];
  other: DetectedTech[];
  confidence: "high" | "medium" | "low";
}

export interface DetectedTech {
  name: string;
  version?: string;
  confidence: number; // 0-100
  evidence: string[];
}

// Shop System Patterns
const SHOP_PATTERNS: Array<{
  name: string;
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>;
}> = [
  {
    name: "Shopify",
    patterns: [
      { regex: /cdn\.shopify\.com/i, weight: 90, evidence: "Shopify CDN" },
      { regex: /Shopify\.theme/i, weight: 95, evidence: "Shopify.theme JS" },
      { regex: /shopify-section/i, weight: 85, evidence: "shopify-section class" },
      { regex: /\/\/cdn\.shopifycdn\.net/i, weight: 90, evidence: "Shopify CDN net" },
      { regex: /myshopify\.com/i, weight: 80, evidence: "myshopify.com domain" },
    ],
  },
  {
    name: "Magento",
    patterns: [
      { regex: /Mage\.Cookies/i, weight: 95, evidence: "Mage.Cookies JS" },
      { regex: /\/static\/version/i, weight: 70, evidence: "Magento static versioning" },
      { regex: /mage\/cookies/i, weight: 90, evidence: "mage/cookies module" },
      { regex: /varien\/form\.js/i, weight: 85, evidence: "varien form.js" },
      { regex: /skin\/frontend/i, weight: 75, evidence: "Magento skin path" },
      { regex: /magento/i, weight: 30, evidence: "magento keyword" },
    ],
  },
  {
    name: "WooCommerce",
    patterns: [
      { regex: /woocommerce/i, weight: 85, evidence: "woocommerce class/id" },
      { regex: /wc-add-to-cart/i, weight: 90, evidence: "WC add to cart" },
      { regex: /wp-content\/plugins\/woocommerce/i, weight: 95, evidence: "WooCommerce plugin path" },
      { regex: /wc_add_to_cart_params/i, weight: 90, evidence: "WC JS params" },
    ],
  },
  {
    name: "Shopware",
    patterns: [
      { regex: /shopware/i, weight: 60, evidence: "shopware keyword" },
      { regex: /themes\/Frontend\/Responsive/i, weight: 90, evidence: "Shopware theme path" },
      { regex: /StateManager/i, weight: 50, evidence: "Shopware StateManager" },
      { regex: /swag-/i, weight: 70, evidence: "Shopware swag- prefix" },
      { regex: /\/widgets\/listing/i, weight: 75, evidence: "Shopware widgets" },
    ],
  },
  {
    name: "OXID eShop",
    patterns: [
      { regex: /oxid/i, weight: 50, evidence: "oxid keyword" },
      { regex: /oxideshop/i, weight: 90, evidence: "oxideshop" },
      { regex: /out\/azure/i, weight: 85, evidence: "OXID azure theme" },
      { regex: /oxbasket/i, weight: 80, evidence: "oxbasket" },
    ],
  },
  {
    name: "PrestaShop",
    patterns: [
      { regex: /prestashop/i, weight: 80, evidence: "prestashop keyword" },
      { regex: /modules\/prestashop/i, weight: 95, evidence: "PrestaShop modules" },
      { regex: /id_product/i, weight: 40, evidence: "PrestaShop product ID" },
      { regex: /prestashop\.js/i, weight: 90, evidence: "prestashop.js" },
    ],
  },
  {
    name: "Spryker",
    patterns: [
      { regex: /spryker/i, weight: 85, evidence: "spryker keyword" },
      { regex: /Yves/i, weight: 40, evidence: "Spryker Yves" },
      { regex: /spryker-shop/i, weight: 90, evidence: "spryker-shop" },
    ],
  },
  {
    name: "commercetools",
    patterns: [
      { regex: /commercetools/i, weight: 90, evidence: "commercetools" },
      { regex: /ct-storefront/i, weight: 85, evidence: "CT storefront" },
    ],
  },
  {
    name: "Salesforce Commerce Cloud",
    patterns: [
      { regex: /demandware/i, weight: 90, evidence: "demandware (SFCC)" },
      { regex: /dwanalytics/i, weight: 85, evidence: "DW analytics" },
      { regex: /sites-site_id/i, weight: 80, evidence: "SFCC sites" },
    ],
  },
  {
    name: "BigCommerce",
    patterns: [
      { regex: /bigcommerce/i, weight: 85, evidence: "bigcommerce" },
      { regex: /cdn\.bcapp\.com/i, weight: 90, evidence: "BigCommerce CDN" },
      { regex: /stencil/i, weight: 40, evidence: "BC Stencil" },
    ],
  },
];

// PIM System Patterns
const PIM_PATTERNS: Array<{
  name: string;
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>;
}> = [
  {
    name: "Akeneo",
    patterns: [
      { regex: /akeneo/i, weight: 90, evidence: "akeneo keyword" },
      { regex: /pim_catalog/i, weight: 85, evidence: "Akeneo catalog" },
    ],
  },
  {
    name: "Pimcore",
    patterns: [
      { regex: /pimcore/i, weight: 90, evidence: "pimcore keyword" },
      { regex: /\/pimcore\//i, weight: 85, evidence: "pimcore path" },
    ],
  },
  {
    name: "Salsify",
    patterns: [
      { regex: /salsify/i, weight: 85, evidence: "salsify keyword" },
    ],
  },
  {
    name: "inRiver",
    patterns: [
      { regex: /inriver/i, weight: 85, evidence: "inriver keyword" },
    ],
  },
];

// CMS Patterns
const CMS_PATTERNS: Array<{
  name: string;
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>;
}> = [
  {
    name: "WordPress",
    patterns: [
      { regex: /wp-content/i, weight: 90, evidence: "wp-content path" },
      { regex: /wp-includes/i, weight: 90, evidence: "wp-includes path" },
      { regex: /wordpress/i, weight: 50, evidence: "wordpress keyword" },
    ],
  },
  {
    name: "TYPO3",
    patterns: [
      { regex: /typo3/i, weight: 85, evidence: "typo3 keyword" },
      { regex: /\/typo3conf\//i, weight: 95, evidence: "typo3conf path" },
    ],
  },
  {
    name: "Drupal",
    patterns: [
      { regex: /drupal/i, weight: 70, evidence: "drupal keyword" },
      { regex: /sites\/all\/modules/i, weight: 90, evidence: "Drupal modules path" },
      { regex: /sites\/default\/files/i, weight: 85, evidence: "Drupal files path" },
    ],
  },
  {
    name: "Contentful",
    patterns: [
      { regex: /contentful/i, weight: 80, evidence: "contentful keyword" },
      { regex: /cdn\.contentful\.com/i, weight: 95, evidence: "Contentful CDN" },
    ],
  },
  {
    name: "Storyblok",
    patterns: [
      { regex: /storyblok/i, weight: 85, evidence: "storyblok keyword" },
      { regex: /a\.storyblok\.com/i, weight: 95, evidence: "Storyblok assets" },
    ],
  },
];

// Frontend Framework Patterns
const FRONTEND_PATTERNS: Array<{
  name: string;
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>;
}> = [
  {
    name: "React",
    patterns: [
      { regex: /react/i, weight: 50, evidence: "react keyword" },
      { regex: /_react|reactDOM/i, weight: 85, evidence: "React DOM" },
      { regex: /data-reactroot/i, weight: 95, evidence: "React root" },
    ],
  },
  {
    name: "Vue.js",
    patterns: [
      { regex: /vue\.js|vue\.min\.js/i, weight: 90, evidence: "Vue.js file" },
      { regex: /v-if|v-for|v-bind/i, weight: 85, evidence: "Vue directives" },
      { regex: /__vue__/i, weight: 90, evidence: "Vue instance" },
    ],
  },
  {
    name: "Angular",
    patterns: [
      { regex: /angular/i, weight: 60, evidence: "angular keyword" },
      { regex: /ng-app|ng-controller/i, weight: 90, evidence: "Angular directives" },
      { regex: /_angular|@angular/i, weight: 85, evidence: "Angular core" },
    ],
  },
  {
    name: "Next.js",
    patterns: [
      { regex: /_next\//i, weight: 95, evidence: "_next path" },
      { regex: /__NEXT_DATA__/i, weight: 95, evidence: "Next.js data" },
    ],
  },
  {
    name: "Nuxt.js",
    patterns: [
      { regex: /_nuxt\//i, weight: 95, evidence: "_nuxt path" },
      { regex: /__NUXT__/i, weight: 95, evidence: "Nuxt data" },
    ],
  },
  {
    name: "jQuery",
    patterns: [
      { regex: /jquery/i, weight: 70, evidence: "jQuery" },
      { regex: /jquery\.min\.js/i, weight: 85, evidence: "jQuery minified" },
    ],
  },
  {
    name: "Bootstrap",
    patterns: [
      { regex: /bootstrap/i, weight: 60, evidence: "bootstrap keyword" },
      { regex: /bootstrap\.min\.(css|js)/i, weight: 85, evidence: "Bootstrap files" },
    ],
  },
  {
    name: "Tailwind CSS",
    patterns: [
      { regex: /tailwind/i, weight: 70, evidence: "tailwind keyword" },
      { regex: /class="[^"]*\b(flex|grid|px-|py-|bg-|text-)\b/i, weight: 60, evidence: "Tailwind classes" },
    ],
  },
];

// Analytics Patterns
const ANALYTICS_PATTERNS: Array<{
  name: string;
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>;
}> = [
  {
    name: "Google Analytics",
    patterns: [
      { regex: /google-analytics\.com\/analytics/i, weight: 95, evidence: "GA script" },
      { regex: /googletagmanager/i, weight: 90, evidence: "GTM" },
      { regex: /gtag\(/i, weight: 90, evidence: "gtag function" },
      { regex: /UA-\d{4,}-\d/i, weight: 85, evidence: "UA tracking ID" },
      { regex: /G-[A-Z0-9]+/i, weight: 85, evidence: "GA4 ID" },
    ],
  },
  {
    name: "Matomo/Piwik",
    patterns: [
      { regex: /matomo/i, weight: 85, evidence: "matomo keyword" },
      { regex: /piwik/i, weight: 85, evidence: "piwik keyword" },
      { regex: /_paq\.push/i, weight: 95, evidence: "Matomo tracking" },
    ],
  },
  {
    name: "Hotjar",
    patterns: [
      { regex: /hotjar/i, weight: 90, evidence: "hotjar" },
      { regex: /static\.hotjar\.com/i, weight: 95, evidence: "Hotjar CDN" },
    ],
  },
  {
    name: "Microsoft Clarity",
    patterns: [
      { regex: /clarity\.ms/i, weight: 95, evidence: "Clarity script" },
    ],
  },
];

// Marketing/CRM Patterns
const MARKETING_PATTERNS: Array<{
  name: string;
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>;
}> = [
  {
    name: "HubSpot",
    patterns: [
      { regex: /hubspot/i, weight: 85, evidence: "hubspot keyword" },
      { regex: /js\.hs-scripts\.com/i, weight: 95, evidence: "HubSpot scripts" },
    ],
  },
  {
    name: "Klaviyo",
    patterns: [
      { regex: /klaviyo/i, weight: 90, evidence: "klaviyo" },
      { regex: /a\.klaviyo\.com/i, weight: 95, evidence: "Klaviyo API" },
    ],
  },
  {
    name: "Mailchimp",
    patterns: [
      { regex: /mailchimp/i, weight: 85, evidence: "mailchimp" },
      { regex: /chimpstatic\.com/i, weight: 90, evidence: "Mailchimp CDN" },
    ],
  },
  {
    name: "Zendesk",
    patterns: [
      { regex: /zendesk/i, weight: 85, evidence: "zendesk" },
      { regex: /static\.zdassets\.com/i, weight: 95, evidence: "Zendesk assets" },
    ],
  },
  {
    name: "Intercom",
    patterns: [
      { regex: /intercom/i, weight: 80, evidence: "intercom" },
      { regex: /widget\.intercom\.io/i, weight: 95, evidence: "Intercom widget" },
    ],
  },
  {
    name: "Crisp Chat",
    patterns: [
      { regex: /crisp\.chat/i, weight: 95, evidence: "Crisp chat" },
    ],
  },
];

// Payment Patterns
const PAYMENT_PATTERNS: Array<{
  name: string;
  patterns: Array<{ regex: RegExp; weight: number; evidence: string }>;
}> = [
  {
    name: "PayPal",
    patterns: [
      { regex: /paypal/i, weight: 70, evidence: "paypal keyword" },
      { regex: /paypalobjects\.com/i, weight: 90, evidence: "PayPal objects" },
    ],
  },
  {
    name: "Stripe",
    patterns: [
      { regex: /stripe/i, weight: 60, evidence: "stripe keyword" },
      { regex: /js\.stripe\.com/i, weight: 95, evidence: "Stripe JS" },
    ],
  },
  {
    name: "Klarna",
    patterns: [
      { regex: /klarna/i, weight: 85, evidence: "klarna" },
      { regex: /x\.klarnacdn\.net/i, weight: 95, evidence: "Klarna CDN" },
    ],
  },
  {
    name: "Adyen",
    patterns: [
      { regex: /adyen/i, weight: 85, evidence: "adyen" },
      { regex: /checkoutshopper.*adyen/i, weight: 95, evidence: "Adyen checkout" },
    ],
  },
  {
    name: "Mollie",
    patterns: [
      { regex: /mollie/i, weight: 80, evidence: "mollie keyword" },
    ],
  },
];

function detectFromPatterns(
  html: string,
  patterns: Array<{ name: string; patterns: Array<{ regex: RegExp; weight: number; evidence: string }> }>
): DetectedTech[] {
  const results: DetectedTech[] = [];

  for (const tech of patterns) {
    let totalWeight = 0;
    const evidence: string[] = [];

    for (const pattern of tech.patterns) {
      if (pattern.regex.test(html)) {
        totalWeight += pattern.weight;
        evidence.push(pattern.evidence);
      }
    }

    if (evidence.length > 0) {
      // Normalize confidence to 0-100
      const confidence = Math.min(100, totalWeight);

      results.push({
        name: tech.name,
        confidence,
        evidence,
      });
    }
  }

  // Sort by confidence
  return results.sort((a, b) => b.confidence - a.confidence);
}

export function detectTechStack(html: string): TechDetectionResult {
  // Detect each category
  const shopSystems = detectFromPatterns(html, SHOP_PATTERNS);
  const pimSystems = detectFromPatterns(html, PIM_PATTERNS);
  const cmsSystems = detectFromPatterns(html, CMS_PATTERNS);
  const frontendTech = detectFromPatterns(html, FRONTEND_PATTERNS);
  const analytics = detectFromPatterns(html, ANALYTICS_PATTERNS);
  const marketing = detectFromPatterns(html, MARKETING_PATTERNS);
  const payment = detectFromPatterns(html, PAYMENT_PATTERNS);

  // Determine primary shop system (highest confidence > 50)
  const primaryShop = shopSystems.find((s) => s.confidence >= 50) || null;
  const primaryPim = pimSystems.find((p) => p.confidence >= 50) || null;
  const primaryCms = cmsSystems.find((c) => c.confidence >= 50) || null;

  // Determine overall confidence
  const hasHighConfidence = primaryShop?.confidence && primaryShop.confidence >= 80;
  const hasMediumConfidence = primaryShop?.confidence && primaryShop.confidence >= 50;

  return {
    shopSystem: primaryShop,
    pim: primaryPim,
    cms: primaryCms,
    frontend: frontendTech.filter((t) => t.confidence >= 40),
    analytics: analytics.filter((t) => t.confidence >= 40),
    marketing: marketing.filter((t) => t.confidence >= 40),
    payment: payment.filter((t) => t.confidence >= 40),
    other: [],
    confidence: hasHighConfidence ? "high" : hasMediumConfidence ? "medium" : "low",
  };
}

// Format result as readable text
export function formatTechStackResult(result: TechDetectionResult): string {
  const lines: string[] = [];

  lines.push("## Tech-Stack Analyse\n");

  if (result.shopSystem) {
    lines.push(`### Shop-System: ${result.shopSystem.name}`);
    lines.push(`Konfidenz: ${result.shopSystem.confidence}%`);
    lines.push(`Erkannt durch: ${result.shopSystem.evidence.join(", ")}\n`);
  } else {
    lines.push("### Shop-System: Nicht erkannt\n");
  }

  if (result.pim) {
    lines.push(`### PIM-System: ${result.pim.name}`);
    lines.push(`Konfidenz: ${result.pim.confidence}%\n`);
  }

  if (result.cms) {
    lines.push(`### CMS: ${result.cms.name}`);
    lines.push(`Konfidenz: ${result.cms.confidence}%\n`);
  }

  if (result.frontend.length > 0) {
    lines.push("### Frontend-Technologien");
    for (const tech of result.frontend) {
      lines.push(`- ${tech.name} (${tech.confidence}%)`);
    }
    lines.push("");
  }

  if (result.analytics.length > 0) {
    lines.push("### Analytics & Tracking");
    for (const tech of result.analytics) {
      lines.push(`- ${tech.name} (${tech.confidence}%)`);
    }
    lines.push("");
  }

  if (result.marketing.length > 0) {
    lines.push("### Marketing & CRM");
    for (const tech of result.marketing) {
      lines.push(`- ${tech.name}`);
    }
    lines.push("");
  }

  if (result.payment.length > 0) {
    lines.push("### Zahlungsanbieter");
    for (const tech of result.payment) {
      lines.push(`- ${tech.name}`);
    }
    lines.push("");
  }

  lines.push(`---\n*Analyse-Konfidenz: ${result.confidence}*`);

  return lines.join("\n");
}
