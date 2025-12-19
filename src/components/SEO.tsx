import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  structuredData?: object[];
}

const baseUrl = "https://okoafamilia.innovasure.co.ke";
const defaultTitle = "Okoa Familia - KShs. 70/day Affordable Daily Family Protection Cover";
const defaultDescription =
  "Protect your family with Okoa Familia insurance at just KShs. 70 per day. Simple, affordable health coverage for Kenyan families. Register today and secure your loved ones.";
const defaultKeywords =
  "okoa familia, okoa familia cover, okoa familia insurance, okoa familia kenya, affordable insurance kenya, daily insurance, family protection, KShs. 70 insurance, KES 70 insurance, health insurance kenya, micro insurance, innovasure, innovasure limited, innovasure kenya, innovasure limited kenya, innovasure okoa familia, family health insurance, affordable medical cover kenya, daily premium insurance, okoa familia registration, okoa familia payment";

const SEO = ({
  title = defaultTitle,
  description = defaultDescription,
  keywords = defaultKeywords,
  canonicalUrl = "/",
  ogImage = `${baseUrl}/og-image.webp`,
  ogType = "website",
  noindex = false,
  structuredData = [],
}: SEOProps) => {
  const fullTitle = title.includes("Okoa Familia") ? title : `${title} | Okoa Familia`;
  const fullCanonicalUrl =
    canonicalUrl.startsWith("http") ? canonicalUrl : `${baseUrl}${canonicalUrl}`;

  // Default Organization structured data
  const defaultStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Okoa Familia",
      alternateName: "Okoa Familia by Innovasure",
      url: baseUrl,
      logo: `${baseUrl}/logo.webp`,
      description: defaultDescription,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+254-729-622-622",
        contactType: "Customer Service",
        areaServed: "KE",
        availableLanguage: ["en", "sw"],
      },
      sameAs: [
        "https://innovasure.co.ke",
        "https://www.facebook.com/innovasure",
        "https://twitter.com/innovasure",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Okoa Familia",
      url: baseUrl,
      description: defaultDescription,
      publisher: {
        "@type": "Organization",
        name: "Innovasure Limited",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/register?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "InsuranceAgency",
      name: "Okoa Familia",
      url: baseUrl,
      description: defaultDescription,
      address: {
        "@type": "PostalAddress",
        addressCountry: "KE",
        addressLocality: "Nairobi",
      },
      areaServed: {
        "@type": "Country",
        name: "Kenya",
      },
      offers: {
        "@type": "Offer",
        name: "Okoa Familia Daily Premium",
        description: "Affordable daily family health insurance at KShs. 70 per day",
        price: "70",
        priceCurrency: "KES",
        availability: "https://schema.org/InStock",
      },
    },
  ];

  const allStructuredData = [...defaultStructuredData, ...structuredData];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Innovasure Limited" />
      <meta name="language" content="English" />
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Nairobi, Kenya" />
      <meta name="geo.position" content="-1.2921;36.8219" />
      <meta name="ICBM" content="-1.2921, 36.8219" />

      {/* Robots Meta */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Okoa Familia - Affordable Family Health Insurance" />
      <meta property="og:site_name" content="Okoa Familia" />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="Okoa Familia - Affordable Family Health Insurance" />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#ea580c" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Okoa Familia" />

      {/* Structured Data (JSON-LD) */}
      {allStructuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </Helmet>
  );
};

export default SEO;

