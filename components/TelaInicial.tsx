'use client';

interface TelaInicialProps {
  onIrPraKanban: () => void;
  onAbrirChamadoDireto: () => void;
}

export function TelaInicial({ onIrPraKanban, onAbrirChamadoDireto }: TelaInicialProps) {
  return (
    <div className="tela-inicial">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2ECDA7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <h1>Suporte Integrado</h1>
      <p>Acesse a fila de chamados do N2 ou abra um chamado novo direto pelo CRM.</p>
      <div className="tela-inicial-actions">
        <button className="btn-transferir" onClick={onIrPraKanban}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          Acessar fila de chamados
        </button>
        <button className="btn-secundario" onClick={onAbrirChamadoDireto}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Abrir chamado no CRM
        </button>
      </div>
    </div>
  );
}
