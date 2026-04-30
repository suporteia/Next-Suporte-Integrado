// ════════════════════════════════════════════════════════════════════
// Helpers genéricos: formatação de datas, máscaras de input, validação
// ════════════════════════════════════════════════════════════════════

import type { CategoriaArvore } from './types';

/** Escapa HTML pra inserção segura em `dangerouslySetInnerHTML`.
 *  No React puro a maioria dos casos não precisa disso (o JSX já escapa),
 *  mas serve quando montamos strings dinâmicas inline. */
export function escapeHtml(str: unknown): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Datas ──────────────────────────────────────────────────────────
export function fmt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function fmtLongo(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

/** Retorna data/hora atual no formato YYYY-MM-DDTHH:mm pra input datetime-local. */
export function isoLocalAgora(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Converte uma data salva pro formato aceito por datetime-local. */
export function toInputDateTime(valor: string | null | undefined): string {
  if (!valor) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return valor;
  const d = new Date(valor);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Timestamp truncado pra YYYY-MM-DDTHH:mm — usado em criadoEm/fechadoEm. */
export function isoCurto(): string {
  return new Date().toISOString().slice(0, 16);
}

// ── Máscaras ───────────────────────────────────────────────────────
/** CPF (11 dígitos) ou CNPJ (14 dígitos) com auto-detecção. */
export function mascaraCpfCnpj(valor: string): string {
  const num = valor.replace(/\D/g, '').slice(0, 14);
  if (num.length <= 11) {
    return num
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return num
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/** Telefone brasileiro fixo (10 díg) ou celular (11 díg). */
export function mascaraTelefone(valor: string): string {
  const num = valor.replace(/\D/g, '').slice(0, 11);
  if (num.length === 0) return '';
  if (num.length <= 2) return '(' + num;
  if (num.length <= 6) return '(' + num.slice(0, 2) + ') ' + num.slice(2);
  if (num.length <= 10) return '(' + num.slice(0, 2) + ') ' + num.slice(2, 6) + '-' + num.slice(6);
  return '(' + num.slice(0, 2) + ') ' + num.slice(2, 7) + '-' + num.slice(7);
}

/** ID curto: só dígitos, máx 4. */
export function mascaraId4(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 4);
}

/** Iniciais a partir do nome: primeira do primeiro + primeira do último. */
export function calcIniciais(nome: string): string {
  const txt = (nome || '').trim();
  if (!txt) return '—';
  const parts = txt.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Bytes ──────────────────────────────────────────────────────────
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// ── Validação ──────────────────────────────────────────────────────
export function emailValido(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// ── Árvore de classificação ────────────────────────────────────────
/** Agrupa categorias por nome. Útil porque a árvore tem entradas duplicadas
 *  do mesmo `categoria` quando há múltiplas subcategorias. */
export function agruparPorCategoria(
  categorias: CategoriaArvore[]
): Map<string, { subcategoria: string | null; motivos: string[] }[]> {
  const map = new Map<string, { subcategoria: string | null; motivos: string[] }[]>();
  categorias.forEach((c) => {
    if (!map.has(c.categoria)) map.set(c.categoria, []);
    map.get(c.categoria)!.push({ subcategoria: c.subcategoria, motivos: c.motivos });
  });
  return map;
}
