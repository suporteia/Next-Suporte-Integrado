// ════════════════════════════════════════════════════════════════════
// Storage de chamados — localStorage com fallback em memória.
// Quando migrar pro Supabase, esse wrapper vira chamadas a
// supabase.from('chamados') e o resto da app continua igual.
// ════════════════════════════════════════════════════════════════════

import type { Card } from './types';
import { STORAGE_KEYS, STORAGE_VERSION } from './config';

interface Payload {
  v: number;
  cards: Card[];
  savedAt: string;
}

let memCache: Payload | null = null;

export const storeCards = {
  salvar(cards: Card[]) {
    const payload: Payload = {
      v: STORAGE_VERSION,
      cards,
      savedAt: new Date().toISOString(),
    };
    memCache = payload;
    try {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(payload));
    } catch (e) {
      console.warn('[storeCards] não consegui persistir:', (e as Error)?.message);
    }
  },

  carregar(): Card[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (raw) {
        const parsed = JSON.parse(raw) as Payload;
        if (parsed && Array.isArray(parsed.cards)) return parsed.cards;
      }
    } catch (e) {
      console.warn('[storeCards] não consegui ler:', (e as Error)?.message);
    }
    return memCache && Array.isArray(memCache.cards) ? memCache.cards : null;
  },

  limpar() {
    memCache = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.CARDS);
    } catch {
      /* ignora */
    }
  },
};
