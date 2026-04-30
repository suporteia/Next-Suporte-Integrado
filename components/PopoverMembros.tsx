'use client';

import { useEffect, useRef } from 'react';
import type { Membro } from '@/lib/types';

interface PopoverMembrosProps {
  anchor: HTMLElement;
  membros: Membro[];
  onPick: (m: Membro) => void;
  onClose: () => void;
}

/** Popover absoluto que aparece colado num anchor. Usado pra trocar
 *  o solicitante e adicionar envolvidos. Click fora fecha. */
export function PopoverMembros({ anchor, membros, onPick, onClose }: PopoverMembrosProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Posiciona o popover relativo ao anchor
    if (!ref.current) return;
    const rect = anchor.getBoundingClientRect();
    const parent = anchor.offsetParent as HTMLElement | null;
    if (parent) {
      parent.style.position = 'relative';
      ref.current.style.top = anchor.offsetTop + anchor.offsetHeight + 3 + 'px';
      ref.current.style.left = anchor.offsetLeft + 'px';
      parent.appendChild(ref.current);
    }
  }, [anchor]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
        onClose();
      }
    };
    // Atrasa pra não fechar imediatamente após o click que abriu
    const id = setTimeout(() => document.addEventListener('click', onDocClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', onDocClick);
    };
  }, [anchor, onClose]);

  return (
    <div ref={ref} className="pop-menu op tmp">
      {membros.length === 0 ? (
        <div className="pop-empty">sem opções disponíveis</div>
      ) : (
        membros.map((p) => (
          <div
            key={p.id}
            className="pop-item"
            onClick={(e) => {
              e.stopPropagation();
              onPick(p);
              onClose();
            }}
          >
            <span className="cav">{p.ini}</span>
            {p.nome}
          </div>
        ))
      )}
    </div>
  );
}
