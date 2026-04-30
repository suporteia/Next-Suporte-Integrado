'use client';

import { useState, useCallback } from 'react';
import type { Card, Coluna, Tag } from '@/lib/types';
import { KanbanCard } from './KanbanCard';

interface TelaKanbanProps {
  colunas: Coluna[];
  tags: Tag[];
  cards: Card[];
  nomeUsuario?: string;
  onAbrirCard: (cardId: string) => void;
  onMoverCard: (cardId: string, colunaDestino: string) => void;
  onTransferirChamadoMock: () => void;
  onAbrirIndicadores: () => void;
  onAbrirNovoChamado: () => void;
  onVoltar: () => void;
  onSair: () => void;
}

export function TelaKanban({
  colunas,
  tags,
  cards,
  onAbrirCard,
  onMoverCard,
  onTransferirChamadoMock,
  onAbrirIndicadores,
  onAbrirNovoChamado,
  onVoltar,
  onSair,
}: TelaKanbanProps) {
  // Coluna que está com hover do drag — dispara o highlight visual
  const [colunaHover, setColunaHover] = useState<string | null>(null);

  const onDrop = useCallback(
    (e: React.DragEvent, colunaId: string) => {
      e.preventDefault();
      setColunaHover(null);
      const cardId = e.dataTransfer.getData('text/plain');
      if (cardId) onMoverCard(cardId, colunaId);
    },
    [onMoverCard]
  );

  return (
    <div className="tela-kanban">
      <div className="kanban-head">
        <div className="kanban-head-left">
          <p className="kanban-titulo">Suporte Integrado</p>
          <span className="kanban-sub">Fila de chamados · N2 · Tech · Financeiro</span>
        </div>
        <div className="kanban-head-right">
          <button
            className="btn-transferir-sim"
            onClick={onTransferirChamadoMock}
            title="Simula a chegada de um chamado novo do ChatLiguer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>Transferir chamado</span>
          </button>
          <button className="btn-indi" onClick={onAbrirIndicadores}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Indicadores</span>
          </button>
          <button className="btn-novo" onClick={onAbrirNovoChamado}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Novo chamado</span>
          </button>
          <button className="btn-voltar" onClick={onVoltar}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Voltar</span>
          </button>
          <button className="btn-sair" onClick={onSair} title="Sair">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="kanban-body">
        {colunas.map((col) => {
          const itens = cards.filter((c) => c.coluna === col.id);
          return (
            <div
              key={col.id}
              className={`col${colunaHover === col.id ? ' dragover' : ''}`}
              data-id={col.id}
            >
              <div className="col-head">
                <span className="col-titulo">
                  <span className="col-dot" />
                  {col.titulo}
                </span>
                <span className="col-count">{itens.length}</span>
              </div>
              <div
                className="col-list"
                data-col={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setColunaHover(col.id);
                }}
                onDragLeave={(e) => {
                  // só limpa se realmente saiu do container (não filho)
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setColunaHover((c) => (c === col.id ? null : c));
                  }
                }}
                onDrop={(e) => onDrop(e, col.id)}
              >
                {itens.map((c) => (
                  <KanbanCard
                    key={c.id}
                    card={c}
                    tags={tags}
                    onClick={() => onAbrirCard(c.id)}
                    onDragStart={() => {}}
                    onDragEnd={() => setColunaHover(null)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
