'use client';

import { useState, useCallback, useMemo } from 'react';
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
  onSair: () => void;
}

export function TelaKanban({
  colunas,
  tags,
  cards,
  nomeUsuario,
  onAbrirCard,
  onMoverCard,
  onTransferirChamadoMock,
  onAbrirIndicadores,
  onAbrirNovoChamado,
  onSair,
}: TelaKanbanProps) {
  const [colunaHover, setColunaHover] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const cardsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return cards;
    return cards.filter(
      (c) =>
        c.titulo.toLowerCase().includes(termo) ||
        c.cliente.nome.toLowerCase().includes(termo) ||
        (c.numero || '').toLowerCase().includes(termo)
    );
  }, [cards, busca]);

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
          <span className="kanban-sub">{nomeUsuario || 'Usuário'}</span>
        </div>
        <div className="kanban-head-right">
          {/* Busca */}
          <div className="kanban-busca-wrap">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="kanban-busca"
              type="text"
              placeholder="Buscar chamado..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button
                className="kanban-busca-clear"
                type="button"
                onClick={() => setBusca('')}
                title="Limpar busca"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            )}
          </div>

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
            <span>Simular transferência de chamado</span>
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
          const itens = cardsFiltrados.filter((c) => c.coluna === col.id);
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
