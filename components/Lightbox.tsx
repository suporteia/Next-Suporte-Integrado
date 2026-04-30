'use client';

import { useEffect } from 'react';

interface LightboxProps {
  url: string;
  caption?: string;
  onClose: () => void;
}

export function Lightbox({ url, caption, onClose }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="lightbox"
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button className="lightbox-close" onClick={onClose} aria-label="Fechar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
      <img src={url} alt={caption || ''} />
      {caption && <div className="lightbox-caption">{caption}</div>}
    </div>
  );
}
