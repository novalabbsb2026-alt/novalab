import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Copy, Send, CheckCircle2, AlertTriangle, 
  Store, Package, Activity, RefreshCw, Check
} from 'lucide-react';
import api from '../services/api';
import {
  getCachedOpticalStores,
  getCachedLensModels,
  getCachedInventoryGrid,
} from '../utils/catalogCache';
import {
  MATRIX_OPTIONS,
  EYE_TARGET_OPTIONS,
  SERVICE_OPTIONS,
  parseDiopter,
  sanitizeDiopterInput,
  formatDiopterOnBlur,
  createEmptyRow,
  checkEyeInventoryBalance,
} from './malote/maloteHelpers';
import LensModelCombobox from './malote/LensModelCombobox';

const EntradaMalote = ({ onNavigateToWorkflow }) => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [lensModels, setLensModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [inventoryByModel, setInventoryByModel] = useState({});
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
    createEmptyRow(1)
  ]);

  // Carrega lista de óticas e modelos de lentes via cache compartilhado
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingStores(true);
        setLoadingModels(true);
        const [storeList, modelList] = await Promise.all([
          getCachedOpticalStores().catch(() => []),
          getCachedLensModels().catch(() => [])
        ]);

        setStores(storeList);
        if (storeList.length > 0 && !selectedStoreId) {
          setSelectedStoreId(storeList[0].id);
        }

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

  // Carrega grade de estoque em cache para os modelos selecionados nas linhas (validação prévia de saldo)
  useEffect(() => {
    const modelIds = Array.from(new Set(rows.map((r) => r.lens_model_id).filter(Boolean)));
    modelIds.forEach((mid) => {
      if (!inventoryByModel[mid]) {
        getCachedInventoryGrid(mid).then((grid) => {
          setInventoryByModel((prev) => ({ ...prev, [mid]: grid }));
        });
      }
    });
  }, [rows, inventoryByModel]);

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

      // Se mudou a matriz, limpa o modelo; se for Somente Serviço, preenche o valor do serviço técnico
      if (field === 'matrix_type') {
        const isServiceOnlyNext = value === 'SOMENTE_SERVICO';
        const isMultifocalNext = value === 'MF_ACB' || value === 'MF_BLOCO';
        if (!isMultifocalNext) {
          updated.eye_target = 'OD_OE';
        }
        updated.lens_model_id = '';
        updated.lens_unit_price = 0;
        updated.lens_price = 0;
        updated.is_manual_total = false;

        if (isServiceOnlyNext) {
          // Garante um serviço real selecionado (não "Sem Montagem")
          if (!updated.service_type || updated.service_type.includes('Sem Montagem')) {
            const firstRealService = SERVICE_OPTIONS[0];
            updated.service_type = firstRealService.value;
            updated.service_price = firstRealService.price;
          }
          updated.total_amount = Math.round(parseFloat(updated.service_price || 0) * 100) / 100;
        } else {
          updated.total_amount = '';
        }
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

      // Recalcula automaticamente: para Somente Serviço usa só o preço do serviço; para Lentes exige modelo selecionado
      if (pricingFields.includes(field)) {
        if (updated.matrix_type === 'SOMENTE_SERVICO') {
          const sPrice = parseFloat(updated.service_price || 0);
          updated.lens_price = 0;
          updated.treatment_price = 0.0;
          updated.total_amount = Math.round(sPrice * 100) / 100;
          updated.is_manual_total = false;
        } else if (!updated.lens_model_id) {
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
  const totalLenses = rows.reduce((acc, r) => {
    if (r.matrix_type === 'SOMENTE_SERVICO') return acc;
    return acc + ((r.eye_target || 'OD_OE') === 'OD_OE' ? 2 : 1);
  }, 0);
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
        batch_reference: rows.length > 1 ? (batchRef.trim() || undefined) : undefined,
        initial_status: "EM_PRODUCAO",
        auto_deduct_inventory: true,
        items: rows.map(r => {
          const isServiceOnlyRow = r.matrix_type === 'SOMENTE_SERVICO';
          const isMultifocalRow = r.matrix_type === 'MF_ACB' || r.matrix_type === 'MF_BLOCO';
          const selectedModel = isServiceOnlyRow ? null : lensModels.find(m => m.id === r.lens_model_id);
          return {
            client_order_number: r.client_order_number?.trim() || null,
            client_name: "Consumidor Final",
            tray_number: r.tray_number?.trim() || null,
            matrix_type: r.matrix_type,
            os_type: isServiceOnlyRow ? 'REPARO_SERVICO' : 'PADRAO',
            lens_model_id: isServiceOnlyRow ? null : (r.lens_model_id || null),
            eye_target: isServiceOnlyRow ? 'NONE' : (isMultifocalRow ? (r.eye_target || 'OD_OE') : 'OD_OE'),
            has_prescription: isServiceOnlyRow ? false : (r.has_prescription !== false),
            od_spherical: isServiceOnlyRow ? 0.0 : parseDiopter(r.od_spherical),
            od_cylindrical: isServiceOnlyRow ? 0.0 : parseDiopter(r.od_cylindrical),
            od_axis: isServiceOnlyRow ? 0 : Math.min(180, Math.max(0, parseInt(r.od_axis, 10) || 0)),
            od_addition: isServiceOnlyRow ? 0.0 : Math.abs(parseDiopter(r.od_addition)),
            od_base_curve: isServiceOnlyRow ? 0.0 : Math.abs(parseDiopter(r.od_base_curve)),
            oe_spherical: isServiceOnlyRow ? 0.0 : parseDiopter(r.oe_spherical),
            oe_cylindrical: isServiceOnlyRow ? 0.0 : parseDiopter(r.oe_cylindrical),
            oe_axis: isServiceOnlyRow ? 0 : Math.min(180, Math.max(0, parseInt(r.oe_axis, 10) || 0)),
            oe_addition: isServiceOnlyRow ? 0.0 : Math.abs(parseDiopter(r.oe_addition)),
            oe_base_curve: isServiceOnlyRow ? 0.0 : Math.abs(parseDiopter(r.oe_base_curve)),
            service_type: r.service_type,
            treatment: isServiceOnlyRow ? 'Sem Lente' : (selectedModel?.treatment || r.treatment || 'Incolor / Sem Tratamento'),
            lens_price: isServiceOnlyRow ? 0.0 : parseDiopter(r.lens_price),
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
    setRows([createEmptyRow(1)]);
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
                Registrar OS
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                Registre uma ou múltiplas ordens de serviço da ótica parceira com baixa automática de lentes e faturamento consolidado.
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
                {successResult.total_orders_created > 1 ? 'Malote Lançado com Sucesso!' : 'OS Registrada com Sucesso!'}
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
                        {res.grade_name === 'Somente Serviço' ? (
                          <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
                            Sem lente
                          </span>
                        ) : res.inventory_deducted ? (
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
                {successResult.total_orders_created > 1 ? 'Lançar Outro Malote' : 'Registrar Nova OS'}
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
                      {st.lab_nickname ? `${st.lab_nickname} — ` : ''}{st.trade_name || st.corporate_name} {st.cnpj ? `(${st.cnpj})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Referência do Malote — exibida somente quando há mais de 1 item no lote */}
            {rows.length > 1 && (
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
            )}

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
            const isServiceOnly = row.matrix_type === 'SOMENTE_SERVICO';
            const isMF = row.matrix_type === 'MF_ACB' || row.matrix_type === 'MF_BLOCO';
            const isBlocoVS = row.matrix_type === 'BLOCO_VS';
            const needsBaseCurve = isBlocoVS || isMF;
            const needsAddition = isMF;
            const eyeTarget = isMF ? (row.eye_target || 'OD_OE') : 'OD_OE';
            const hasPrescription = row.has_prescription !== false;
            const showOD = !isServiceOnly && (eyeTarget === 'OD_OE' || eyeTarget === 'OD');
            const showOE = !isServiceOnly && (eyeTarget === 'OD_OE' || eyeTarget === 'OE');
            const fieldCount = 3 + (needsBaseCurve ? 1 : 0) + (needsAddition ? 1 : 0);
            const modelsInMatrix = isServiceOnly ? [] : lensModels.filter(m => (m.matrix_type || 'LP_GRADE').trim().toUpperCase() === (row.matrix_type || 'LP_GRADE').trim().toUpperCase());
            const availableServiceOptions = isServiceOnly
              ? SERVICE_OPTIONS.filter(s => !s.value.includes('Sem Montagem'))
              : SERVICE_OPTIONS;
            const modelGrid = row.lens_model_id ? inventoryByModel[row.lens_model_id] : null;
            const odStock = modelGrid
              ? checkEyeInventoryBalance(modelGrid, row.matrix_type, 'OD', {
                  spherical: row.od_spherical,
                  cylindrical: row.od_cylindrical,
                  addition: row.od_addition,
                  baseCurve: row.od_base_curve,
                })
              : null;
            const oeStock = modelGrid
              ? checkEyeInventoryBalance(modelGrid, row.matrix_type, 'OE', {
                  spherical: row.oe_spherical,
                  cylindrical: row.oe_cylindrical,
                  addition: row.oe_addition,
                  baseCurve: row.oe_base_curve,
                })
              : null;

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

                  {/* Modelo de Lente com Busca (Combobox) ou indicador de Somente Serviço */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        {isServiceOnly ? 'Lente' : 'Modelo de Lente *'}
                      </label>
                      {!isServiceOnly && modelsInMatrix.length > 0 && (
                        <span style={{ fontSize: '0.66rem', color: '#059669', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                          {modelsInMatrix.length} disp.
                        </span>
                      )}
                    </div>
                    {isServiceOnly ? (
                      <div style={{
                        height: '38px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: '1px dashed #94a3b8',
                        background: '#f8fafc',
                        color: '#475569',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        Sem lente (apenas serviço técnico)
                      </div>
                    ) : (
                      <LensModelCombobox
                        models={modelsInMatrix}
                        value={row.lens_model_id || ''}
                        onChange={(newId) => handleRowChange(row.id, 'lens_model_id', newId)}
                        resolveUnitPrice={resolveLensUnitPrice}
                      />
                    )}
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
                      {availableServiceOptions.map(s => (
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
                          {isServiceOnly ? 'Serviço' : (eyeTarget === 'OD_OE' ? 'Par' : '1 un')}
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

                {/* Linha 2: Observação do Serviço (quando Somente Serviço) OU Dioptrias OD/OE */}
                {isServiceOnly ? (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '980px'
                  }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', whiteSpace: 'nowrap' }}>
                      Descrição / Obs. do Serviço:
                    </span>
                    <input
                      type="text"
                      value={row.special_instructions}
                      onChange={(e) => handleRowChange(row.id, 'special_instructions', e.target.value)}
                      placeholder="Ex: Montagem em armação própria, troca de plaquetas, solda na haste, coloração..."
                      style={{
                        flex: 1,
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        background: 'white'
                      }}
                    />
                  </div>
                ) : (
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                              <span style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: 'rgba(59, 130, 246, 0.12)',
                                color: '#2563eb'
                              }}>
                                OD
                              </span>
                              {odStock && odStock.status !== 'unknown' && (
                                <span
                                  title={odStock.status === 'ok' ? `Saldo livre disponível: ${odStock.available} un` : 'Sem saldo disponível nesta dioptria/grade'}
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    background: odStock.status === 'ok' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.12)',
                                    color: odStock.status === 'ok' ? '#047857' : '#dc2626',
                                  }}
                                >
                                  {odStock.status === 'ok' ? `✓ ${odStock.available} un` : 'Sem saldo'}
                                </span>
                              )}
                            </div>

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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                              <span style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: 'rgba(147, 51, 234, 0.12)',
                                color: '#7e22ce'
                              }}>
                                OE
                              </span>
                              {oeStock && oeStock.status !== 'unknown' && (
                                <span
                                  title={oeStock.status === 'ok' ? `Saldo livre disponível: ${oeStock.available} un` : 'Sem saldo disponível nesta dioptria/grade'}
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    background: oeStock.status === 'ok' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.12)',
                                    color: oeStock.status === 'ok' ? '#047857' : '#dc2626',
                                  }}
                                >
                                  {oeStock.status === 'ok' ? `✓ ${oeStock.available} un` : 'Sem saldo'}
                                </span>
                              )}
                            </div>

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
                )}

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
                <span style={{ color: '#64748b' }}>{totalOrders > 1 ? 'Total do Malote:' : 'Total:'}</span> <strong style={{ color: 'hsl(var(--primary))', fontSize: '1.2rem', marginLeft: '4px' }}>R$ {totalBatchPrice.toFixed(2)}</strong>
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
                  <RefreshCw size={18} className="spin" /> {totalOrders > 1 ? 'Processando Malote...' : 'Registrando OS...'}
                </>
              ) : (
                <>
                  <Send size={18} /> {totalOrders > 1 ? `Lançar Malote no Laboratório (${totalOrders} Pedidos)` : 'Registrar OS no Laboratório'}
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
