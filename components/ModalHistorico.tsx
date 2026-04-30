'use client';

import { useState, useEffect } from 'react';
import type { Conversa, Mensagem, Midia, MidiaImagem, MidiaDocumento, ClientePadrao } from '@/lib/types';
import { fmtLongo } from '@/lib/utils';
import { Lightbox } from './Lightbox';

interface ModalHistoricoProps {
  cliente: ClientePadrao;
  conversa: Conversa;
  onFechar: () => void;
}

export function ModalHistorico({ cliente, conversa, onFechar }: ModalHistoricoProps) {
  const [lightbox, setLightbox] = useState<{ url: string; caption: string } | null>(null);
  const msgs = conversa.mensagens;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ESC só fecha o histórico se o lightbox NÃO estiver aberto
      // (o lightbox tem seu próprio handler)
      if (e.key === 'Escape' && !lightbox) onFechar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onFechar, lightbox]);

  const renderMidia = (midia: Midia) => {
    if (midia.tipo === 'image') {
      const m = midia as MidiaImagem;
      return (
        <>
          <img
            className="msg-image"
            src={m.url}
            alt={m.caption || 'imagem'}
            loading="lazy"
            onClick={() => setLightbox({ url: m.url, caption: m.caption || '' })}
          />
          {m.caption && <div className="msg-caption">{m.caption}</div>}
        </>
      );
    }
    if (midia.tipo === 'documento') {
      const m = midia as MidiaDocumento;
      const nome = m.nomeArquivo || 'documento';
      return (
        <a className="msg-doc" href={m.url} target="_blank" rel="noopener noreferrer">
          <span className="msg-doc-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>
          <span className="msg-doc-info">
            <div className="msg-doc-name">{nome}</div>
            {m.tamanho && <div className="msg-doc-meta">{m.tamanho}</div>}
          </span>
        </a>
      );
    }
    return (
      <div className="msg-caption" style={{ color: '#737373', fontStyle: 'italic' }}>
        [mídia: {midia.tipo}]
      </div>
    );
  };

  const renderMsg = (m: Mensagem, idx: number) => {
    const meta = m.tipo === 'system' ? fmtLongo(m.data) : `${m.autor || ''} · ${fmtLongo(m.data)}`;
    const temTexto = !!m.texto;
    const temMidia = !!m.midia;
    const apenasMidia = temMidia && !temTexto;

    return (
      <div key={idx} className={`msg ${m.tipo}`}>
        {m.tipo !== 'system' && <span className="msg-meta">{meta}</span>}
        <div className={`msg-bubble${apenasMidia ? ' media-only' : ''}`}>
          {m.tipo === 'system' ? (
            <>{fmtLongo(m.data)} · {m.texto}</>
          ) : (
            <>
              {temMidia && renderMidia(m.midia!)}
              {temTexto && !temMidia && m.texto}
              {temTexto && temMidia && <div className="msg-caption">{m.texto}</div>}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="backdrop modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onFechar();
        }}
      >
        <div className="dlg historico-dlg">
          <section className="historico-head">
            <div>
              <p className="historico-titulo">
                Conversa com <span>{cliente.nome}</span>
              </p>
              <span className="historico-meta">
                {fmtLongo(msgs[0]?.data)} → {fmtLongo(msgs[msgs.length - 1]?.data)}
              </span>
            </div>
            <button className="icon-btn" onClick={onFechar} aria-label="Fechar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </section>
          <section className="historico-body">
            {msgs.map(renderMsg)}
          </section>
        </div>
      </div>
      {lightbox && (
        <Lightbox
          url={lightbox.url}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
