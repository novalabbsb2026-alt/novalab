import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * Seletor de Modelo de Lente com busca/filtro instantâneo (Combobox)
 * para agilizar a escolha em matrizes com muitos modelos cadastrados.
 */
const LensModelCombobox = ({ models, value, onChange, resolveUnitPrice }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const selectedModel = models.find((m) => String(m.id) === String(value)) || null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? models.filter((m) => {
        const hay = `${m.brand || ''} ${m.name || ''} ${m.treatment || ''} ${m.material || ''} ${m.refractive_index || ''}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      })
    : models;

  const formatLabel = (m) => {
    const unitP = resolveUnitPrice ? resolveUnitPrice(m) : parseFloat(m.sale_price || 0);
    return `${m.brand || m.name} — ${m.treatment || 'Incolor'} | ${m.material || 'Resina'} (n=${m.refractive_index || '1.56'}) — R$ ${unitP.toFixed(2)}/un (Par: R$ ${(unitP * 2).toFixed(2)})`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => {
          if (models.length > 0) setOpen((prev) => !prev);
        }}
        style={{
          width: '100%',
          height: '38px',
          padding: '0 10px',
          borderRadius: '8px',
          border: open ? '1.5px solid hsl(var(--primary))' : '1px solid #cbd5e1',
          fontSize: '0.8rem',
          fontWeight: 600,
          background: 'white',
          color: selectedModel ? 'hsl(var(--text-primary))' : '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          cursor: models.length > 0 ? 'pointer' : 'not-allowed',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {models.length === 0
            ? 'Nenhum modelo na grade'
            : selectedModel
              ? formatLabel(selectedModel)
              : '-- Selecione ou busque o Modelo --'}
        </span>
        {selectedModel && (
          <span
            role="button"
            tabIndex={-1}
            title="Limpar seleção"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setQuery('');
            }}
            style={{ color: '#94a3b8', display: 'inline-flex', padding: '2px' }}
          >
            <X size={13} />
          </span>
        )}
        <ChevronDown size={14} style={{ color: '#64748b', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '42px',
            left: 0,
            right: 0,
            minWidth: '320px',
            zIndex: 60,
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc' }}>
            <Search size={14} style={{ color: '#64748b', flexShrink: 0 }} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar marca, tratamento, material..."
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.8rem',
                color: '#0f172a',
              }}
            />
          </div>

          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
                Nenhum modelo encontrado para "{query}"
              </div>
            ) : (
              filtered.map((m) => {
                const isSelected = String(m.id) === String(value);
                const unitP = resolveUnitPrice ? resolveUnitPrice(m) : parseFloat(m.sale_price || 0);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>
                        {m.brand || m.name} {m.treatment ? `— ${m.treatment}` : ''}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '0.76rem', color: '#059669', whiteSpace: 'nowrap' }}>
                        Par: R$ {(unitP * 2).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{m.material || 'Resina'} (n={m.refractive_index || '1.56'})</span>
                      <span>Unitário: R$ {unitP.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LensModelCombobox;
