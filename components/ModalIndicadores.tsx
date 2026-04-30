'use client';

import { useEffect, useMemo } from 'react';
import type { Card, Coluna, Tag } from '@/lib/types';
import { COR_POR_TIPO } from '@/lib/config';

interface ModalIndicadoresProps {
  cards: Card[];
  colunas: Coluna[];
  tags: Tag[];
  onFechar: () => void;
}

interface BarItem {
  label: string;
  valor: number;
  cor: string;
}

export function ModalIndicadores({ cards, colunas, tags, onFechar }: ModalIndicadoresProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onFechar]);

  // ── Cálculos de agregação ──────────────────────────────────────
  const indicadores = useMemo(() => {
    const total = cards.length;
    const emAberto = cards.filter((c) => !['concluido', 'cancelado'].includes(c.coluna)).length;
    const concluidos = cards.filter((c) => c.coluna === 'concluido').length;
    const cancelados = cards.filter((c) => c.coluna === 'cancelado').length;
    const fechados = concluidos + cancelados;
    const taxaResolucao = fechados > 0 ? Math.round((concluidos / fechados) * 100) : 0;

    const porStatus: BarItem[] = colunas.map((col) => ({
      label: col.titulo,
      valor: cards.filter((c) => c.coluna === col.id).length,
      cor: col.cor,
    }));

    const porTipo: BarItem[] = (['Problema', 'Dúvida', 'Solicitação'] as const)
      .map((t) => ({
        label: t,
        valor: cards.filter((c) => c.tipo === t).length,
        cor: COR_POR_TIPO[t] || '#737373',
      }))
      .filter((t) => t.valor > 0);

    const porTag: BarItem[] = tags.map((t) => ({
      label: t.nome,
      valor: cards.filter((c) => (c.tags || []).includes(t.id)).length,
      cor: t.cor,
    }));

    // Top categorias
    const catCount: Record<string, number> = {};
    cards.forEach((c) => {
      if (c.categoria) catCount[c.categoria] = (catCount[c.categoria] || 0) + 1;
    });
    const topCategorias: BarItem[] = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([nome, valor]) => ({ label: nome, valor, cor: '#2ECDA7' }));

    // Top motivos
    const motCount: Record<string, number> = {};
    cards.forEach((c) => {
      if (c.motivo) motCount[c.motivo] = (motCount[c.motivo] || 0) + 1;
    });
    const topMotivos: BarItem[] = Object.entries(motCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, valor]) => ({ label: nome, valor, cor: '#93c5fd' }));

    return {
      total,
      emAberto,
      concluidos,
      cancelados,
      fechados,
      taxaResolucao,
      porStatus,
      porTipo,
      porTag,
      topCategorias,
      topMotivos,
    };
  }, [cards, colunas, tags]);

  return (
    <div
      className="indi-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="indi-modal">
        <div className="indi-modal-head">
          <div>
            <p className="indi-modal-titulo">Indicadores</p>
            <span className="indi-modal-sub">Suporte Integrado · CRMLiguer</span>
          </div>
          <button className="icon-btn" onClick={onFechar} aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="indi-modal-body">
          {/* KPIs */}
          <div className="kpi-row">
            <KpiCard label="Total de chamados" valor={indicadores.total} />
            <KpiCard label="Em aberto" valor={indicadores.emAberto} sub="ativos no momento" classe="warn" />
            <KpiCard label="Concluídos" valor={indicadores.concluidos} sub="resolvidos" classe="acc" />
            <KpiCard label="Cancelados" valor={indicadores.cancelados} sub="duplicados ou inválidos" classe="danger" />
          </div>

          <div className="indi-grid">
            <SectionBars titulo="Distribuição por status" meta="fluxo do chamado" dados={indicadores.porStatus} comDot />
            <SectionDonut titulo="Por tipo de chamado" dados={indicadores.porTipo} />
          </div>

          <div className="indi-grid">
            <SectionBars titulo="Por tag" meta="etiquetas do chamado" dados={indicadores.porTag} />
            <SectionBars titulo="Top categorias" meta="marcadores mais frequentes" dados={indicadores.topCategorias} />
          </div>

          <div className="indi-grid">
            <SectionBars titulo="Top motivos" meta="razão dos chamados" dados={indicadores.topMotivos} />
            <SectionResolucao
              taxa={indicadores.taxaResolucao}
              concluidos={indicadores.concluidos}
              cancelados={indicadores.cancelados}
              fechados={indicadores.fechados}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponentes ──────────────────────────────────────────────────

function KpiCard({ label, valor, sub, classe }: { label: string; valor: number; sub?: string; classe?: string }) {
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value${classe ? ' ' + classe : ''}`}>{valor}</span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}

function SectionBars({
  titulo,
  meta,
  dados,
  comDot = false,
}: {
  titulo: string;
  meta: string;
  dados: BarItem[];
  comDot?: boolean;
}) {
  const total = dados.reduce((acc, d) => acc + d.valor, 0);
  const max = Math.max(...dados.map((d) => d.valor), 1);

  if (total === 0) {
    return (
      <div className="indi-section">
        <p className="indi-titulo">
          {titulo}
          <span className="indi-meta">{meta}</span>
        </p>
        <div className="indi-empty">sem dados</div>
      </div>
    );
  }

  return (
    <div className="indi-section">
      <p className="indi-titulo">
        {titulo}
        <span className="indi-meta">{meta}</span>
      </p>
      <div className="bar-list">
        {dados.map((d, i) => {
          const pct = max > 0 ? (d.valor / max) * 100 : 0;
          return (
            <div className="bar-row" key={i}>
              <span className="bar-label">
                {comDot && <span className="col-dot" style={{ background: d.cor }} />}
                {d.label}
              </span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: d.cor }} />
              </div>
              <span className="bar-value">{d.valor}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionDonut({ titulo, dados }: { titulo: string; dados: BarItem[] }) {
  const total = dados.reduce((acc, d) => acc + d.valor, 0);

  if (total === 0) {
    return (
      <div className="indi-section">
        <p className="indi-titulo">
          {titulo}
          <span className="indi-meta">{dados.length} categorias</span>
        </p>
        <div className="indi-empty">sem dados</div>
      </div>
    );
  }

  let cum = 0;
  const stops = dados
    .map((d) => {
      const start = cum;
      cum += (d.valor / total) * 100;
      return `${d.cor} ${start}% ${cum}%`;
    })
    .join(', ');

  return (
    <div className="indi-section">
      <p className="indi-titulo">
        {titulo}
        <span className="indi-meta">{dados.length} {dados.length === 1 ? 'categoria' : 'categorias'}</span>
      </p>
      <div className="donut-wrap">
        <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
          <div className="donut-center">
            <span className="donut-center-num">{total}</span>
            <span className="donut-center-lbl">total</span>
          </div>
        </div>
        <div className="donut-legend">
          {dados.map((d, i) => {
            const pct = ((d.valor / total) * 100).toFixed(0);
            return (
              <div className="donut-legend-item" key={i}>
                <span className="donut-legend-dot" style={{ background: d.cor }} />
                <span className="donut-legend-label">{d.label}</span>
                <span className="donut-legend-value">{d.valor}</span>
                <span className="donut-legend-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionResolucao({
  taxa,
  concluidos,
  cancelados,
  fechados,
}: {
  taxa: number;
  concluidos: number;
  cancelados: number;
  fechados: number;
}) {
  if (fechados === 0) {
    return (
      <div className="indi-section">
        <p className="indi-titulo">
          Taxa de resolução
          <span className="indi-meta">chamados fechados</span>
        </p>
        <div className="indi-empty">nenhum chamado fechado ainda</div>
      </div>
    );
  }

  const stops = `#2ECDA7 0% ${taxa}%, #f87171 ${taxa}% 100%`;

  return (
    <div className="indi-section">
      <p className="indi-titulo">
        Taxa de resolução
        <span className="indi-meta">{fechados} fechados</span>
      </p>
      <div className="donut-wrap">
        <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
          <div className="donut-center">
            <span className="donut-center-num">{taxa}%</span>
            <span className="donut-center-lbl">resolvidos</span>
          </div>
        </div>
        <div className="donut-legend">
          <div className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: '#2ECDA7' }} />
            <span className="donut-legend-label">Concluídos</span>
            <span className="donut-legend-value">{concluidos}</span>
          </div>
          <div className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: '#f87171' }} />
            <span className="donut-legend-label">Cancelados</span>
            <span className="donut-legend-value">{cancelados}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
