import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Trash2, Copy, Send, CheckCircle2, AlertTriangle, 
  Store, Package, Activity, ArrowRight, RefreshCw, Sparkles, Check
} from 'lucide-react';
import api, { LensService } from '../services/api';

const MATRIX_OPTIONS = [
  { value: 'LP_GRADE', label: 'Visão Simples', unitPrice: 33.5 },
  { value: 'GRADE_167', label: '1.67', unitPrice: 55.0 },
  { value: 'MF_ACB', label: 'Multifocal Acabado', unitPrice: 42.5 },
  { value: 'MF_BLOCO', label: 'Multifocal', unitPrice: 47.5 },
  { value: 'BLOCO_VS', label: 'Bloco Visão Simples', unitPrice: 37.5 },
];

const EYE_TARGET_OPTIONS = [
  { value: 'OD_OE', label: 'Ambos (Par)', short: 'OD + OE' },
  { value: 'OD', label: 'Direito (OD)', short: 'OD' },
  { value: 'OE', label: 'Esquerdo (OE)', short: 'OE' },
];

const SERVICE_OPTIONS = [
  { value: 'Montagem Padrão', label: 'Montagem Padrão', price: 13.0 },
  { value: 'Aro Fechado (Acetato/Metal)', label: 'Aro Fechado', price: 13.0 },
  { value: 'Fio de Nylon (Semi-Aro)', label: 'Fio de Nylon', price: 18.0 },
  { value: 'Parafuso / Balgriff (Três Peças)', label: 'Parafuso / Balgriff', price: 25.0 },
  { value: 'Coloração Solar / Filtro Especial', label: 'Coloração Solar', price: 20.0 },
  { value: 'Sem Montagem (Apenas Lentes)', label: 'Sem Montagem', price: 0.0 },
];

const parseDiopter = (val) => {
  if (val === null || val === undefined || val === '') return 0.0;
  const normalized = String(val).trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0.0 : parsed;
};

const sanitizeDiopterInput = (raw, allowNegative = true) => {
  return String(raw).replace(allowNegative ? /[^0-9.,+-]/g : /[^0-9.,+]/g, '');
};

const formatDiopterOnBlur = (val, { allowNegative = true, emptyIfBlank = false } = {}) => {
  if (emptyIfBlank && String(val ?? '').trim() === '') return '';
  let num = parseDiopter(val);
  if (!allowNegative && num < 0) num = Math.abs(num);
  return num.toFixed(2);
};

const createEmptyRow = (index = 1) => ({
  id: Date.now() + Math.random(),
  client_order_number: '',
  tray_number: String(index).padStart(2, '0'),
  matrix_type: 'LP_GRADE',
  lens_model_id: '',
  eye_target: 'OD_OE',
  has_prescription: true,
  od_spherical: '0.00',
  od_cylindrical: '0.00',
  od_axis: '0',
  od_addition: '0.00',
  od_base_curve: '',
  oe_spherical: '0.00',
  oe_cylindrical: '0.00',
  oe_axis: '0',
  oe_addition: '0.00',
  oe_base_curve: '',
  service_type: 'Montagem Padrão',
  treatment: 'Incolor / Sem Tratamento',
  lens_unit_price: 0,
  lens_price: 0,
  service_price: 13.0,
  treatment_price: 0.0,
  total_amount: '',
  is_manual_total: false,
  special_instructions: ''
});

const EntradaMalote = ({ onNavigateToWorkflow }) => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [lensModels, setLensModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [batchRef, setBatchRef] = useState(() => {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    return `MALOTE-${dateStr}`;
  });
  const [loadingStores, setLoadingStores] = useState(true);
  const [storePriceTable, setStorePriceTable] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const [rows, setRows] = useState([
    createEmptyRow(1),
    createEmptyRow(2)
  ]);

  // Carrega lista de óticas e modelos de lentes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStores(true);
        setLoadingModels(true);
        const [storesRes, modelsRes] = await Promise.all([
          api.get('/optical-stores/').catch(() => ({ data: [] })),
          LensService.getModels().catch(() => ({ data: [] }))
        ]);

        const storeList = storesRes.data?.items || storesRes.data || [];
        setStores(storeList);
        if (storeList.length > 0 && !selectedStoreId) {
          setSelectedStoreId(storeList[0].id);
        }

        const modelList = modelsRes.data?.items || modelsRes.data || [];
        setLensModels(modelList);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      } finally {
        setLoadingStores(false);
        setLoadingModels(false);
      }
    };
    fetchData();
  }, []);

  // Carrega a tabela de preços personalizada da ótica selecionada
  useEffect(() => {
    if (!selectedStoreId) {
      setStorePriceTable(null);
      return;
    }
    let cancelled = false;
    api.get('/price-tables/', { params: { optical_store_id: selectedStoreId } })
      .then((res) => {
        if (cancelled) return;
        const tables = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        const active = tables.find(t => t.is_active !== false) || tables[0] || null;
        setStorePriceTable(active);
      })
      .catch(() => {
        if (!cancelled) setStorePriceTable(null);
      });
    return () => { cancelled = true; };
  }, [selectedStoreId]);

  // Atalho de teclado Alt + N para adicionar um novo pedido rapidamente no malote
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setRows(prev => [...prev, createEmptyRow(prev.length + 1)]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Resolve o preço unitário da lente respeitando a tabela personalizada ou desconto da ótica
  const resolveLensUnitPrice = (model) => {
    if (!model) return 0;
    const baseSale = parseFloat(model.sale_price || 0);
    if (storePriceTable) {
      const customItem = (storePriceTable.items || []).find(
        it => it.entity_type === 'product' && String(it.entity_id) === String(model.id)
      );
      if (customItem && customItem.custom_price !== undefined && customItem.custom_price !== null) {
        return Math.round(parseFloat(customItem.custom_price) * 100) / 100;
      }
      const discPct = parseFloat(storePriceTable.discount_percent || 0);
      if (discPct > 0 && baseSale > 0) {
        return Math.round(baseSale * (1 - discPct / 100) * 100) / 100;
      }
    }
    return baseSale;
  };

  // Recalcula valor de uma linha somente a partir da seleção da lente (preservando edição manual / desconto)
  const handleRowChange = (id, field, value) => {
    setRows(prevRows => prevRows.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };

      // Se o operador editou diretamente o Valor Total (desconto/acordo manual), respeita o valor digitado
      if (field === 'total_amount') {
        updated.total_amount = value;
        updated.is_manual_total = value !== '';
        return updated;
      }

      const pricingFields = ['matrix_type', 'lens_model_id', 'eye_target', 'service_type'];

      // Se mudou a matriz, limpa o modelo e o valor até que o operador selecione a lente desejada
      if (field === 'matrix_type') {
        const isMultifocalNext = value === 'MF_ACB' || value === 'MF_BLOCO';
        if (!isMultifocalNext) {
          updated.eye_target = 'OD_OE';
        }
        updated.lens_model_id = '';
        updated.lens_unit_price = 0;
        updated.lens_price = 0;
        updated.total_amount = '';
        updated.is_manual_total = false;
        return updated;
      }

      // Se mudou o modelo de lente específico na matriz
      if (field === 'lens_model_id') {
        if (!value) {
          updated.lens_unit_price = 0;
          updated.lens_price = 0;
          updated.total_amount = '';
          updated.is_manual_total = false;
          return updated;
        }
        const selectedM = lensModels.find(m => m.id === value);
        if (selectedM) {
          updated.lens_unit_price = resolveLensUnitPrice(selectedM);
          updated.treatment = selectedM.treatment || 'Incolor / Sem Tratamento';
        }
      }

      // Se mudou o serviço, ajusta o preço do serviço
      if (field === 'service_type') {
        const serv = SERVICE_OPTIONS.find(s => s.value === value);
        if (serv) {
          updated.service_price = serv.price;
        }
      }

      // Recalcula automaticamente o valor do par (2x) ou olho único (1x) + serviço somente se houver lente selecionada
      if (pricingFields.includes(field)) {
        if (!updated.lens_model_id) {
          updated.lens_price = 0;
          updated.total_amount = '';
          updated.is_manual_total = false;
        } else {
          const qty = (updated.eye_target || 'OD_OE') === 'OD_OE' ? 2 : 1;
          const unitPrice = parseFloat(updated.lens_unit_price || 0);
          const lPrice = Math.round(unitPrice * qty * 100) / 100;
          const sPrice = parseFloat(updated.service_price || 0);
          updated.lens_price = lPrice;
          updated.treatment_price = 0.0;
          updated.total_amount = Math.round((lPrice + sPrice) * 100) / 100;
          updated.is_manual_total = false;
        }
      }

      return updated;
    }));
  };

  // Adiciona nova linha (sem valor pré-carregado até selecionar a lente)
  const handleAddRow = () => {
    setRows(prev => [...prev, createEmptyRow(prev.length + 1)]);
  };

  // Duplica linha existente
  const handleDuplicateRow = (rowToClone) => {
    const clone = {
      ...rowToClone,
      id: Date.now() + Math.random(),
      client_order_number: '',
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
  const totalLenses = rows.reduce((acc, r) => acc + ((r.eye_target || 'OD_OE') === 'OD_OE' ? 2 : 1), 0);
  const totalBatchPrice = rows.reduce((acc, r) => acc + parseDiopter(r.total_amount), 0);

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
        auto_deduct_inventory: true,
        items: rows.map(r => {
          const isMultifocalRow = r.matrix_type === 'MF_ACB' || r.matrix_type === 'MF_BLOCO';
          const selectedModel = lensModels.find(m => m.id === r.lens_model_id);
          return {
            client_order_number: r.client_order_number?.trim() || null,
            client_name: "Consumidor Final",
            tray_number: r.tray_number?.trim() || null,
            matrix_type: r.matrix_type,
            lens_model_id: r.lens_model_id || null,
            eye_target: isMultifocalRow ? (r.eye_target || 'OD_OE') : 'OD_OE',
            has_prescription: r.has_prescription !== false,
            od_spherical: parseDiopter(r.od_spherical),
            od_cylindrical: parseDiopter(r.od_cylindrical),
            od_axis: Math.min(180, Math.max(0, parseInt(r.od_axis, 10) || 0)),
            od_addition: Math.abs(parseDiopter(r.od_addition)),
            od_base_curve: Math.abs(parseDiopter(r.od_base_curve)),
            oe_spherical: parseDiopter(r.oe_spherical),
            oe_cylindrical: parseDiopter(r.oe_cylindrical),
            oe_axis: Math.min(180, Math.max(0, parseInt(r.oe_axis, 10) || 0)),
            oe_addition: Math.abs(parseDiopter(r.oe_addition)),
            oe_base_curve: Math.abs(parseDiopter(r.oe_base_curve)),
            service_type: r.service_type,
            treatment: selectedModel?.treatment || r.treatment || 'Incolor / Sem Tratamento',
            lens_price: parseDiopter(r.lens_price),
            service_price: parseDiopter(r.service_price),
            treatment_price: 0.0,
            total_amount: parseDiopter(r.total_amount),
            special_instructions: r.special_instructions?.trim() || null
          };
        })
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
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '24px 20px' }}>
      
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
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}
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
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>OS Lab</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Nº da OS</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Grade / Modelo</th>
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
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{res.grade_name}</div>
                        {res.lens_model_name && res.lens_model_name !== res.grade_name && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{res.lens_model_name}</div>
                        )}
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
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
            
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
                    padding: '10px 12px',
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
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}
              />
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

        {/* LISTA DE PEDIDOS / CARDS MODULARES (LAYOUT TOTALMENTE VISÍVEL E ESPAÇOSO) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {rows.map((row, idx) => {
            const isMF = row.matrix_type === 'MF_ACB' || row.matrix_type === 'MF_BLOCO';
            const isBlocoVS = row.matrix_type === 'BLOCO_VS';
            const needsBaseCurve = isBlocoVS || isMF;
            const needsAddition = isMF;
            const eyeTarget = isMF ? (row.eye_target || 'OD_OE') : 'OD_OE';
            const hasPrescription = row.has_prescription !== false;
            const showOD = eyeTarget === 'OD_OE' || eyeTarget === 'OD';
            const showOE = eyeTarget === 'OD_OE' || eyeTarget === 'OE';
            const fieldCount = 3 + (needsBaseCurve ? 1 : 0) + (needsAddition ? 1 : 0);
            const modelsInMatrix = lensModels.filter(m => (m.matrix_type || 'LP_GRADE').trim().toUpperCase() === (row.matrix_type || 'LP_GRADE').trim().toUpperCase());

            return (
              <div 
                key={row.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid rgba(224, 230, 240, 0.95)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  padding: '18px 20px',
                  transition: 'all 0.15s ease',
                  overflowX: 'auto'
                }}
              >
                {/* Linha 1: Dados Comerciais do Pedido e Tipo de Lente */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'minmax(42px, 50px) minmax(110px, 0.85fr) minmax(145px, 1.1fr) minmax(220px, 1.9fr) minmax(140px, 1fr) minmax(160px, 1.05fr) minmax(118px, 0.85fr) minmax(82px, 88px)',
                  gap: '10px',
                  alignItems: 'end',
                  minWidth: '980px'
                }}>
                  
                  {/* Badge 01, 02... */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '5px', textAlign: 'center' }}>Item</label>
                    <div style={{
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.05)',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      color: 'hsl(var(--primary))'
                    }}>
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Nº da OS */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '5px' }}>
                      Nº da OS
                    </label>
                    <input
                      type="text"
                      value={row.client_order_number}
                      onChange={(e) => handleRowChange(row.id, 'client_order_number', e.target.value)}
                      placeholder="Ex: 1042"
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  {/* Grade Pertencente */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '5px' }}>
                      Grade da Lente *
                    </label>
                    <select
                      value={row.matrix_type}
                      onChange={(e) => handleRowChange(row.id, 'matrix_type', e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        background: row.matrix_type === 'GRADE_167' ? 'rgba(168, 85, 247, 0.08)' : row.matrix_type.startsWith('MF') ? 'rgba(245, 158, 11, 0.08)' : isBlocoVS ? 'rgba(14, 165, 233, 0.08)' : 'white',
                        color: 'hsl(var(--text-primary))'
                      }}
                    >
                      {MATRIX_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Modelo de Lente Disponível na Matriz Selecionada */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        Modelo de Lente *
                      </label>
                      {modelsInMatrix.length > 0 && (
                        <span style={{ fontSize: '0.66rem', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                          {modelsInMatrix.length} disp.
                        </span>
                      )}
                    </div>
                    <select
                      value={row.lens_model_id || ''}
                      onChange={(e) => handleRowChange(row.id, 'lens_model_id', e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 8px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: 'white',
                        color: row.lens_model_id ? 'hsl(var(--text-primary))' : '#64748b'
                      }}
                    >
                      {modelsInMatrix.length === 0 ? (
                        <option value="">Padrão da Matriz</option>
                      ) : (
                        <>
                          <option value="">-- Selecione o Modelo --</option>
                          {modelsInMatrix.map(m => {
                            const unitP = resolveLensUnitPrice(m);
                            return (
                              <option key={m.id} value={m.id}>
                                {m.brand || m.name} — {m.treatment || 'Incolor'} | {m.material || 'Resina'} (n={m.refractive_index || '1.56'}) — R$ {unitP.toFixed(2)}/un (Par: R$ {(unitP * 2).toFixed(2)})
                              </option>
                            );
                          })}
                        </>
                      )}
                    </select>
                  </div>

                  {/* Serviço Técnico */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '5px' }}>
                      Serviço Técnico
                    </label>
                    <select
                      value={row.service_type}
                      onChange={(e) => handleRowChange(row.id, 'service_type', e.target.value)}
                      style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    >
                      {SERVICE_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Receita (Com Receita / Sem Receita) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '5px' }}>
                      Receita
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      height: '38px',
                      background: '#f1f5f9',
                      borderRadius: '8px',
                      padding: '3px',
                      border: '1px solid #cbd5e1',
                      gap: '3px'
                    }}>
                      <button
                        type="button"
                        onClick={() => handleRowChange(row.id, 'has_prescription', true)}
                        style={{
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                          background: hasPrescription ? 'hsl(var(--primary))' : 'transparent',
                          color: hasPrescription ? 'white' : '#475569'
                        }}
                      >
                        Com Receita
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRowChange(row.id, 'has_prescription', false)}
                        style={{
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                          background: !hasPrescription ? '#475569' : 'transparent',
                          color: !hasPrescription ? 'white' : '#475569'
                        }}
                      >
                        Sem Receita
                      </button>
                    </div>
                  </div>

                  {/* Valor Total da OS (Calculado por Par / Olho Único e Editável para Desconto) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        Valor Total
                      </label>
                      {row.is_manual_total ? (
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '1px 4px', borderRadius: '4px' }}>
                          Desc/Manual
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.64rem', fontWeight: 600, color: '#64748b' }}>
                          {eyeTarget === 'OD_OE' ? 'Par' : '1 un'}
                        </span>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '38px',
                      border: row.is_manual_total ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0 8px',
                      background: row.is_manual_total ? '#fffbeb' : 'white'
                    }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.total_amount}
                        placeholder="0,00"
                        onChange={(e) => handleRowChange(row.id, 'total_amount', e.target.value)}
                        title="Valor calculado automaticamente (par ou olho único + serviço). Editável para aplicar desconto."
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', height: '38px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleDuplicateRow(row)}
                      title="Duplicar este pedido"
                      style={{
                        height: '38px',
                        width: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: 'white',
                        cursor: 'pointer',
                        color: '#475569'
                      }}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      title="Remover pedido"
                      style={{
                        height: '38px',
                        width: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        cursor: 'pointer',
                        color: '#dc2626'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>

                {/* Linha 2: Seletor de Olho (somente Multifocal / MF Acabado) + Dioptrias OD/OE lado a lado (sempre visíveis) */}
                <div style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minWidth: '980px'
                }}>

                  {/* Barra superior de seleção de olho — exibida SOMENTE para Multifocal e Multifocal Acabado */}
                  {isMF && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px dashed #cbd5e1'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          Seleção de Olho (Baixa):
                        </span>
                        <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '7px', padding: '2px', gap: '2px' }}>
                          {EYE_TARGET_OPTIONS.map(opt => {
                            const active = eyeTarget === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleRowChange(row.id, 'eye_target', opt.value)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '5px',
                                  border: 'none',
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.12s ease',
                                  background: active ? 'hsl(var(--primary))' : 'transparent',
                                  color: active ? 'white' : '#475569',
                                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
                                }}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grade Lado a Lado (OD à esquerda, OE à direita — nunca quebra para linha de baixo) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: (showOD && showOE) ? '1fr 1fr' : 'minmax(360px, 560px)',
                    gap: '12px',
                    alignItems: 'stretch'
                  }}>

                        {/* Bloco OD (Olho Direito) */}
                        {showOD && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'white',
                            border: '1px solid rgba(59, 130, 246, 0.28)',
                            borderRadius: '8px',
                            padding: '8px 10px'
                          }}>
                            <span style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              background: 'rgba(59, 130, 246, 0.12)',
                              color: '#2563eb',
                              flexShrink: 0
                            }}>
                              OD
                            </span>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(${fieldCount}, minmax(0, 1fr))`,
                              gap: '6px',
                              flex: 1
                            }}>
                              {needsBaseCurve && (
                                <div>
                                  <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#0284c7', display: 'block', marginBottom: '2px' }}>Base *</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={row.od_base_curve}
                                    onChange={(e) => handleRowChange(row.id, 'od_base_curve', sanitizeDiopterInput(e.target.value, false))}
                                    onBlur={(e) => handleRowChange(row.id, 'od_base_curve', formatDiopterOnBlur(e.target.value, { allowNegative: false, emptyIfBlank: true }))}
                                    placeholder="4.00"
                                    style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1.5px solid #0284c7', background: '#f0f9ff', fontSize: '0.8rem', fontWeight: 800, color: '#0369a1' }}
                                  />
                                </div>
                              )}

                              <div>
                                <span style={{ fontSize: '0.67rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Esférico</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={row.od_spherical}
                                  onChange={(e) => handleRowChange(row.id, 'od_spherical', sanitizeDiopterInput(e.target.value, true))}
                                  onBlur={(e) => handleRowChange(row.id, 'od_spherical', formatDiopterOnBlur(e.target.value, { allowNegative: true }))}
                                  placeholder="0.00"
                                  style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: 'white' }}
                                />
                              </div>

                              <div>
                                <span style={{ fontSize: '0.67rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Cilíndrico</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={row.od_cylindrical}
                                  onChange={(e) => handleRowChange(row.id, 'od_cylindrical', sanitizeDiopterInput(e.target.value, true))}
                                  onBlur={(e) => handleRowChange(row.id, 'od_cylindrical', formatDiopterOnBlur(e.target.value, { allowNegative: true }))}
                                  placeholder="0.00"
                                  style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: 'white' }}
                                />
                              </div>

                              <div>
                                <span style={{ fontSize: '0.67rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Eixo (°)</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={row.od_axis}
                                  onChange={(e) => handleRowChange(row.id, 'od_axis', e.target.value.replace(/[^0-9]/g, ''))}
                                  onBlur={(e) => handleRowChange(row.id, 'od_axis', String(Math.min(180, Math.max(0, parseInt(e.target.value, 10) || 0))))}
                                  placeholder="0"
                                  style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: 'white' }}
                                />
                              </div>

                              {needsAddition && (
                                <div>
                                  <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#d97706', display: 'block', marginBottom: '2px' }}>Adição *</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={row.od_addition}
                                    onChange={(e) => handleRowChange(row.id, 'od_addition', sanitizeDiopterInput(e.target.value, false))}
                                    onBlur={(e) => handleRowChange(row.id, 'od_addition', formatDiopterOnBlur(e.target.value, { allowNegative: false }))}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1.5px solid #f59e0b', background: '#fffbeb', fontSize: '0.8rem', fontWeight: 800, color: '#b45309' }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bloco OE (Olho Esquerdo) */}
                        {showOE && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'white',
                            border: '1px solid rgba(147, 51, 234, 0.28)',
                            borderRadius: '8px',
                            padding: '8px 10px'
                          }}>
                            <span style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              background: 'rgba(147, 51, 234, 0.12)',
                              color: '#7e22ce',
                              flexShrink: 0
                            }}>
                              OE
                            </span>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(${fieldCount}, minmax(0, 1fr))`,
                              gap: '6px',
                              flex: 1
                            }}>
                              {needsBaseCurve && (
                                <div>
                                  <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#0284c7', display: 'block', marginBottom: '2px' }}>Base *</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={row.oe_base_curve}
                                    onChange={(e) => handleRowChange(row.id, 'oe_base_curve', sanitizeDiopterInput(e.target.value, false))}
                                    onBlur={(e) => handleRowChange(row.id, 'oe_base_curve', formatDiopterOnBlur(e.target.value, { allowNegative: false, emptyIfBlank: true }))}
                                    placeholder="4.00"
                                    style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1.5px solid #0284c7', background: '#f0f9ff', fontSize: '0.8rem', fontWeight: 800, color: '#0369a1' }}
                                  />
                                </div>
                              )}

                              <div>
                                <span style={{ fontSize: '0.67rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Esférico</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={row.oe_spherical}
                                  onChange={(e) => handleRowChange(row.id, 'oe_spherical', sanitizeDiopterInput(e.target.value, true))}
                                  onBlur={(e) => handleRowChange(row.id, 'oe_spherical', formatDiopterOnBlur(e.target.value, { allowNegative: true }))}
                                  placeholder="0.00"
                                  style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: 'white' }}
                                />
                              </div>

                              <div>
                                <span style={{ fontSize: '0.67rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Cilíndrico</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={row.oe_cylindrical}
                                  onChange={(e) => handleRowChange(row.id, 'oe_cylindrical', sanitizeDiopterInput(e.target.value, true))}
                                  onBlur={(e) => handleRowChange(row.id, 'oe_cylindrical', formatDiopterOnBlur(e.target.value, { allowNegative: true }))}
                                  placeholder="0.00"
                                  style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: 'white' }}
                                />
                              </div>

                              <div>
                                <span style={{ fontSize: '0.67rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Eixo (°)</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={row.oe_axis}
                                  onChange={(e) => handleRowChange(row.id, 'oe_axis', e.target.value.replace(/[^0-9]/g, ''))}
                                  onBlur={(e) => handleRowChange(row.id, 'oe_axis', String(Math.min(180, Math.max(0, parseInt(e.target.value, 10) || 0))))}
                                  placeholder="0"
                                  style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: 'white' }}
                                />
                              </div>

                              {needsAddition && (
                                <div>
                                  <span style={{ fontSize: '0.67rem', fontWeight: 800, color: '#d97706', display: 'block', marginBottom: '2px' }}>Adição *</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={row.oe_addition}
                                    onChange={(e) => handleRowChange(row.id, 'oe_addition', sanitizeDiopterInput(e.target.value, false))}
                                    onBlur={(e) => handleRowChange(row.id, 'oe_addition', formatDiopterOnBlur(e.target.value, { allowNegative: false }))}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '4px 4px', textAlign: 'center', borderRadius: '6px', border: '1.5px solid #f59e0b', background: '#fffbeb', fontSize: '0.8rem', fontWeight: 800, color: '#b45309' }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Barra de Ações Inferior e Totalizadores */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'white',
          padding: '18px 24px',
          borderRadius: '12px',
          border: '1px solid rgba(224, 230, 240, 0.9)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          
          <button
            type="button"
            onClick={handleAddRow}
            className="btn btn-secondary"
            title="Atalho de teclado: Alt + N"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 700 }}
          >
            <Plus size={18} /> Adicionar Mais um Pedido (Alt+N)
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            
            <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', alignItems: 'center' }}>
              <div>
                <span style={{ color: '#64748b' }}>Pedidos:</span> <strong>{totalOrders} óculos</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Lentes:</span> <strong>{totalLenses} un</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Total do Malote:</span> <strong style={{ color: 'hsl(var(--primary))', fontSize: '1.2rem', marginLeft: '4px' }}>R$ {totalBatchPrice.toFixed(2)}</strong>
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
