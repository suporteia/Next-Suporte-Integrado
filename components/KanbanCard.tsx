'use client';

import type { Card, Tag } from '@/lib/types';
import { cardExpirado } from '@/hooks/useCards';

interface KanbanCardProps {
  card: Card;
  tags: Tag[];
  onClick: () => void;
  onDragStart: (cardId: string) => void;
  onDragEnd: () => void;
}

export function KanbanCard({ card: c, tags, onClick, onDragStart, onDragEnd }: KanbanCardProps) {
  const expirado = cardExpirado(c);

  const tagsDoCard = (c.tags || [])
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is Tag => !!t);

  return (
    <div
      className={`card${expirado ? ' expirado' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', c.id);
        e.currentTarget.classList.add('dragging');
        onDragStart(c.id);
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('dragging');
        onDragEnd();
      }}
      onClick={onClick}
    >
      <div className="card-top">
        <span className="card-numero">{c.numero || ''}</span>
        {!c.analista && <span className="card-sem-resp">sem responsável</span>}
        {c.tipo ? (
          <span className="card-tipo" data-tipo={c.tipo}>{c.tipo}</span>
        ) : (
          <span className="card-tipo" data-tipo="sem-class">sem classificação</span>
        )}
      </div>
      <div className="card-head">
        <span className="card-av">{c.cliente.ini}</span>
        <span className="card-nome">{c.cliente.nome}</span>
      </div>
      <div className="card-titulo">{c.titulo}</div>
      {tagsDoCard.length > 0 && (
        <div className="card-tags">
          {tagsDoCard.map((t) => (
            <span
              key={t.id}
              className="tag-chip"
              style={{ background: `${t.cor}20`, color: t.cor }}
            >
              {t.nome}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
