// ════════════════════════════════════════════════════════════════════
// Auth — mock local. Lê usuários do JSON e persiste sessão no localStorage.
// Quando migrar pro Supabase, esse arquivo vira chamadas a auth.signIn().
// ⚠️ Senhas em plaintext: só pra demo. NÃO use em produção.
// ════════════════════════════════════════════════════════════════════

import usuariosData from '@/data/usuarios.json';
import type { Usuario, Sessao } from './types';
import { STORAGE_KEYS } from './config';

const USUARIOS = usuariosData as Usuario[];

let memCache: Sessao | null = null;

export const auth = {
  salvar(sessao: Sessao) {
    memCache = sessao;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSAO, JSON.stringify(sessao));
    } catch {
      /* ambiente sem localStorage */
    }
  },

  ler(): Sessao | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSAO);
      if (raw) return JSON.parse(raw) as Sessao;
    } catch {
      /* ignora */
    }
    return memCache;
  },

  limpar() {
    memCache = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSAO);
    } catch {
      /* ignora */
    }
  },

  estaLogado(): boolean {
    return !!this.ler();
  },

  /** Valida credenciais contra o JSON. Usuário é case-insensitive,
   *  senha é case-sensitive. Retorna a sessão (sem a senha) ou null. */
  validar(usuarioInput: string, senhaInput: string): Omit<Sessao, 'logadoEm'> | null {
    const u = (usuarioInput || '').trim().toLowerCase();
    const s = senhaInput || '';
    const match = USUARIOS.find(
      (x) => x.usuario.toLowerCase() === u && x.senha === s
    );
    if (!match) return null;
    return { usuario: match.usuario, nome: match.nome, papel: match.papel };
  },
};
