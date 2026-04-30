'use client';

import { useState, useEffect } from 'react';
import type { Card, TipoArvore } from '@/lib/types';
import { MarcadoresSelects, type MarcadoresValue } from './MarcadoresSelects';

interface ModalClassificarProps {
  card: Card;
  arvore: TipoArvore[];
  onConfirmar: (marc: { tipo: string; categoria: string; subcategoria: string | null; motivo: string }) => void;
  onFechar: () => void;
}

export function ModalClassificarMarcadores({ card, arvore, onConfirmar, onFechar }: ModalClassificarProps) {
  const [valor, setValor] = useState<MarcadoresValue>({
    tipo: card.tipo || '',
    categoria: card.categoria || '',
    subcategoria: card.subcategoria || '',
    motivo: card.motivo || '',
    subDisabled: false,
  });
  const [erro, setErro] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onFechar]);

  const valido =
    !!valor.tipo &&
    !!valor.categoria &&
    (valor.subDisabled || !!valor.subcategoria) &&
    !!valor.motivo;

  const handleConfirmar = () => {
    if (!valido) {
      setErro('Preencha todos os marcadores obrigatórios.');
      return;
    }
    onConfirmar({
      tipo: valor.tipo,
      categoria: valor.categoria,
      subcategoria: valor.subDisabled ? null : valor.subcategoria,
      motivo: valor.motivo,
    });
  };

  return (
    <div
      className="backdrop atribuir-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="dlg classificar-dlg">
        <section className="sec dlg-head">
          <div>
            <p className="dlg-title">Classificar antes de concluir</p>
            <span className="dlg-sub">
              Antes de fechar {card.numero || ''}, classifique o chamado
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
          <p className="lbl">Marcadores <span className="req">*</span></p>
          <MarcadoresSelects
            arvore={arvore}
            initial={{ tipo: card.tipo || '', categoria: card.categoria || '', subcategoria: card.subcategoria || '', motivo: card.motivo || '' }}
            onChange={setValor}
            idPrefix="c"
          />
          {erro && <p className="err">{erro}</p>}
        </section>
        <section className="sec footer">
          <button className="bo" type="button" onClick={onFechar}>Cancelar</button>
          <button
            className="bp"
            type="button"
            disabled={!valido}
            onClick={handleConfirmar}
          >
            Confirmar e concluir
          </button>
        </section>
      </div>
    </div>
  );
}
