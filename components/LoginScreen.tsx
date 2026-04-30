'use client';

import { useState, useRef, FormEvent } from 'react';

interface LoginScreenProps {
  onLogin: (usuario: string, senha: string) => { ok: boolean; erro?: string };
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const erroRef = useRef<HTMLParagraphElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!usuario.trim() || !senha) {
      setErro('Preencha usuário e senha.');
      return;
    }

    setCarregando(true);

    // Delay artificial pra simular request — mantém UX consistente
    // com o que vai rolar quando virar request real ao Supabase.
    setTimeout(() => {
      const r = onLogin(usuario, senha);
      setCarregando(false);
      if (!r.ok) {
        setErro(r.erro || 'Falha no login.');
        return;
      }
      setSenha('');
    }, 300);
  };

  return (
    <div className="tela-login">
      <div className="login-card">
        <div className="login-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2ECDA7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <h1 className="login-titulo">Suporte Integrado</h1>
        <p className="login-sub">Entre pra acessar a fila de chamados</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="lbl" htmlFor="login-usuario">Usuário</label>
            <input
              className="inp"
              id="login-usuario"
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label className="lbl" htmlFor="login-senha">Senha</label>
            <input
              className="inp"
              id="login-senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && <p className="login-erro" ref={erroRef}>{erro}</p>}

          <button className="login-btn" type="submit" disabled={carregando}>
            <span>{carregando ? 'Entrando...' : 'Entrar'}</span>
            {carregando && (
              <svg className="login-btn-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
          </button>
        </form>

        <div className="login-hint">
          <span className="login-hint-tag">Demo</span>
          <span><code>admin</code> · <code>admin</code></span>
        </div>
      </div>
    </div>
  );
}
