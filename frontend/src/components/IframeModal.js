import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

/**
 * Shared Iframe Modal - CSS-based fullscreen toggle (port of Wavewatch2026 pattern).
 * Props:
 *  - src: iframe source URL
 *  - title: header title (string)
 *  - onClose: close callback
 *  - icon: optional leading icon
 *  - showOpenInNewTab: optional ExternalLink button
 *  - borderColor: optional tailwind border color class
 *  - iframeAllow: optional allow attr override
 *  - children: custom body (replaces iframe) for non-iframe content (e.g. radio audio)
 */
export default function IframeModal({
  src,
  title,
  onClose,
  icon = null,
  showOpenInNewTab = false,
  borderColor = 'border-gray-700',
  iframeAllow = 'autoplay; encrypted-media; fullscreen; picture-in-picture',
  children = null,
  testId = 'iframe-modal',
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // ESC: exit fullscreen first, then close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, isFullscreen]);

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    setIsFullscreen(f => !f);
  };

  if (!src && !children) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-stretch sm:items-center justify-center sm:p-4"
      onClick={onClose}
      data-testid={testId}
    >
      <div
        className={`relative bg-black overflow-hidden flex flex-col ${
          isFullscreen
            ? 'w-screen h-screen max-w-none rounded-none border-0'
            : `w-full h-full sm:h-[80vh] sm:max-w-6xl sm:w-[90vw] sm:rounded-lg sm:border ${borderColor}`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-700 bg-black/80 backdrop-blur-sm shrink-0">
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
                className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Ouvrir dans un nouvel onglet"
                onClick={(e) => e.stopPropagation()}
                data-testid="iframe-modal-open-newtab"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              aria-label="Plein écran"
              data-testid="iframe-modal-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
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
            <iframe
              src={src}
              title={title}
              className="w-full h-full block border-0"
              allowFullScreen
              allow={iframeAllow}
            />
          )}
        </div>
      </div>
    </div>
  );
}
