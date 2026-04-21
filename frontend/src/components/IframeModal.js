import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

/**
 * Shared Iframe Modal - Mobile responsive with fullscreen support.
 * Props:
 *  - src: iframe source URL (required)
 *  - title: header title (string)
 *  - onClose: close callback
 *  - icon: optional leading icon element (e.g. <Play />)
 *  - showOpenInNewTab: optional ExternalLink button
 *  - borderColor: optional tailwind border color class (e.g. 'border-green-500/30')
 *  - iframeAllow: optional allow attr override
 *  - children: custom body (replaces iframe) for non-iframe content (e.g. radio audio)
 */
export default function IframeModal({
  src,
  title,
  onClose,
  icon = null,
  showOpenInNewTab = false,
  borderColor = 'border-gray-800',
  iframeAllow = 'autoplay; encrypted-media; fullscreen; picture-in-picture',
  children = null,
  testId = 'iframe-modal',
}) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.webkitEnterFullscreen) await el.webkitEnterFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      }
    } catch (err) {
      // Fallback: try on iframe element for iOS Safari
      const iframe = el.querySelector('iframe');
      if (iframe && iframe.webkitEnterFullscreen) {
        try { iframe.webkitEnterFullscreen(); } catch (_) {}
      }
    }
  };

  if (!src && !children) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
      data-testid={testId}
    >
      <div
        ref={containerRef}
        className={`relative w-full h-full sm:h-auto sm:max-w-5xl sm:rounded-xl bg-black overflow-hidden flex flex-col ${isFullscreen ? '' : `sm:border ${borderColor}`}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-800 bg-black/95 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <h3 className="text-white text-sm sm:text-base font-medium truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {showOpenInNewTab && src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Ouvrir dans un nouvel onglet"
                onClick={(e) => e.stopPropagation()}
                data-testid="iframe-modal-open-newtab"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              aria-label="Plein écran"
              data-testid="iframe-modal-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Fermer"
              aria-label="Fermer"
              data-testid="iframe-modal-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 bg-black overflow-hidden">
          {children ? (
            children
          ) : (
            <div className="w-full h-full sm:aspect-video sm:h-auto">
              <iframe
                src={src}
                title={title}
                className="w-full h-full block"
                allowFullScreen
                allow={iframeAllow}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
