import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "./site";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  ogImage?: string | null;
  ogType?: "website" | "article";
};

export function createPageMetadata({
  title,
  description = siteConfig.description,
  path = "",
  noIndex = false,
  ogImage = null,
  ogType = "website",
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.creator, url: absoluteUrl() }],
    creator: siteConfig.creator,
    publisher: siteConfig.creator,
    metadataBase: new URL(absoluteUrl()),
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: ogType,
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title,
      description,
      ...(ogImage
        ? {
            images: [
              {
                url: absoluteUrl(ogImage),
                width: 1200,
                height: 630,
                alt: `${siteConfig.name} — ${siteConfig.tagline}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [absoluteUrl(ogImage)] } : {}),
      creator: siteConfig.twitterHandle,
    },
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

export const rootMetadata: Metadata = {
  ...createPageMetadata({
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    path: "/",
  }),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  applicationName: siteConfig.name,
  category: "technology",
  icons: {
    icon: [
      { url: "/brand/logo-mark.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export function landingJsonLd() {
  const url = absoluteUrl();
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url,
      description: siteConfig.description,
      potentialAction: {
        "@type": "SearchAction",
        target: `${url}/signup`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url,
      logo: absoluteUrl("/brand/logo-mark.svg"),
      sameAs: [],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description: siteConfig.description,
      url,
    },
  ];
}

export function publicFormJsonLd(form: {
  title: string;
  description: string | null;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: form.title,
    description: form.description ?? siteConfig.description,
    url: absoluteUrl(`/f/${form.slug}`),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl(),
    },
  };
}
