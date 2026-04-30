'use client';

import { useMemo, useState, useEffect } from 'react';
import type { TipoArvore } from '@/lib/types';
import { agruparPorCategoria } from '@/lib/utils';

export interface MarcadoresValue {
  tipo: string;
  categoria: string;
  subcategoria: string;
  motivo: string;
  /** Quando não há subcategorias na categoria escolhida, o select de sub fica disabled. */
  subDisabled: boolean;
}

interface MarcadoresSelectsProps {
  arvore: TipoArvore[];
  initial?: Partial<MarcadoresValue>;
  onChange: (v: MarcadoresValue) => void;
  /** Marca como `invalid` os selects vazios. */
  showInvalid?: boolean;
  /** Prefixo dos IDs gerados — diferente entre o dialog principal (s-) e o modal de classificar (c-). */
  idPrefix?: string;
  className?: string;
}

/** Os 4 selects encadeados Tipo → Categoria → Subcategoria → Motivo.
 *  Reaproveitado pelo dialog de chamado e pelo modal de "classificar antes
 *  de concluir". A lógica de qual nível depende de qual está aqui dentro. */
export function MarcadoresSelects({
  arvore,
  initial,
  onChange,
  showInvalid = false,
  idPrefix = 's',
  className,
}: MarcadoresSelectsProps) {
  const [tipo, setTipo] = useState(initial?.tipo || '');
  const [categoria, setCategoria] = useState(initial?.categoria || '');
  const [subcategoria, setSubcategoria] = useState(initial?.subcategoria || '');
  const [motivo, setMotivo] = useState(initial?.motivo || '');

  // ── Derivações: as listas dependentes sempre vêm da árvore filtrada
  const tipoEntry = useMemo(
    () => (tipo ? arvore.find((x) => x.tipo === tipo) : null),
    [arvore, tipo]
  );

  const categoriasMap = useMemo(
    () => (tipoEntry ? agruparPorCategoria(tipoEntry.categorias) : null),
    [tipoEntry]
  );

  const categoriasList = useMemo(
    () => (categoriasMap ? Array.from(categoriasMap.keys()) : []),
    [categoriasMap]
  );

  const entradasDaCategoria = useMemo(
    () => (categoriasMap && categoria ? categoriasMap.get(categoria) || [] : []),
    [categoriasMap, categoria]
  );

  const temSubcategorias = entradasDaCategoria.length > 0 && entradasDaCategoria[0].subcategoria !== null;
  const subDisabled = !categoria || !temSubcategorias;

  const subcategoriasList = useMemo(
    () => (temSubcategorias ? entradasDaCategoria.map((e) => e.subcategoria!).filter(Boolean) : []),
    [temSubcategorias, entradasDaCategoria]
  );

  const motivosList = useMemo(() => {
    if (!categoria) return [];
    if (!temSubcategorias) return entradasDaCategoria[0]?.motivos || [];
    if (!subcategoria) return [];
    const entrada = entradasDaCategoria.find((e) => e.subcategoria === subcategoria);
    return entrada?.motivos || [];
  }, [categoria, subcategoria, temSubcategorias, entradasDaCategoria]);

  // ── Reset em cascata quando algo muda no nível superior
  useEffect(() => {
    if (!tipo) {
      setCategoria('');
      setSubcategoria('');
      setMotivo('');
    }
  }, [tipo]);

  useEffect(() => {
    if (!categoria) {
      setSubcategoria('');
      setMotivo('');
    } else if (!temSubcategorias) {
      // Categoria sem subs → limpa sub mas mantém motivo
      setSubcategoria('');
    }
  }, [categoria, temSubcategorias]);

  useEffect(() => {
    if (temSubcategorias && !subcategoria) setMotivo('');
  }, [subcategoria, temSubcategorias]);

  // ── Dispara onChange sempre que algum valor muda
  useEffect(() => {
    onChange({ tipo, categoria, subcategoria, motivo, subDisabled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, categoria, subcategoria, motivo, subDisabled]);

  // ── Label da subcategoria muda conforme estado
  const renderLabelSub = () => {
    if (!subDisabled) return <>Subcategoria <span className="req">*</span></>;
    if (categoria && !temSubcategorias) {
      return <>Subcategoria <span className="sub-na">não se aplica</span></>;
    }
    return <>Subcategoria</>;
  };

  const inv = (val: string, allowDisabled = false) =>
    showInvalid && !val && !allowDisabled ? ' invalid' : '';

  return (
    <div className={`mark-grid${className ? ' ' + className : ''}`}>
      <div className="mark-field">
        <span className="mark-lbl">Tipo <span className="req">*</span></span>
        <select
          className={`sel${inv(tipo)}`}
          id={`${idPrefix}-tipo`}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">— selecione —</option>
          {arvore.map((t) => (
            <option key={t.tipo} value={t.tipo}>{t.tipo}</option>
          ))}
        </select>
      </div>
      <div className="mark-field">
        <span className="mark-lbl">Categoria <span className="req">*</span></span>
        <select
          className={`sel${inv(categoria)}`}
          id={`${idPrefix}-cat`}
          value={categoria}
          disabled={!tipo}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">{tipo ? '— selecione —' : '—'}</option>
          {categoriasList.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="mark-field">
        <span className="mark-lbl" id={`${idPrefix}-sub-lbl`}>{renderLabelSub()}</span>
        <select
          className={`sel${subDisabled ? '' : inv(subcategoria)}`}
          id={`${idPrefix}-sub`}
          value={subDisabled ? '' : subcategoria}
          disabled={subDisabled}
          onChange={(e) => setSubcategoria(e.target.value)}
        >
          {subDisabled
            ? <option value="">{categoria && !temSubcategorias ? 'não se aplica' : '—'}</option>
            : <>
                <option value="">— selecione —</option>
                {subcategoriasList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </>
          }
        </select>
      </div>
      <div className="mark-field">
        <span className="mark-lbl">Motivo <span className="req">*</span></span>
        <select
          className={`sel${inv(motivo)}`}
          id={`${idPrefix}-mot`}
          value={motivo}
          disabled={motivosList.length === 0}
          onChange={(e) => setMotivo(e.target.value)}
        >
          <option value="">{motivosList.length === 0 ? '—' : '— selecione —'}</option>
          {motivosList.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
