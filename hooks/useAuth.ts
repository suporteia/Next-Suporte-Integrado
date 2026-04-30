'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/auth';
import type { Sessao } from '@/lib/types';

/** Hook de sessão. `loading` evita flash de tela errada na hidratação:
 *  no SSR não temos acesso ao localStorage, então começamos `loading: true`
 *  e só decidimos a tela depois do primeiro effect rodar no client. */
export function useAuth() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessao(auth.ler());
    setLoading(false);
  }, []);

  const login = useCallback((usuario: string, senha: string): { ok: boolean; erro?: string } => {
    const valido = auth.validar(usuario, senha);
    if (!valido) return { ok: false, erro: 'Usuário ou senha incorretos.' };
    const novaSessao: Sessao = { ...valido, logadoEm: new Date().toISOString() };
    auth.salvar(novaSessao);
    setSessao(novaSessao);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    auth.limpar();
    setSessao(null);
  }, []);

  return { sessao, loading, login, logout, estaLogado: !!sessao };
}
