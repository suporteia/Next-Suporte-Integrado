'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card, ClientePadrao, Membro, Tag, TipoArvore, Anexo } from '@/lib/types';
import {
  calcIniciais,
  emailValido,
  formatBytes,
  isoLocalAgora,
  mascaraId4,
  mascaraTelefone,
  toInputDateTime,
} from '@/lib/utils';
import { MarcadoresSelects, type MarcadoresValue } from './MarcadoresSelects';

type Modo = 'criar' | 'editar';

export interface DialogChamadoSubmitData {
  cliente: { nome: string; ini: string; idCliente: string; telefone: string; email: string };
  titulo: string;
  detalhamento: string;
  marcadores: { tipo: string | null; categoria: string | null; subcategoria: string | null; motivo: string | null };
  tags: string[];
  analista: Membro;
  envolvidos: Membro[];
  anexos: Anexo[];
  criadoEm: string;
  fechadoEm: string | null;
}

interface DialogChamadoProps {
  modo: Modo;
  /** Quando comOrigem=true, mostra a seção "ChatLiguer · transferência" e
   *  o botão de ver histórico. */
  comOrigem: boolean;
  cardEditando?: Card | null;
  /** Cliente pré-preenchido no modo "criar com origem". */
  clientePadrao?: ClientePadrao;
  arvore: TipoArvore[];
  tags: Tag[];
  membros: Membro[];
  /** ID do membro que vira solicitante padrão (state.teamConfig.atual). */
  membroAtualId: string;
  onFechar: () => void;
  onSubmit: (data: DialogChamadoSubmitData) => void;
  onAbrirHistorico: () => void;
}

export function DialogChamado({
  modo,
  comOrigem,
  cardEditando,
  clientePadrao,
  arvore,
  tags,
  membros,
  membroAtualId,
  onFechar,
  onSubmit,
  onAbrirHistorico,
}: DialogChamadoProps) {
  const ehEdicao = modo === 'editar';

  // ── Inicializa do card (edição) ou padrões (criação) ──────────────
  const inicial = useMemo(() => {
    if (ehEdicao && cardEditando) {
      return {
        nome: cardEditando.cliente.nome || '',
        idCliente: cardEditando.cliente.idCliente || '',
        telefone: cardEditando.cliente.telefone || '',
        email: cardEditando.cliente.email || '',
        titulo: cardEditando.titulo || '',
        detalhamento: cardEditando.detalhamento || cardEditando.descricao || '',
        criadoEm: toInputDateTime(cardEditando.criadoEm) || isoLocalAgora(),
        fechadoEm: toInputDateTime(cardEditando.fechadoEm) || '',
        analista: cardEditando.analista,
        envolvidos: [...cardEditando.envolvidos],
        tagsSelecionadas: [...cardEditando.tags],
        anexos: [...(cardEditando.anexos || [])],
        tipo: cardEditando.tipo || '',
        categoria: cardEditando.categoria || '',
        subcategoria: cardEditando.subcategoria || '',
        motivo: cardEditando.motivo || '',
      };
    }
    if (comOrigem && clientePadrao) {
      return {
        nome: clientePadrao.nome,
        idCliente: clientePadrao.id,
        telefone: clientePadrao.telefone,
        email: clientePadrao.email,
        titulo: '',
        detalhamento: '',
        criadoEm: isoLocalAgora(),
        fechadoEm: '',
        analista: membros.find((m) => m.id === membroAtualId) || null,
        envolvidos: [] as Membro[],
        tagsSelecionadas: ['suporte'] as string[],
        anexos: [] as Anexo[],
        tipo: '',
        categoria: '',
        subcategoria: '',
        motivo: '',
      };
    }
    return {
      nome: '',
      idCliente: '',
      telefone: '',
      email: '',
      titulo: '',
      detalhamento: '',
      criadoEm: isoLocalAgora(),
      fechadoEm: '',
      analista: membros.find((m) => m.id === membroAtualId) || null,
      envolvidos: [] as Membro[],
      tagsSelecionadas: ['suporte'] as string[],
      anexos: [] as Anexo[],
      tipo: '',
      categoria: '',
      subcategoria: '',
      motivo: '',
    };
  }, [ehEdicao, cardEditando, comOrigem, clientePadrao, membros, membroAtualId]);

  // ── State do form ──────────────────────────────────────────────────
  const [nome, setNome] = useState(inicial.nome);
  const [idCliente, setIdCliente] = useState(inicial.idCliente);
  const [telefone, setTelefone] = useState(inicial.telefone);
  const [email, setEmail] = useState(inicial.email);
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [detalhamento, setDetalhamento] = useState(inicial.detalhamento);
  const [criadoEm, setCriadoEm] = useState(inicial.criadoEm);
  const [fechadoEm, setFechadoEm] = useState(inicial.fechadoEm);
  const [analista, setAnalista] = useState<Membro | null>(inicial.analista);
  const [envolvidos, setEnvolvidos] = useState<Membro[]>(inicial.envolvidos);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>(inicial.tagsSelecionadas);
  const [anexos, setAnexos] = useState<Anexo[]>(inicial.anexos);

  const [marcadores, setMarcadores] = useState<MarcadoresValue>({
    tipo: inicial.tipo,
    categoria: inicial.categoria,
    subcategoria: inicial.subcategoria,
    motivo: inicial.motivo,
    subDisabled: false,
  });

  const [erros, setErros] = useState<Record<string, string>>({});
  const [jaValidouUmaVez, setJaValidouUmaVez] = useState(false);
  const [mostrarPopAnalista, setMostrarPopAnalista] = useState(false);
  const [mostrarPopEnvolvidos, setMostrarPopEnvolvidos] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dlgBodyRef = useRef<HTMLDivElement>(null);

  // ESC fecha (mas não quando popovers/historico abertos — isso é tratado nos pais)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onFechar]);

  // Scroll no topo ao abrir
  useEffect(() => {
    if (dlgBodyRef.current) dlgBodyRef.current.scrollTop = 0;
  }, []);

  // ── Validação ──────────────────────────────────────────────────────
  const validar = (): { ok: boolean; novosErros: Record<string, string>; pendentes: number } => {
    const novosErros: Record<string, string> = {};

    if (nome.trim().length < 2) novosErros.nome = 'Nome do cliente é obrigatório.';
    if (!/^\d{4}$/.test(idCliente.trim())) novosErros.idCliente = 'ID precisa ter 4 dígitos.';
    if (telefone.trim().length === 0) novosErros.telefone = 'Telefone é obrigatório.';

    const emailVal = email.trim();
    if (emailVal === '') novosErros.email = 'Email é obrigatório.';
    else if (!emailValido(emailVal)) novosErros.email = 'Formato de email inválido.';

    if (titulo.trim().length === 0) novosErros.titulo = 'Título é obrigatório.';
    if (detalhamento.trim().length === 0) novosErros.detalhamento = 'Detalhamento é obrigatório.';

    if (criadoEm.trim().length === 0) novosErros.criadoEm = 'Data de abertura é obrigatória.';

    if (fechadoEm && criadoEm && fechadoEm < criadoEm) {
      novosErros.fechadoEm = 'Fechamento não pode ser antes da abertura.';
    }

    if (!analista) novosErros.analista = 'Solicitante';

    // Em modo edição os marcadores são opcionais (podem ser preenchidos
    // depois, ou serão exigidos automaticamente ao mover pra "Concluído").
    if (!ehEdicao) {
      const faltam: string[] = [];
      if (!marcadores.tipo) faltam.push('tipo');
      if (!marcadores.categoria) faltam.push('categoria');
      if (!marcadores.subDisabled && !marcadores.subcategoria) faltam.push('subcategoria');
      if (!marcadores.motivo) faltam.push('motivo');
      if (faltam.length > 0) novosErros.marcadores = 'Preencha: ' + faltam.join(', ') + '.';
    }

    if (tagsSelecionadas.length === 0) novosErros.tags = 'Selecione ao menos uma tag.';

    const pendentes = Object.keys(novosErros).length;
    return { ok: pendentes === 0, novosErros, pendentes };
  };

  // Re-valida em tempo real depois do primeiro submit
  useEffect(() => {
    if (jaValidouUmaVez) {
      const r = validar();
      setErros(r.novosErros);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome, idCliente, telefone, email, titulo, detalhamento, criadoEm, fechadoEm, analista, envolvidos, tagsSelecionadas, marcadores]);

  const handleSubmit = () => {
    setJaValidouUmaVez(true);
    const r = validar();
    setErros(r.novosErros);
    if (!r.ok) return;

    onSubmit({
      cliente: {
        nome: nome.trim(),
        ini: calcIniciais(nome.trim()),
        idCliente: idCliente.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
      },
      titulo: titulo.trim(),
      detalhamento: detalhamento.trim(),
      marcadores: {
        tipo: marcadores.tipo || null,
        categoria: marcadores.categoria || null,
        subcategoria: marcadores.subDisabled || !marcadores.subcategoria ? null : marcadores.subcategoria,
        motivo: marcadores.motivo || null,
      },
      tags: [...tagsSelecionadas],
      analista: analista!,
      envolvidos: [...envolvidos],
      anexos: [...anexos],
      criadoEm: criadoEm || isoLocalAgora(),
      fechadoEm: fechadoEm || null,
    });
  };

  // Anexos
  const onSelecionarArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(e.target.files || []);
    const novos: Anexo[] = arquivos.map((f) => ({ nome: f.name, tamanho: f.size, tipo: f.type || '' }));
    setAnexos((a) => [...a, ...novos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removerAnexo = (idx: number) => {
    setAnexos((a) => a.filter((_, i) => i !== idx));
  };

  // ── Membros disponíveis pro popover (excluindo já escolhidos) ──────
  const membrosParaAnalista = membros.filter(
    (p) => (!analista || p.id !== analista.id) && !envolvidos.find((e) => e.id === p.id)
  );
  const membrosParaEnvolvidos = membros.filter(
    (p) => (!analista || p.id !== analista.id) && !envolvidos.find((e) => e.id === p.id)
  );

  const totalErros = Object.keys(erros).length;

  // Origem
  const veioDeTransferencia = ehEdicao
    ? !!cardEditando?.transferidoPor || (cardEditando?.timeline || []).some((ev) => /transferid/i.test(ev.acao))
    : comOrigem;

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="dlg">
        {/* Head */}
        <section className="sec dlg-head">
          <div>
            <p className="dlg-title">
              {ehEdicao ? `Editar chamado ${cardEditando?.numero || ''}` : (comOrigem ? 'Abrir chamado' : 'Abrir chamado direto')}
            </p>
            <span className="dlg-sub">
              {ehEdicao ? 'Atualize os dados do chamado' : 'Suporte Integrado · CRMLiguer'}
            </span>
          </div>
          <button className="icon-btn" type="button" aria-label="Fechar" onClick={onFechar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </section>

        {/* Body */}
        <div className="dlg-body" ref={dlgBodyRef}>
          {/* Bloco: Contexto */}
          <div className="bloco">
            <div className="bloco-head">
              <p className="bloco-titulo">Contexto</p>
              <span className="bloco-sub">quem é o cliente e de onde vem</span>
            </div>
            <section className="sec">
              <div className="cliente-row">
                <div className="client-av">{calcIniciais(nome) || '—'}</div>
                <div className="cliente-nome-wrap">
                  <p className="lbl">Nome do cliente <span className="req">*</span></p>
                  <input
                    className={`inp${erros.nome ? ' invalid' : ''}`}
                    placeholder="Nome completo"
                    autoComplete="off"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  {erros.nome && <p className="err">{erros.nome}</p>}
                </div>
              </div>

              <div className="row">
                <div>
                  <p className="lbl">ID do cliente <span className="req">*</span></p>
                  <input
                    className={`inp${erros.idCliente ? ' invalid' : ''}`}
                    placeholder="0001"
                    inputMode="numeric"
                    maxLength={4}
                    value={idCliente}
                    onChange={(e) => setIdCliente(mascaraId4(e.target.value))}
                  />
                  {erros.idCliente && <p className="err">{erros.idCliente}</p>}
                </div>
                <div>
                  <p className="lbl">Telefone <span className="req">*</span></p>
                  <input
                    className={`inp${erros.telefone ? ' invalid' : ''}`}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    maxLength={15}
                    value={telefone}
                    onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                  />
                  {erros.telefone && <p className="err">{erros.telefone}</p>}
                </div>
              </div>

              <div className="campo-full">
                <p className="lbl">Email <span className="req">*</span></p>
                <input
                  className={`inp${erros.email ? ' invalid' : ''}`}
                  type="email"
                  placeholder="cliente@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {erros.email && <p className="err">{erros.email}</p>}
              </div>
            </section>
          </div>

          {/* Bloco: Conteúdo */}
          <div className="bloco">
            <div className="bloco-head">
              <p className="bloco-titulo">Conteúdo</p>
              <span className="bloco-sub">o que aconteceu, quando e quem cuida</span>
            </div>

            <section className="sec">
              <p className="lbl">Título do chamado <span className="req">*</span></p>
              <input
                className={`inp${erros.titulo ? ' invalid' : ''}`}
                placeholder="Ex: Webhook não chega após configurar integração"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              {erros.titulo && <p className="err">{erros.titulo}</p>}
            </section>

            <section className="sec">
              <p className="lbl">Detalhamento <span className="req">*</span></p>
              <textarea
                className={`tx${erros.detalhamento ? ' invalid' : ''}`}
                placeholder="Descreva o que aconteceu, o que foi tentado, próximos passos..."
                value={detalhamento}
                onChange={(e) => setDetalhamento(e.target.value)}
              />
              {erros.detalhamento && <p className="err">{erros.detalhamento}</p>}
            </section>

            <section className="sec">
              <p className="lbl">Anexos <span className="lbl-opt">(opcional)</span></p>
              <div className="anexos-wrap">
                <ul className="anexos-list">
                  {anexos.map((a, idx) => (
                    <li className="anexo-item" key={idx}>
                      <span className="anexo-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </span>
                      <span className="anexo-info">
                        <div className="anexo-nome">{a.nome}</div>
                        <div className="anexo-meta">
                          {formatBytes(a.tamanho)}{a.tipo ? ' · ' + a.tipo : ''}
                        </div>
                      </span>
                      <button
                        className="anexo-remove"
                        type="button"
                        aria-label="Remover anexo"
                        onClick={() => removerAnexo(idx)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="6" y1="6" x2="18" y2="18" />
                          <line x1="18" y1="6" x2="6" y2="18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
                <label className="anexos-add" onClick={() => fileInputRef.current?.click()}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  <span>Anexar arquivos</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={onSelecionarArquivos}
                />
                <p className="anexos-hint">
                  {anexos.length === 0
                    ? 'Nenhum arquivo anexado'
                    : `${anexos.length} ${anexos.length === 1 ? 'arquivo anexado' : 'arquivos anexados'}`}
                </p>
              </div>
            </section>

            <section className="sec">
              <div className="row">
                <div>
                  <p className="lbl">Data e hora de abertura <span className="req">*</span></p>
                  <input
                    className={`inp${erros.criadoEm ? ' invalid' : ''}`}
                    type="datetime-local"
                    value={criadoEm}
                    onChange={(e) => setCriadoEm(e.target.value)}
                  />
                  {erros.criadoEm && <p className="err">{erros.criadoEm}</p>}
                </div>
                <div>
                  <p className="lbl">Data e hora de fechamento <span className="lbl-opt">(opcional)</span></p>
                  <input
                    className={`inp${erros.fechadoEm ? ' invalid' : ''}`}
                    type="datetime-local"
                    value={fechadoEm}
                    onChange={(e) => setFechadoEm(e.target.value)}
                  />
                  {erros.fechadoEm && <p className="err">{erros.fechadoEm}</p>}
                </div>
              </div>
            </section>

            <section className="sec">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div>
                  <p className="lbl">Solicitante <span className="req">*</span></p>
                  <div id="analista-slot" style={{ position: 'relative' }}>
                    {analista ? (
                      <span className="chip">
                        <button
                          className="chip-x"
                          type="button"
                          title="Trocar"
                          onClick={(e) => { e.stopPropagation(); setMostrarPopAnalista(true); }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="6" y1="6" x2="18" y2="18" />
                            <line x1="18" y1="6" x2="6" y2="18" />
                          </svg>
                        </button>
                        <span className="cav">{analista.ini}</span>
                        {analista.nome}
                      </span>
                    ) : (
                      <span className="analista-empty">solicitante obrigatório</span>
                    )}
                    {mostrarPopAnalista && (
                      <PopMenu
                        items={membrosParaAnalista}
                        onPick={(m) => { setAnalista(m); setMostrarPopAnalista(false); }}
                        onClose={() => setMostrarPopAnalista(false)}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <p className="lbl">Envolvidos <span className="lbl-opt">(opcional)</span></p>
                  <div className="envolvidos-row" style={{ position: 'relative' }}>
                    {envolvidos.map((p) => (
                      <span className="chip" key={p.id}>
                        <button
                          className="chip-x"
                          type="button"
                          title="Remover"
                          onClick={() => setEnvolvidos((arr) => arr.filter((x) => x.id !== p.id))}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="6" y1="6" x2="18" y2="18" />
                            <line x1="18" y1="6" x2="6" y2="18" />
                          </svg>
                        </button>
                        <span className="cav">{p.ini}</span>
                        {p.nome}
                      </span>
                    ))}
                    <button
                      className="add"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setMostrarPopEnvolvidos(true); }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Adicionar</span>
                    </button>
                    {mostrarPopEnvolvidos && (
                      <PopMenu
                        items={membrosParaEnvolvidos}
                        onPick={(m) => { setEnvolvidos((arr) => [...arr, m]); setMostrarPopEnvolvidos(false); }}
                        onClose={() => setMostrarPopEnvolvidos(false)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Origem */}
            <section className="sec sec-origem">
              <div className="row">
                <div>
                  <p className="lbl">Origem</p>
                  <div className="readonly">
                    {veioDeTransferencia ? 'ChatLiguer · transferência' : 'Suporte Integrado'}
                  </div>
                </div>
                <div></div>
              </div>
              {veioDeTransferencia && false && (
                <button className="btn-link" type="button" onClick={onAbrirHistorico}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Ver conversa completa
                </button>
              )}
            </section>
          </div>

          {/* Bloco: Classificação */}
          <div className="bloco">
            <div className="bloco-head">
              <p className="bloco-titulo">Classificação</p>
              <span className="bloco-sub">marcadores e tags pra organizar a fila</span>
            </div>
            <section className="sec">
              <p className="lbl">Marcadores <span className="req">*</span></p>
              <MarcadoresSelects
                arvore={arvore}
                initial={{
                  tipo: inicial.tipo,
                  categoria: inicial.categoria,
                  subcategoria: inicial.subcategoria,
                  motivo: inicial.motivo,
                }}
                onChange={setMarcadores}
                showInvalid={jaValidouUmaVez && !ehEdicao}
                idPrefix="s"
              />
              {erros.marcadores && <p className="err">{erros.marcadores}</p>}
            </section>

            <section className="sec">
              <p className="lbl">Tags <span className="req">*</span></p>
              <div className={`tags-pick${erros.tags ? ' invalid' : ''}`}>
                {tags.map((t) => {
                  const ativo = tagsSelecionadas.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`tag-pick-btn${ativo ? ' ativo' : ''}`}
                      style={{ ['--tag-cor' as never]: t.cor } as React.CSSProperties}
                      onClick={() =>
                        setTagsSelecionadas((arr) =>
                          arr.includes(t.id) ? arr.filter((x) => x !== t.id) : [...arr, t.id]
                        )
                      }
                    >
                      {t.nome}
                    </button>
                  );
                })}
              </div>
              {erros.tags && <p className="err">{erros.tags}</p>}
            </section>
          </div>
        </div>

        {/* Footer */}
        <section className="sec footer">
          <span className="footer-msg">
            {totalErros === 0 ? '' : totalErros === 1 ? '1 campo pendente' : `${totalErros} campos pendentes`}
          </span>
          <button className="bo" type="button" onClick={onFechar}>Cancelar</button>
          <button className="bp" type="button" onClick={handleSubmit}>
            {ehEdicao ? 'Salvar alterações' : 'Abrir chamado'}
          </button>
        </section>
      </div>
    </div>
  );
}

// ── PopMenu inline (controlado por state, não DOM imperativo) ─────────
function PopMenu({
  items,
  onPick,
  onClose,
}: {
  items: Membro[];
  onPick: (m: Membro) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const id = setTimeout(() => document.addEventListener('click', onDocClick), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', onDocClick);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="pop-menu op" style={{ top: 'calc(100% + 4px)', left: 0 }}>
      {items.length === 0 ? (
        <div className="pop-empty">sem opções disponíveis</div>
      ) : (
        items.map((p) => (
          <div
            key={p.id}
            className="pop-item"
            onClick={(e) => { e.stopPropagation(); onPick(p); }}
          >
            <span className="cav">{p.ini}</span>
            {p.nome}
          </div>
        ))
      )}
    </div>
  );
}
