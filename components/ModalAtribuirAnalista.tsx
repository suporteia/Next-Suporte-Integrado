'use client';

import { useState, useEffect } from 'react';
import type { Card, Membro, Coluna } from '@/lib/types';

interface ModalAtribuirAnalistaProps {
  card: Card;
  colunaDestino: Coluna;
  membros: Membro[];
  onConfirmar: (analista: Membro) => void;
  onFechar: () => void;
}

export function ModalAtribuirAnalista({
  card,
  colunaDestino,
  membros,
  onConfirmar,
  onFechar,
}: ModalAtribuirAnalistaProps) {
  const [selecionado, setSelecionado] = useState<Membro | null>(null);

  // ESC fecha o modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onFechar]);

  return (
    <div
      className="backdrop atribuir-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="dlg atribuir-dlg">
        <section className="sec dlg-head">
          <div>
            <p className="dlg-title">Atribuir analista</p>
            <span className="dlg-sub">
              Antes de mover {card.numero || ''} pra{' '}
              <strong style={{ color: colunaDestino.cor }}>{colunaDestino.titulo}</strong>
            </span>
          </div>
          <button className="icon-btn" onClick={onFechar} aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </section>
        <section className="sec">
          <p className="lbl">Analista responsável <span className="req">*</span></p>
          <div className="atribuir-lista">
            {membros.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`atribuir-item${selecionado?.id === m.id ? ' selecionado' : ''}`}
                onClick={() => setSelecionado(m)}
              >
                <span className="cav">{m.ini}</span>
                <span>{m.nome}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="sec footer">
          <button className="bo" type="button" onClick={onFechar}>Cancelar</button>
          <button
            className="bp"
            type="button"
            disabled={!selecionado}
            onClick={() => selecionado && onConfirmar(selecionado)}
          >
            Confirmar e mover
          </button>
        </section>
      </div>
    </div>
  );
}
