import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Trash2, Copy, Send, CheckCircle2, AlertTriangle, 
  Store, Package, Activity, ArrowRight, RefreshCw, Sparkles, Check
} from 'lucide-react';
import api from '../services/api';

const MATRIX_OPTIONS = [
  { value: 'LP_GRADE', label: 'Visão Simples', basePrice: 67.0 },
  { value: 'GRADE_167', label: '1.67', basePrice: 110.0 },
  { value: 'MF_ACB', label: 'Multifocal Acabado', basePrice: 85.0 },
  { value: 'MF_BLOCO', label: 'Multifocal', basePrice: 95.0 },
  { value: 'BLOCO_VS', label: 'Bloco Visão Simples', basePrice: 75.0 },
];

const SERVICE_OPTIONS = [
  { value: 'Montagem Padrão', label: 'Montagem Padrão', price: 13.0 },
  { value: 'Aro Fechado (Acetato/Metal)', label: 'Aro Fechado', price: 13.0 },
  { value: 'Fio de Nylon (Semi-Aro)', label: 'Fio de Nylon', price: 18.0 },
  { value: 'Parafuso / Balgriff (Três Peças)', label: 'Parafuso / Balgriff', price: 25.0 },
  { value: 'Coloração Solar / Filtro Especial', label: 'Coloração Solar', price: 20.0 },
  { value: 'Sem Montagem (Apenas Lentes)', label: 'Sem Montagem', price: 0.0 },
];

const TREATMENT_OPTIONS = [
  { value: 'Incolor / Sem Tratamento', label: 'Incolor (Sem Tratamento)', price: 0.0 },
  { value: 'Filtro Azul AR', label: 'Filtro Azul AR', price: 0.0 },
  { value: 'Antirreflexo Premium', label: 'Antirreflexo Premium', price: 0.0 },
  { value: 'Fotossensível / Transitions', label: 'Fotossensível', price: 25.0 },
];

const createEmptyRow = (index = 1) => ({
  id: Date.now() + Math.random(),
  client_order_number: '',
  client_name: '',
  tray_number: String(index).padStart(2, '0'),
  matrix_type: 'LP_GRADE',
  od_spherical: 0.0,
  od_cylindrical: 0.0,
  od_axis: 0,
  od_addition: 0.0,
  oe_spherical: 0.0,
  oe_cylindrical: 0.0,
  oe_axis: 0,
  oe_addition: 0.0,
  service_type: 'Montagem Padrão',
  treatment: 'Filtro Azul AR',
  lens_price: 67.0,
  service_price: 13.0,
  treatment_price: 0.0,
  total_amount: 80.0,
  special_instructions: ''
});

const EntradaMalote = ({ onNavigateToWorkflow }) => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [batchRef, setBatchRef] = useState(() => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    return `MALOTE-${dateStr}`;
  });
  const [autoDeductInventory, setAutoDeductInventory] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const [rows, setRows] = useState([
    createEmptyRow(1),
    createEmptyRow(2)
  ]);

  // Carrega lista de óticas
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const res = await api.get('/optical-stores/');
        const list = res.data?.items || res.data || [];
        setStores(list);
        if (list.length > 0 && !selectedStoreId) {
          setSelectedStoreId(list[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar óticas:", err);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Recalcula valor de uma linha
  const handleRowChange = (id, field, value) => {
    setRows(prevRows => prevRows.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };

      // Se mudou a matriz, ajusta o preço sugerido da lente
      if (field === 'matrix_type') {
        const mat = MATRIX_OPTIONS.find(m => m.value === value);
        if (mat) {
          updated.lens_price = mat.basePrice;
        }
      }

      // Se mudou o serviço, ajusta o preço do serviço
      if (field === 'service_type') {
        const serv = SERVICE_OPTIONS.find(s => s.value === value);
        if (serv) {
          updated.service_price = serv.price;
        }
      }

      // Se mudou o tratamento, ajusta o preço do tratamento
      if (field === 'treatment') {
        const treat = TREATMENT_OPTIONS.find(t => t.value === value);
        if (treat) {
          updated.treatment_price = treat.price;
        }
      }

      // Recalcula total da linha
      const lPrice = parseFloat(updated.lens_price || 0);
      const sPrice = parseFloat(updated.service_price || 0);
      const tPrice = parseFloat(updated.treatment_price || 0);
      updated.total_amount = Math.round((lPrice + sPrice + tPrice) * 100) / 100;

      return updated;
    }));
  };

  // Adiciona nova linha
  const handleAddRow = () => {
    setRows(prev => [...prev, createEmptyRow(prev.length + 1)]);
  };

  // Duplica linha existente
  const handleDuplicateRow = (rowToClone) => {
    const clone = {
      ...rowToClone,
      id: Date.now() + Math.random(),
      client_order_number: '',
      client_name: '',
      tray_number: String(rows.length + 1).padStart(2, '0')
    };
    setRows(prev => [...prev, clone]);
  };

  // Remove linha
  const handleRemoveRow = (id) => {
    if (rows.length <= 1) {
      alert("O malote deve conter pelo menos 1 pedido.");
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Totais consolidados do malote
  const totalOrders = rows.length;
  const totalLenses = totalOrders * 2;
  const totalBatchPrice = rows.reduce((acc, r) => acc + (parseFloat(r.total_amount) || 0), 0);

  // Envio do Lote
  const handleSubmitBatch = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedStoreId) {
      setErrorMessage("Por favor, selecione a ótica parceira.");
      return;
    }

    if (rows.length === 0) {
      setErrorMessage("Adicione pelo menos um pedido no malote.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        optical_store_id: selectedStoreId,
        batch_reference: batchRef.trim() || undefined,
        initial_status: "EM_PRODUCAO",
        auto_deduct_inventory: autoDeductInventory,
        items: rows.map(r => ({
          client_order_number: r.client_order_number?.trim() || null,
          client_name: r.client_name?.trim() || "Consumidor Final",
          tray_number: r.tray_number?.trim() || null,
          matrix_type: r.matrix_type,
          od_spherical: parseFloat(r.od_spherical) || 0.0,
          od_cylindrical: parseFloat(r.od_cylindrical) || 0.0,
          od_axis: parseInt(r.od_axis) || 0,
          od_addition: parseFloat(r.od_addition) || 0.0,
          oe_spherical: parseFloat(r.oe_spherical) || 0.0,
          oe_cylindrical: parseFloat(r.oe_cylindrical) || 0.0,
          oe_axis: parseInt(r.oe_axis) || 0,
          oe_addition: parseFloat(r.oe_addition) || 0.0,
          service_type: r.service_type,
          treatment: r.treatment,
          lens_price: parseFloat(r.lens_price) || 0.0,
          service_price: parseFloat(r.service_price) || 0.0,
          treatment_price: parseFloat(r.treatment_price) || 0.0,
          total_amount: parseFloat(r.total_amount) || 0.0,
          special_instructions: r.special_instructions?.trim() || null
        }))
      };

      const res = await api.post('/os/batch-malote', payload);
      setSuccessResult(res.data);
    } catch (err) {
      console.error("Erro ao lançar malote:", err);
      const detail = err.response?.data?.detail || "Erro inesperado ao registrar malote de ordens de serviço.";
      setErrorMessage(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessResult(null);
    setRows([createEmptyRow(1), createEmptyRow(2)]);
    const d = new Date();
    setBatchRef(`MALOTE-${d.toISOString().slice(0, 10).replace(/-/g, '')}`);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Cabeçalho Superior */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(224, 230, 240, 0.8)',
        paddingBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
              color: 'white',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex'
            }}>
              <Package size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
                Entrada Rápida por Malote / Lote de Serviços
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                Cadastre de uma só vez múltiplos pedidos da mesma ótica com baixa automática de lentes e faturamento consolidado.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateToWorkflow && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNavigateToWorkflow}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
            >
              <Activity size={16} /> Ir para Bancada Ágil
            </button>
          )}
        </div>
      </div>

      {/* Modal de Sucesso */}
      {successResult && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-container" style={{ maxWidth: '720px', width: '100%', background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'modal-appear 0.2s ease-out' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: 'hsl(var(--text-primary))' }}>
                Malote Lançado com Sucesso!
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
                Foram geradas <strong>{successResult.total_orders_created} Ordens de Serviço</strong> para a ótica <strong>{successResult.optical_store_name}</strong>.
              </p>
            </div>

            {/* Lista de OSs Criadas */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>OS</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Pedido Loja</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Grade</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Estoque</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {successResult.results.map((res, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                        {res.os_number}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#334155' }}>
                        {res.client_order_number || '-'}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                        {res.grade_name}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {res.inventory_deducted ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>
                            <Check size={13} /> Baixado
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 600 }} title={res.inventory_warning || ''}>
                            {res.inventory_warning ? 'Alerta Saldo' : 'Pendente'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                        R$ {res.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetForm}
                style={{ padding: '10px 18px', fontWeight: 600 }}
              >
                Lançar Outro Malote
              </button>

              {onNavigateToWorkflow && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setSuccessResult(null); onNavigateToWorkflow(); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontWeight: 700 }}
                >
                  <Activity size={18} /> Ir para a Bancada Ágil
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Painel de Configurações Gerais do Malote */}
      <form onSubmit={handleSubmitBatch}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid rgba(224, 230, 240, 0.9)',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', alignItems: 'center' }}>
            
            {/* Seleção da Ótica Parceira */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '6px' }}>
                <Store size={15} style={{ color: 'hsl(var(--primary))' }} />
                Ótica Parceira Destinatária *
              </label>
              {loadingStores ? (
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Carregando óticas...</div>
              ) : (
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    background: 'white'
                  }}
                >
                  <option value="">-- Selecione a Ótica Parceira --</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.trade_name || st.corporate_name} {st.cnpj ? `(${st.cnpj})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Referência do Malote */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '6px' }}>
                <Package size={15} style={{ color: 'hsl(var(--primary))' }} />
                Identificador / Ref. do Malote
              </label>
              <input
                type="text"
                value={batchRef}
                onChange={(e) => setBatchRef(e.target.value)}
                placeholder="Ex: MALOTE-104 / ENTRADA-MANHA"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Baixa Automática de Estoque */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '6px' }}>
                <Layers size={15} style={{ color: 'hsl(var(--primary))' }} />
                Controle de Estoque
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: autoDeductInventory ? 'rgba(16, 185, 129, 0.08)' : '#f8fafc',
                border: `1px solid ${autoDeductInventory ? '#10b981' : '#cbd5e1'}`,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: autoDeductInventory ? '#047857' : '#475569'
              }}>
                <input
                  type="checkbox"
                  checked={autoDeductInventory}
                  onChange={(e) => setAutoDeductInventory(e.target.checked)}
                  style={{ accentColor: '#10b981', transform: 'scale(1.2)' }}
                />
                Dar Baixa Automática no Estoque (OD e OE)
              </label>
            </div>

          </div>
        </div>

        {/* Mensagem de Erro se houver */}
        {errorMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            color: '#dc2626',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem'
          }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tabela Ágil / Grid Dinâmico de Pedidos */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid rgba(224, 230, 240, 0.9)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          overflowX: 'auto',
          marginBottom: '20px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '1100px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '40px' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: '120px' }}>Pedido Loja</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: '150px' }}>Paciente / Cliente</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: '160px' }}>Grade Pertencente</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '220px', background: '#f1f5f9' }}>
                  Olho Direito (OD)
                  <div style={{ fontSize: '0.68rem', fontWeight: 500, color: '#64748b' }}>Esf | Cil | Eixo | Add</div>
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '220px', background: '#f8fafc' }}>
                  Olho Esquerdo (OE)
                  <div style={{ fontSize: '0.68rem', fontWeight: 500, color: '#64748b' }}>Esf | Cil | Eixo | Add</div>
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: '140px' }}>Serviço Técnico</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: '130px' }}>Tratamento</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', width: '90px' }}>Valor Total</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isMF = row.matrix_type === 'MF_ACB' || row.matrix_type === 'MF_BLOCO';

                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : 'rgba(248, 250, 252, 0.5)' }}>
                    
                    {/* Índice */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#94a3b8' }}>
                      {idx + 1}
                    </td>

                    {/* Pedido Loja */}
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        value={row.client_order_number}
                        onChange={(e) => handleRowChange(row.id, 'client_order_number', e.target.value)}
                        placeholder="Ex: 1042"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          fontSize: '0.82rem'
                        }}
                      />
                    </td>

                    {/* Paciente */}
                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        value={row.client_name}
                        onChange={(e) => handleRowChange(row.id, 'client_name', e.target.value)}
                        placeholder="Consumidor Final"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.82rem'
                        }}
                      />
                    </td>

                    {/* Grade Pertencente */}
                    <td style={{ padding: '6px 8px' }}>
                      <select
                        value={row.matrix_type}
                        onChange={(e) => handleRowChange(row.id, 'matrix_type', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          background: row.matrix_type === 'GRADE_167' ? 'rgba(168, 85, 247, 0.08)' : row.matrix_type.startsWith('MF') ? 'rgba(245, 158, 11, 0.08)' : 'white'
                        }}
                      >
                        {MATRIX_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* OD: Esf | Cil | Eixo | Add */}
                    <td style={{ padding: '6px 6px', background: 'rgba(241, 245, 249, 0.6)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMF ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.25"
                          value={row.od_spherical}
                          onChange={(e) => handleRowChange(row.id, 'od_spherical', parseFloat(e.target.value) || 0)}
                          title="Esférico OD"
                          placeholder="Esf"
                          style={{ padding: '4px 2px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                        <input
                          type="number"
                          step="0.25"
                          value={row.od_cylindrical}
                          onChange={(e) => handleRowChange(row.id, 'od_cylindrical', parseFloat(e.target.value) || 0)}
                          title="Cilíndrico OD"
                          placeholder="Cil"
                          style={{ padding: '4px 2px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="180"
                          value={row.od_axis}
                          onChange={(e) => handleRowChange(row.id, 'od_axis', parseInt(e.target.value) || 0)}
                          title="Eixo OD"
                          placeholder="Eixo"
                          style={{ padding: '4px 2px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                        {isMF && (
                          <input
                            type="number"
                            step="0.25"
                            value={row.od_addition}
                            onChange={(e) => handleRowChange(row.id, 'od_addition', parseFloat(e.target.value) || 0)}
                            title="Adição OD"
                            placeholder="Add"
                            style={{ padding: '4px 2px', textAlign: 'center', borderRadius: '4px', border: '1px solid #f59e0b', background: '#fffbeb', fontSize: '0.78rem', fontWeight: 600 }}
                          />
                        )}
                      </div>
                    </td>

                    {/* OE: Esf | Cil | Eixo | Add */}
                    <td style={{ padding: '6px 6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMF ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: '4px' }}>
                        <input
                          type="number"
                          step="0.25"
                          value={row.oe_spherical}
                          onChange={(e) => handleRowChange(row.id, 'oe_spherical', parseFloat(e.target.value) || 0)}
                          title="Esférico OE"
                          placeholder="Esf"
                          style={{ padding: '4px 2px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                        <input
                          type="number"
                          step="0.25"
                          value={row.oe_cylindrical}
                          onChange={(e) => handleRowChange(row.id, 'oe_cylindrical', parseFloat(e.target.value) || 0)}
                          title="Cilíndrico OE"
                          placeholder="Cil"
                          style={{ padding: '4px 2px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="180"
                          value={row.oe_axis}
                          onChange={(e) => handleRowChange(row.id, 'oe_axis', parseInt(e.target.value) || 0)}
                          title="Eixo OE"
                          placeholder="Eixo"
                          style={{ padding: '4px 2px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                        />
                        {isMF && (
                          <input
                            type="number"
                            step="0.25"
                            value={row.oe_addition}
                            onChange={(e) => handleRowChange(row.id, 'oe_addition', parseFloat(e.target.value) || 0)}
                            title="Adição OE"
                            placeholder="Add"
                            style={{ padding: '4px 2px', textAlign: 'center', borderRadius: '4px', border: '1px solid #f59e0b', background: '#fffbeb', fontSize: '0.78rem', fontWeight: 600 }}
                          />
                        )}
                      </div>
                    </td>

                    {/* Serviço Técnico */}
                    <td style={{ padding: '6px 8px' }}>
                      <select
                        value={row.service_type}
                        onChange={(e) => handleRowChange(row.id, 'service_type', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                      >
                        {SERVICE_OPTIONS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Tratamento */}
                    <td style={{ padding: '6px 8px' }}>
                      <select
                        value={row.treatment}
                        onChange={(e) => handleRowChange(row.id, 'treatment', e.target.value)}
                        style={{ width: '100%', padding: '6px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                      >
                        {TREATMENT_OPTIONS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Preço Total da OS */}
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>R$</span>
                        <input
                          type="number"
                          step="0.50"
                          value={row.total_amount}
                          onChange={(e) => handleRowChange(row.id, 'total_amount', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '65px',
                            padding: '4px 4px',
                            textAlign: 'right',
                            fontWeight: 700,
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.8rem',
                            color: '#0f172a'
                          }}
                        />
                      </div>
                    </td>

                    {/* Ações (Duplicar e Excluir) */}
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(row)}
                          title="Duplicar Pedido"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          title="Remover Pedido"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Barra de Ações Inferior e Totalizadores */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'white',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(224, 230, 240, 0.9)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          
          <button
            type="button"
            onClick={handleAddRow}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600 }}
          >
            <Plus size={18} /> Adicionar Mais um Pedido (Linha)
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Pedidos:</span> <strong>{totalOrders} óculos</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Lentes:</span> <strong>{totalLenses} un (OD/OE)</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Total do Malote:</span> <strong style={{ color: 'hsl(var(--primary))', fontSize: '1.1rem' }}>R$ {totalBatchPrice.toFixed(2)}</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                fontSize: '0.95rem',
                fontWeight: 800,
                borderRadius: '8px',
                boxShadow: '0 4px 12px hsl(var(--primary) / 0.25)'
              }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={18} className="spin" /> Processando Malote...
                </>
              ) : (
                <>
                  <Send size={18} /> Lançar Malote no Laboratório ({totalOrders} Pedidos)
                </>
              )}
            </button>

          </div>

        </div>

      </form>

    </div>
  );
};

export default EntradaMalote;
