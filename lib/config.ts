// ════════════════════════════════════════════════════════════════════
// Constantes de configuração / regras de negócio
// ════════════════════════════════════════════════════════════════════

/** Tempo (em minutos) que um chamado pode ficar nas colunas monitoradas
 *  antes de começar a piscar vermelho. */
export const TEMPO_LIMITE_MIN = 5;

/** Colunas onde o SLA de tempo é monitorado. Hoje: só "Novo chamado". */
export const COLUNAS_MONITORADAS = ['transferido'];

/** Cores fixas dos tipos de chamado (usadas no donut de indicadores). */
export const COR_POR_TIPO: Record<string, string> = {
  Problema: '#fca5a5',
  Dúvida: '#93c5fd',
  Solicitação: '#2ECDA7',
};

/** Chaves do localStorage. Centralizar facilita migração futura pro Supabase. */
export const STORAGE_KEYS = {
  SESSAO: 'crmliguer_session',
  CARDS: 'crmliguer_cards',
} as const;

export const STORAGE_VERSION = 1;
