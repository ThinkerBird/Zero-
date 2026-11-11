import React, { useEffect } from 'react';

interface SeoMetaProps {
  title: string;
  description: string;
  canonicalPath?: string;
  structuredData?: object;
}

export const SeoMeta: React.FC<SeoMetaProps> = ({
  title,
  description,
  canonicalPath = '',
  structuredData,
}) => {
  useEffect(() => {
    // 1. Page Title
    document.title = `${title} — Zero`;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. OpenGraph Title & Description
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `${title} — Zero`);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);

    // 4. Twitter Card Title & Description
    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twTitle) {
      twTitle = document.createElement('meta');
      twTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twTitle);
    }
    twTitle.setAttribute('content', `${title} — Zero`);

    let twDesc = document.querySelector('meta[name="twitter:description"]');
    if (!twDesc) {
      twDesc = document.createElement('meta');
      twDesc.setAttribute('name', 'twitter:description');
      document.head.appendChild(twDesc);
    }
    twDesc.setAttribute('content', description);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    canonicalLink.setAttribute('href', `${currentOrigin}${canonicalPath}`);

    // 6. Schema.org JSON-LD Structured Data
    let scriptLd = document.querySelector('#json-ld-schema');
    if (structuredData) {
      if (!scriptLd) {
        scriptLd = document.createElement('script');
        scriptLd.setAttribute('type', 'application/ld+json');
        scriptLd.setAttribute('id', 'json-ld-schema');
        document.head.appendChild(scriptLd);
      }
      scriptLd.textContent = JSON.stringify(structuredData);
    } else if (scriptLd) {
      scriptLd.remove();
    }
  }, [title, description, canonicalPath, structuredData]);

  return null;
};
