'use client';

import { useEffect } from 'react';
import type { Card, Coluna, Tag, EventoTimeline } from '@/lib/types';
import { fmt, fmtLongo, formatBytes } from '@/lib/utils';

interface ModalDetalheProps {
  card: Card;
  colunas: Coluna[];
  tags: Tag[];
  onFechar: () => void;
  onEditar: () => void;
  onMover: (colunaId: string) => void;
  onAbrirHistorico: () => void;
}

export function ModalDetalhe({
  card: c,
  colunas,
  tags,
  onFechar,
  onEditar,
  onMover,
  onAbrirHistorico,
}: ModalDetalheProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onFechar]);

  const corCol = (id: string) => colunas.find((c) => c.id === id)?.cor || '#737373';
  const tituloCol = (id: string) => colunas.find((c) => c.id === id)?.titulo || id;
  const tagPorId = (id: string) => tags.find((t) => t.id === id);

  const tagsRender = (c.tags || [])
    .map((id) => tagPorId(id))
    .filter(Boolean)
    .map((t) => (
      <span key={t!.id} className="tag-chip" style={{ background: `${t!.cor}20`, color: t!.cor }}>
        {t!.nome}
      </span>
    ));

  const marcadoresParts: string[] = [];
  if (c.categoria) marcadoresParts.push(c.categoria);
  if (c.subcategoria) marcadoresParts.push(c.subcategoria);
  if (c.motivo) marcadoresParts.push(c.motivo);

  const detalhamento = c.detalhamento || c.descricao || '—';

  return (
    <div className="overlay op" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal modal-detalhe">
        <div className="m-head">
          <div className="m-head-info">
            <span className="m-numero">{c.numero || ''}</span>
            <p className="m-titulo">{c.titulo}</p>
            <div className="m-status-row">
              <span className="m-status" data-id={c.coluna}>
                <span className="col-dot" />
                {tituloCol(c.coluna)}
              </span>
              {c.tipo ? (
                <span className="card-tipo" data-tipo={c.tipo}>{c.tipo}</span>
              ) : (
                <span className="card-tipo" data-tipo="sem-class">sem classificação</span>
              )}
            </div>
          </div>
          <button className="m-edit" onClick={onEditar} aria-label="Editar" title="Editar chamado">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="m-x" onClick={onFechar} aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div className="m-body">
          <div className="m-col-main">
            <DetalheCliente c={c} />
            <div className="m-section">
              <h3>Detalhamento</h3>
              <div className="m-msg">{detalhamento}</div>
            </div>
            {c.anexos && c.anexos.length > 0 && <DetalheAnexos anexos={c.anexos} />}
            <div className="m-section">
              <h3>Marcadores</h3>
              <div className="m-marcadores">
                {marcadoresParts.length > 0
                  ? marcadoresParts.map((p, i) => (
                      <span key={i} style={{ display: 'contents' }}>
                        <span className="marc">{p}</span>
                        {i < marcadoresParts.length - 1 && <span className="sep">→</span>}
                      </span>
                    ))
                  : <span className="m-marcadores-vazio">⏱ aguardando classificação</span>}
              </div>
              {tagsRender.length > 0 && <div className="m-tags" style={{ marginTop: 8 }}>{tagsRender}</div>}
            </div>
            <DetalheDatas c={c} onAbrirHistorico={onAbrirHistorico} />
            <div className="m-section">
              <h3>Solicitante</h3>
              {c.analista ? (
                <div className="m-people">
                  <span className="chip">
                    <span className="cav">{c.analista.ini}</span>
                    {c.analista.nome}
                  </span>
                </div>
              ) : (
                <div className="m-people-empty" style={{ color: '#f87171', fontStyle: 'normal', fontSize: 11.5 }}>
                  ⚠ sem responsável — atribua ao mover de &quot;Transferido&quot;
                </div>
              )}
            </div>
            <div className="m-section">
              <h3>Envolvidos</h3>
              <div className="m-people">
                {c.envolvidos && c.envolvidos.length > 0
                  ? c.envolvidos.map((p) => (
                      <span key={p.id} className="chip">
                        <span className="cav">{p.ini}</span>
                        {p.nome}
                      </span>
                    ))
                  : <span className="m-people-empty">nenhum envolvido</span>}
              </div>
            </div>
          </div>

          <div className="m-col-side">
            <div className="m-section">
              <h3>Histórico de movimentação</h3>
              <div className="tl">
                {c.timeline.map((ev, i) => (
                  <TimelineItem key={i} ev={ev} corCol={corCol} tituloCol={tituloCol} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="m-footer">
          <p className="m-footer-lbl">Mover para</p>
          <div className="m-actions">
            {colunas.map((col) => {
              const atual = col.id === c.coluna;
              return (
                <button
                  key={col.id}
                  className={`m-action${atual ? ' atual' : ''}`}
                  disabled={atual}
                  onClick={() => !atual && onMover(col.id)}
                >
                  <span className="col-dot" style={{ background: corCol(col.id) }} />
                  {col.titulo}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────

function DetalheCliente({ c }: { c: Card }) {
  return (
    <div className="m-section">
      <h3>Cliente</h3>
      <div className="m-cliente">
        <div className="m-cliente-av">{c.cliente.ini}</div>
        <div className="m-cliente-info">
          <p className="m-cliente-nome">{c.cliente.nome}</p>
          {c.cliente.plataforma && <span className="m-cliente-meta">{c.cliente.plataforma}</span>}
        </div>
      </div>
      <div className="m-meta" style={{ marginTop: 8 }}>
        <div className="m-meta-item"><div className="lbl">ID</div><div className="val">{c.cliente.idCliente || '—'}</div></div>
        <div className="m-meta-item"><div className="lbl">Telefone</div><div className="val">{c.cliente.telefone || '—'}</div></div>
        <div className="m-meta-item"><div className="lbl">Email</div><div className="val">{c.cliente.email || '—'}</div></div>
        {c.cliente.cpfCnpj && (
          <div className="m-meta-item"><div className="lbl">CPF / CNPJ</div><div className="val">{c.cliente.cpfCnpj}</div></div>
        )}
      </div>
    </div>
  );
}

function DetalheAnexos({ anexos }: { anexos: Card['anexos'] }) {
  return (
    <div className="m-section">
      <h3>Anexos</h3>
      <ul className="anexos-list" style={{ display: 'flex', flexDirection: 'column', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
        {anexos.map((a, i) => {
          const meta = formatBytes(a.tamanho) + (a.tipo ? ' · ' + a.tipo : '');
          return (
            <li className="anexo-item" key={i}>
              <span className="anexo-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <span className="anexo-info">
                <div className="anexo-nome">{a.nome}</div>
                <div className="anexo-meta">{meta}</div>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DetalheDatas({ c, onAbrirHistorico }: { c: Card; onAbrirHistorico: () => void }) {
  return (
    <div className="m-section">
      <h3>Datas</h3>
      <div className="m-meta">
        <div className="m-meta-item">
          <div className="lbl">Aberto em</div>
          <div className="val">{fmtLongo(c.criadoEm)}</div>
        </div>
        {c.fechadoEm ? (
          <div className="m-meta-item">
            <div className="lbl">Fechado em</div>
            <div className="val">
              {fmtLongo(c.fechadoEm)}{' '}
              {c.motivoFechamento && <span style={{ color: '#737373' }}>· {c.motivoFechamento}</span>}
            </div>
          </div>
        ) : (
          <div className="m-meta-item">
            <div className="lbl">Fechado em</div>
            <div className="val" style={{ color: '#737373' }}>em aberto</div>
          </div>
        )}
        {c.transferidoPor && (
          <div className="m-meta-item">
            <div className="lbl">Transferido por</div>
            <div className="val">{c.transferidoPor}</div>
          </div>
        )}
      </div>
      <button className="m-link-conversa" onClick={onAbrirHistorico} style={{ marginTop: 8 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Ver conversa completa
      </button>
    </div>
  );
}

function TimelineItem({
  ev,
  corCol,
  tituloCol,
}: {
  ev: EventoTimeline;
  corCol: (id: string) => string;
  tituloCol: (id: string) => string;
}) {
  const cor = corCol(ev.col);
  const incluiTransferido = /transferid/i.test(ev.acao);
  return (
    <div className="tl-item">
      <span className="tl-dot" style={{ background: cor }} />
      <div className="tl-content">
        <div className="tl-titulo">
          {ev.acao}{' '}
          {!incluiTransferido && (
            <span className="col-name" style={{ color: cor }}>{tituloCol(ev.col)}</span>
          )}{' '}
          <span style={{ color: '#737373' }}>por {ev.autor}</span>
        </div>
        <div className="tl-data">{fmt(ev.data)}</div>
      </div>
    </div>
  );
}
