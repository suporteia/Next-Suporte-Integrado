'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCards, marcadoresIncompletos } from '@/hooks/useCards';
import { isoCurto } from '@/lib/utils';
import type { Card, Membro } from '@/lib/types';

import { LoginScreen } from '@/components/LoginScreen';
import { TelaKanban } from '@/components/TelaKanban';
import { ModalDetalhe } from '@/components/ModalDetalhe';
import { ModalIndicadores } from '@/components/ModalIndicadores';
import { ModalAtribuirAnalista } from '@/components/ModalAtribuirAnalista';
import { ModalClassificarMarcadores } from '@/components/ModalClassificarMarcadores';
import { ModalHistorico } from '@/components/ModalHistorico';
import { DialogChamado, type DialogChamadoSubmitData } from '@/components/DialogChamado';

import colunasData from '@/data/colunas.json';
import tagsData from '@/data/tags.json';
import teamData from '@/data/team.json';
import arvoreData from '@/data/arvore-classificacao.json';
import clientePadraoData from '@/data/cliente-padrao.json';
import conversaData from '@/data/conversa-exemplo.json';

import type {
  Coluna,
  Tag,
  TeamConfig,
  TipoArvore,
  ClientePadrao,
  Conversa,
} from '@/lib/types';

const COLUNAS = colunasData as Coluna[];
const TAGS = tagsData as Tag[];
const TEAM = teamData as TeamConfig;
const ARVORE = arvoreData as TipoArvore[];
const CLIENTE_PADRAO = clientePadraoData as ClientePadrao;
const CONVERSA = conversaData as Conversa;

type DialogState =
  | { aberto: false }
  | { aberto: true; modo: 'criar'; comOrigem: boolean }
  | { aberto: true; modo: 'editar'; cardId: string };

type AtribuirState = { aberto: boolean; cardId?: string; colunaDestino?: string };
type ClassificarState = { aberto: boolean; cardId?: string; colunaDestino?: string };

export default function Page() {
  const { sessao, loading, login, logout } = useAuth();
  const {
    cards,
    addCard,
    moveCardCommit,
    atribuirAnalista,
    atualizarMarcadores,
    editarCard,
    transferirChamadoMock,
  } = useCards();

  const [modalDetalheCardId, setModalDetalheCardId] = useState<string | null>(null);
  const [modalIndicadoresAberto, setModalIndicadoresAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ aberto: false });
  const [atribuir, setAtribuir] = useState<AtribuirState>({ aberto: false });
  const [classificar, setClassificar] = useState<ClassificarState>({ aberto: false });

  const cardModalDetalhe = useMemo(
    () => (modalDetalheCardId ? cards.find((c) => c.id === modalDetalheCardId) : null),
    [cards, modalDetalheCardId]
  );

  // Regras de movimentação:
  // - sem analista + destino != "transferido" → abre atribuir
  // - destino "concluido" + marcadores incompletos → abre classificar
  // - senão: commit direto
  const moveCard = useCallback(
    (cardId: string, colunaDestino: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.coluna === colunaDestino) return;

      // Não permite voltar para "Novo chamado" depois de sair
      if (colunaDestino === 'transferido') return;

      if (!card.analista && colunaDestino !== 'transferido') {
        setAtribuir({ aberto: true, cardId, colunaDestino });
        return;
      }

      if (colunaDestino === 'concluido' && marcadoresIncompletos(card)) {
        setClassificar({ aberto: true, cardId, colunaDestino });
        return;
      }

      moveCardCommit(cardId, colunaDestino);
    },
    [cards, moveCardCommit]
  );

  const confirmarAtribuir = useCallback(
    (analista: Membro) => {
      if (!atribuir.cardId || !atribuir.colunaDestino) return;
      const cardId = atribuir.cardId;
      const destino = atribuir.colunaDestino;

      atribuirAnalista(cardId, analista);
      setAtribuir({ aberto: false });

      // Após atribuir, ainda pode precisar classificar antes de concluir
      const card = cards.find((c) => c.id === cardId);
      if (destino === 'concluido' && card && marcadoresIncompletos(card)) {
        setClassificar({ aberto: true, cardId, colunaDestino: destino });
        return;
      }
      moveCardCommit(cardId, destino);
    },
    [atribuir, atribuirAnalista, cards, moveCardCommit]
  );

  const confirmarClassificar = useCallback(
    (marc: { tipo: string; categoria: string; subcategoria: string | null; motivo: string }) => {
      if (!classificar.cardId || !classificar.colunaDestino) return;
      const cardId = classificar.cardId;
      const destino = classificar.colunaDestino;
      atualizarMarcadores(cardId, marc);
      setClassificar({ aberto: false });
      moveCardCommit(cardId, destino);
    },
    [classificar, atualizarMarcadores, moveCardCommit]
  );

  const onSubmitDialog = useCallback(
    (data: DialogChamadoSubmitData) => {
      if (!dialog.aberto) return;

      if (dialog.modo === 'editar') {
        editarCard(dialog.cardId, {
          cliente: {
            nome: data.cliente.nome,
            ini: data.cliente.ini,
            idCliente: data.cliente.idCliente,
            telefone: data.cliente.telefone,
            email: data.cliente.email,
          },
          titulo: data.titulo,
          detalhamento: data.detalhamento,
          descricao: data.detalhamento,
          tipo: data.marcadores.tipo,
          categoria: data.marcadores.categoria,
          subcategoria: data.marcadores.subcategoria,
          motivo: data.marcadores.motivo,
          tags: data.tags,
          analista: data.analista,
          envolvidos: data.envolvidos,
          anexos: data.anexos,
          criadoEm: data.criadoEm,
          fechadoEm: data.fechadoEm,
        });
        const cardIdEditado = dialog.cardId;
        setDialog({ aberto: false });
        setModalDetalheCardId(cardIdEditado);
        return;
      }

      // Criação
      const novoNumero = '#' + String(1290 + cards.length).padStart(4, '0');
      const dataAbertura = data.criadoEm || isoCurto();
      const novoCard: Card = {
        id: 'ch' + Date.now(),
        numero: novoNumero,
        cliente: data.cliente,
        titulo: data.titulo,
        detalhamento: data.detalhamento,
        descricao: data.detalhamento,
        tipo: data.marcadores.tipo,
        categoria: data.marcadores.categoria,
        subcategoria: data.marcadores.subcategoria,
        motivo: data.marcadores.motivo,
        tags: data.tags,
        coluna: 'transferido',
        criadoEm: dataAbertura,
        fechadoEm: data.fechadoEm,
        motivoFechamento: null,
        analista: data.analista,
        envolvidos: data.envolvidos,
        anexos: data.anexos,
        ultimaMsg: 'Chamado recém aberto',
        timeline: [
          { data: dataAbertura, acao: 'Chamado aberto', col: 'transferido', autor: data.analista.nome },
        ],
      };
      addCard(novoCard);
      setDialog({ aberto: false });
    },
    [dialog, cards.length, addCard, editarCard]
  );

  const sair = useCallback(() => {
    setModalDetalheCardId(null);
    setModalIndicadoresAberto(false);
    setHistoricoAberto(false);
    setDialog({ aberto: false });
    setAtribuir({ aberto: false });
    setClassificar({ aberto: false });
    logout();
  }, [logout]);

  // Hidratação: evita flash de tela errada antes do useEffect ler localStorage
  if (loading) {
    return <div className="tela-login" />;
  }

  if (!sessao) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <>
      <TelaKanban
          colunas={COLUNAS}
          tags={TAGS}
          cards={cards}
          nomeUsuario={sessao.nome}
          onAbrirCard={(id) => setModalDetalheCardId(id)}
          onMoverCard={moveCard}
          onTransferirChamadoMock={transferirChamadoMock}
          onAbrirIndicadores={() => setModalIndicadoresAberto(true)}
          onAbrirNovoChamado={() => setDialog({ aberto: true, modo: 'criar', comOrigem: false })}
          onSair={sair}
        />

      {cardModalDetalhe && (
        <ModalDetalhe
          card={cardModalDetalhe}
          colunas={COLUNAS}
          tags={TAGS}
          onFechar={() => setModalDetalheCardId(null)}
          onEditar={() => setDialog({ aberto: true, modo: 'editar', cardId: cardModalDetalhe.id })}
          onMover={(colId) => moveCard(cardModalDetalhe.id, colId)}
          onAbrirHistorico={() => setHistoricoAberto(true)}
        />
      )}

      {modalIndicadoresAberto && (
        <ModalIndicadores
          cards={cards}
          colunas={COLUNAS}
          tags={TAGS}
          onFechar={() => setModalIndicadoresAberto(false)}
        />
      )}

      {atribuir.aberto && atribuir.cardId && atribuir.colunaDestino && (() => {
        const card = cards.find((c) => c.id === atribuir.cardId);
        const colunaDestino = COLUNAS.find((c) => c.id === atribuir.colunaDestino);
        if (!card || !colunaDestino) return null;
        return (
          <ModalAtribuirAnalista
            card={card}
            colunaDestino={colunaDestino}
            membros={TEAM.membros}
            onConfirmar={confirmarAtribuir}
            onFechar={() => setAtribuir({ aberto: false })}
          />
        );
      })()}

      {classificar.aberto && classificar.cardId && (() => {
        const card = cards.find((c) => c.id === classificar.cardId);
        if (!card) return null;
        return (
          <ModalClassificarMarcadores
            card={card}
            arvore={ARVORE}
            onConfirmar={confirmarClassificar}
            onFechar={() => setClassificar({ aberto: false })}
          />
        );
      })()}

      {dialog.aberto && (() => {
        const cardEditando =
          dialog.modo === 'editar' ? cards.find((c) => c.id === dialog.cardId) : null;
        return (
          <DialogChamado
            modo={dialog.modo}
            comOrigem={dialog.modo === 'criar' ? dialog.comOrigem : !!cardEditando?.transferidoPor}
            cardEditando={cardEditando}
            clientePadrao={CLIENTE_PADRAO}
            arvore={ARVORE}
            tags={TAGS}
            membros={TEAM.membros}
            membroAtualId={TEAM.atual}
            onFechar={() => setDialog({ aberto: false })}
            onSubmit={onSubmitDialog}
            onAbrirHistorico={() => setHistoricoAberto(true)}
          />
        );
      })()}

      {historicoAberto && (
        <ModalHistorico
          cliente={CLIENTE_PADRAO}
          conversa={CONVERSA}
          onFechar={() => setHistoricoAberto(false)}
        />
      )}
    </>
  );
}
