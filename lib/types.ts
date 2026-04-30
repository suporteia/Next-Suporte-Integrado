// ════════════════════════════════════════════════════════════════════
// Tipos centrais do Suporte Integrado · CRMLiguer
// ════════════════════════════════════════════════════════════════════

export interface Usuario {
  usuario: string;
  senha: string;
  nome: string;
  papel: 'admin' | 'analista' | string;
}

export interface Sessao {
  usuario: string;
  nome: string;
  papel: string;
  logadoEm: string;
}

export interface Coluna {
  id: string;
  titulo: string;
  cor: string;
}

export interface Tag {
  id: string;
  nome: string;
  cor: string;
}

export interface Membro {
  id: string;
  nome: string;
  ini: string;
}

export interface TeamConfig {
  atual: string;
  envolvidosIniciais: string[];
  membros: Membro[];
}

export interface ClientePadrao {
  nome: string;
  iniciais: string;
  id: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  plataforma: string;
}

export interface Cliente {
  nome: string;
  ini: string;
  idCliente?: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  plataforma?: string;
}

// ── Árvore de classificação ─────────────────────────────────────────
export interface CategoriaArvore {
  categoria: string;
  subcategoria: string | null;
  motivos: string[];
}
export interface TipoArvore {
  tipo: 'Problema' | 'Dúvida' | 'Solicitação' | string;
  categorias: CategoriaArvore[];
}

// ── Conversas ───────────────────────────────────────────────────────
export type TipoMensagem = 'system' | 'cliente' | 'atendente' | 'ia';
export interface MidiaImagem {
  tipo: 'image';
  url: string;
  caption?: string;
}
export interface MidiaDocumento {
  tipo: 'documento';
  url: string;
  nomeArquivo?: string;
  tamanho?: string;
}
export type Midia = MidiaImagem | MidiaDocumento | { tipo: string; [k: string]: unknown };

export interface Mensagem {
  tipo: TipoMensagem;
  data: string;
  texto?: string;
  autor?: string;
  midia?: Midia;
}
export interface Conversa {
  abertura: string;
  mensagens: Mensagem[];
}

// ── Templates de transferência ──────────────────────────────────────
export interface TemplateTransferencia {
  cliente: {
    nome: string;
    ini: string;
    cpfCnpj?: string;
    telefone?: string;
    email?: string;
    plataforma?: string;
  };
  titulo: string;
  descricao: string;
  ultimaMsg: string;
}

// ── Anexos ──────────────────────────────────────────────────────────
export interface Anexo {
  nome: string;
  tamanho?: number;
  tipo?: string;
}

// ── Eventos da timeline ─────────────────────────────────────────────
export interface EventoTimeline {
  data: string;
  acao: string;
  col: string;
  autor: string;
}

// ── Card / Chamado ──────────────────────────────────────────────────
export interface Card {
  id: string;
  numero: string;
  cliente: Cliente;
  titulo: string;
  detalhamento: string;
  /** Sinônimo legado de `detalhamento`. */
  descricao?: string;
  tipo: string | null;
  categoria: string | null;
  subcategoria: string | null;
  motivo: string | null;
  tags: string[];
  coluna: string;
  criadoEm: string;
  fechadoEm: string | null;
  motivoFechamento: string | null;
  transferidoPor?: string;
  analista: Membro | null;
  envolvidos: Membro[];
  anexos: Anexo[];
  ultimaMsg: string;
  timeline: EventoTimeline[];
}

// ── Estado interno do dialog (form de chamado) ──────────────────────
export interface DialogState {
  analista: Membro | null;
  envolvidos: Membro[];
  tagsSelecionadas: string[];
  anexos: Anexo[];
  editandoCardId: string | null;
}
