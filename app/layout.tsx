import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Suporte Integrado · CRMLiguer',
  description: 'Fila de chamados do N2 — N2 · Tech · Financeiro',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
