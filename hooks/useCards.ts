'use client';

import { useState, useEffect, useCallback } from 'react';
import { storeCards } from '@/lib/storeCards';
import { COLUNAS_MONITORADAS, TEMPO_LIMITE_MIN } from '@/lib/config';
import { isoCurto } from '@/lib/utils';
import type { Card, Membro } from '@/lib/types';
import templatesTransferencia from '@/data/templates-transferencia.json';
import type { TemplateTransferencia } from '@/lib/types';

const TEMPLATES = templatesTransferencia as TemplateTransferencia[];

/** Retorna o Date em que o card chegou na coluna atual. */
export function tempoNaColunaAtual(card: Card): Date {
  for (let i = card.timeline.length - 1; i >= 0; i--) {
    const ev = card.timeline[i];
    if (ev.col === card.coluna) return new Date(ev.data);
  }
  return new Date(card.criadoEm);
}

/** Card está "expirado" se está numa coluna monitorada
 *  há mais que TEMPO_LIMITE_MIN minutos sem ser movido. */
export function cardExpirado(card: Card, agora: number = Date.now()): boolean {
  if (!COLUNAS_MONITORADAS.includes(card.coluna)) return false;
  const entrada = tempoNaColunaAtual(card);
  const minutos = (agora - entrada.getTime()) / 60000;
  return minutos >= TEMPO_LIMITE_MIN;
}

/** Verifica se faltam marcadores essenciais (tipo, categoria, motivo). */
export function marcadoresIncompletos(card: Card): boolean {
  return !card.tipo || !card.categoria || !card.motivo;
}

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [tickSla, setTickSla] = useState(0);

  // Carrega do storage uma vez na hidratação
  useEffect(() => {
    const salvos = storeCards.carregar();
    if (salvos) setCards(salvos);
  }, []);

  // Tick a cada 10s pra recalcular `expirado` nos cards monitorados.
  // Não muda o array de cards — só força rerender.
  useEffect(() => {
    const id = setInterval(() => setTickSla((t) => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  /** Persiste no storage e atualiza o state. Receber o novo array é
   *  obrigatório — não fazemos diff aqui. */
  const persistir = useCallback((novos: Card[]) => {
    storeCards.salvar(novos);
    setCards(novos);
  }, []);

  /** Helper genérico de mutação por id. Retorna o novo array. */
  const updateCard = useCallback(
    (cardId: string, mutate: (card: Card) => Card): Card[] | null => {
      let novoArr: Card[] | null = null;
      setCards((atuais) => {
        const idx = atuais.findIndex((c) => c.id === cardId);
        if (idx === -1) return atuais;
        novoArr = atuais.map((c) => (c.id === cardId ? mutate({ ...c }) : c));
        storeCards.salvar(novoArr);
        return novoArr;
      });
      return novoArr;
    },
    []
  );

  /** Adiciona um card no topo da lista. */
  const addCard = useCallback((novo: Card) => {
    setCards((atuais) => {
      const arr = [novo, ...atuais];
      storeCards.salvar(arr);
      return arr;
    });
  }, []);

  /** Move card para outra coluna (sem validações). */
  const moveCardCommit = useCallback(
    (cardId: string, colunaDestino: string) => {
      updateCard(cardId, (card) => {
        if (card.coluna === colunaDestino) return card;
        const agora = isoCurto();
        const fechouAgora = colunaDestino === 'concluido' || colunaDestino === 'cancelado';
        return {
          ...card,
          coluna: colunaDestino,
          fechadoEm: fechouAgora ? agora : null,
          timeline: [
            ...card.timeline,
            { data: agora, acao: 'Movido para', col: colunaDestino, autor: 'Você' },
          ],
        };
      });
    },
    [updateCard]
  );

  /** Atribui analista a um card, com registro na timeline. */
  const atribuirAnalista = useCallback(
    (cardId: string, analista: Membro) => {
      updateCard(cardId, (card) => ({
        ...card,
        analista,
        timeline: [
          ...card.timeline,
          {
            data: isoCurto(),
            acao: 'Analista atribuído: ' + analista.nome,
            col: card.coluna,
            autor: 'Você',
          },
        ],
      }));
    },
    [updateCard]
  );

  /** Atualiza marcadores (tipo/categoria/subcategoria/motivo) e registra. */
  const atualizarMarcadores = useCallback(
    (
      cardId: string,
      marc: { tipo: string; categoria: string; subcategoria: string | null; motivo: string }
    ) => {
      updateCard(cardId, (card) => ({
        ...card,
        ...marc,
        timeline: [
          ...card.timeline,
          {
            data: isoCurto(),
            acao: 'Marcadores classificados',
            col: card.coluna,
            autor: 'Você',
          },
        ],
      }));
    },
    [updateCard]
  );

  /** Edição completa de um card (vinda do dialog). */
  const editarCard = useCallback(
    (cardId: string, patch: Partial<Card>) => {
      updateCard(cardId, (card) => ({
        ...card,
        ...patch,
        timeline: [
          ...card.timeline,
          { data: isoCurto(), acao: 'Chamado editado', col: card.coluna, autor: 'Você' },
        ],
      }));
    },
    [updateCard]
  );

  /** Simula a chegada de um chamado novo do ChatLiguer. */
  const transferirChamadoMock = useCallback(() => {
    const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const agora = isoCurto();
    setCards((atuais) => {
      const novoNumero = '#' + String(1290 + atuais.length).padStart(4, '0');
      const novoCard: Card = {
        id: 'ch' + Date.now(),
        numero: novoNumero,
        cliente: { ...t.cliente, idCliente: 'auto-' + Date.now().toString(36) },
        titulo: t.titulo,
        detalhamento: t.descricao,
        descricao: t.descricao,
        tipo: null,
        categoria: null,
        subcategoria: null,
        motivo: null,
        tags: ['suporte'],
        coluna: 'transferido',
        criadoEm: agora,
        fechadoEm: null,
        motivoFechamento: null,
        transferidoPor: 'Lídia (IA)',
        analista: null,
        envolvidos: [],
        anexos: [],
        ultimaMsg: t.ultimaMsg,
        timeline: [
          { data: agora, acao: 'Chat transferido para a fila', col: 'transferido', autor: 'Lídia (IA)' },
        ],
      };
      const arr = [novoCard, ...atuais];
      storeCards.salvar(arr);
      return arr;
    });
  }, []);

  return {
    cards,
    tickSla, // só pra forçar rerender em quem usa cardExpirado
    persistir,
    updateCard,
    addCard,
    moveCardCommit,
    atribuirAnalista,
    atualizarMarcadores,
    editarCard,
    transferirChamadoMock,
  };
}
