import { useEffect } from 'react';

/**
 * Petit helper SEO sans dépendance — pose le <title>, la meta description
 * et un script JSON-LD dans le <head> au mount, et restore au unmount.
 * Compatible CRA / SPA — Google crawle le JS, donc ces tags sont indexables.
 */
export default function SEOHead({ title, description, jsonLd, canonicalPath }) {
  useEffect(() => {
    const prevTitle = document.title;

    if (title) document.title = title;

    // meta description
    const updateMeta = (name, content) => {
      if (!content) return null;
      let el = document.querySelector(`meta[name="${name}"]`);
      const created = !el;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute('content');
      el.setAttribute('content', content);
      return { el, prev, created };
    };
    const updateProp = (property, content) => {
      if (!content) return null;
      let el = document.querySelector(`meta[property="${property}"]`);
      const created = !el;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute('content');
      el.setAttribute('content', content);
      return { el, prev, created };
    };

    const restorers = [];
    if (description) {
      const r = updateMeta('description', description);
      if (r) restorers.push(r);
      const og = updateProp('og:description', description);
      if (og) restorers.push(og);
    }
    if (title) {
      const og = updateProp('og:title', title);
      if (og) restorers.push(og);
      const tw = updateMeta('twitter:title', title);
      if (tw) restorers.push(tw);
    }

    // canonical
    let canonicalEl = null;
    let prevCanonical = null;
    let createdCanonical = false;
    if (canonicalPath) {
      canonicalEl = document.querySelector('link[rel="canonical"]');
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
        createdCanonical = true;
      } else {
        prevCanonical = canonicalEl.getAttribute('href');
      }
      canonicalEl.setAttribute('href', `${window.location.origin}${canonicalPath}`);
    }

    // JSON-LD scripts (array possible)
    const ldScripts = [];
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((obj, i) => {
        const s = document.createElement('script');
        s.type = 'application/ld+json';
        s.setAttribute('data-seo-jsonld', `${i}`);
        s.textContent = JSON.stringify(obj);
        document.head.appendChild(s);
        ldScripts.push(s);
      });
    }

    return () => {
      document.title = prevTitle;
      restorers.forEach(({ el, prev, created }) => {
        if (created) el.remove();
        else if (prev !== null) el.setAttribute('content', prev);
      });
      if (canonicalEl) {
        if (createdCanonical) canonicalEl.remove();
        else if (prevCanonical !== null) canonicalEl.setAttribute('href', prevCanonical);
      }
      ldScripts.forEach(s => s.remove());
    };
  }, [title, description, JSON.stringify(jsonLd), canonicalPath]);

  return null;
}
