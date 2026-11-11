import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getBaseUrl } from '../services/api';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit2,
  ArrowRight,
  Shield,
  Phone,
  MapPin,
  X,
  Crown,
  Layers
} from 'lucide-react';

export default function PainelLaboratorios({ currentActiveTenantId, onTenantChange }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    cnpj: '',
    telephone: '',
    address: '',
    cep: '',
    ie: '',
    plan_tier: 'enterprise',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('factory_token');
      const res = await axios.get(`${getBaseUrl()}/tenants/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenants(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Erro ao carregar a lista de laboratórios.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlugify = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.slug) {
      setError('Nome e Identificador (Slug) são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('factory_token');
      await axios.post(`${getBaseUrl()}/tenants/`, createForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Laboratório "${createForm.name}" provisionado com sucesso!`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        slug: '',
        cnpj: '',
        telephone: '',
        address: '',
        cep: '',
        ie: '',
        plan_tier: 'enterprise',
        admin_name: '',
        admin_email: '',
        admin_password: '',
      });
      await loadTenants();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Erro ao provisionar novo laboratório.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('factory_token');
      await axios.put(`${getBaseUrl()}/tenants/${editingTenant.id}`, editingTenant, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Laboratório "${editingTenant.name}" atualizado com sucesso!`);
      setEditingTenant(null);
      await loadTenants();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Erro ao atualizar dados do laboratório.');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchSession = (tenant) => {
    localStorage.setItem('factory_active_tenant_id', tenant.id);
    localStorage.setItem('factory_tenant_name', tenant.name);
    localStorage.setItem('factory_tenant_slug', tenant.slug);
    if (onTenantChange) {
      onTenantChange(tenant);
    }
    window.location.reload();
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.cnpj && t.cnpj.includes(searchTerm));
    
    if (filterStatus === 'ACTIVE') return matchesSearch && t.is_active;
    if (filterStatus === 'INACTIVE') return matchesSearch && !t.is_active;
    return matchesSearch;
  });

  const totalActive = tenants.filter(t => t.is_active).length;
  const totalEnterprise = tenants.filter(t => t.plan_tier === 'enterprise').length;
  const activeTenantName = localStorage.getItem('factory_tenant_name') || 'Nova LAB Matriz';

  return (
    <div style={{
      width: '100%',
      padding: '24px 32px',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: '#1e293b'
    }}>
      {/* Cabeçalho da Página */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Gestão de Laboratórios
            </h1>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #c7d2fe'
            }}>
              Multi-Tenant SuperAdmin
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Controle global de laboratórios cadastrados, criação de filiais e alternância de sessão.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadTenants}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#4f46e5',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Plus size={16} />
            Novo Laboratório
          </button>
        </div>
      </div>

      {/* Cards de Métricas (Compactos e em 1 linha) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Total Cadastrados</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{tenants.length}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Laboratórios Ativos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>{totalActive}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: '#fffbeb',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Crown size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Plano Enterprise</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>{totalEnterprise}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#faf5ff',
          padding: '14px 18px',
          borderRadius: '8px',
          border: '1px solid #d8b4fe',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: '#9333ea',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Shield size={18} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', color: '#7e22ce', fontWeight: 600 }}>Sessão Ativa no Momento</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#581c87', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeTenantName}
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          color: '#b91c1c',
          marginBottom: '16px',
          fontSize: '0.85rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          color: '#15803d',
          marginBottom: '16px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Filtros e Busca */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por nome, slug ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.84rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilterStatus('ALL')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: filterStatus === 'ALL' ? '1px solid #4f46e5' : '1px solid #cbd5e1',
              backgroundColor: filterStatus === 'ALL' ? '#eef2ff' : '#ffffff',
              color: filterStatus === 'ALL' ? '#4338ca' : '#475569',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Todos ({tenants.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: filterStatus === 'ACTIVE' ? '1px solid #16a34a' : '1px solid #cbd5e1',
              backgroundColor: filterStatus === 'ACTIVE' ? '#f0fdf4' : '#ffffff',
              color: filterStatus === 'ACTIVE' ? '#15803d' : '#475569',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Ativos ({totalActive})
          </button>
          <button
            onClick={() => setFilterStatus('INACTIVE')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              border: filterStatus === 'INACTIVE' ? '1px solid #ef4444' : '1px solid #cbd5e1',
              backgroundColor: filterStatus === 'INACTIVE' ? '#fef2f2' : '#ffffff',
              color: filterStatus === 'INACTIVE' ? '#b91c1c' : '#475569',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Inativos ({tenants.length - totalActive})
          </button>
        </div>
      </div>

      {/* Tabela de Laboratórios */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569' }}>Laboratório</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569' }}>Slug (URL)</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569' }}>CNPJ</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569' }}>Telefone</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569' }}>Plano</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569' }}>Status</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && tenants.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
                    Carregando laboratórios...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Nenhum laboratório encontrado.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isCurrent = (t.id === (localStorage.getItem('factory_active_tenant_id') || currentActiveTenantId));
                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isCurrent ? '#f8faff' : '#ffffff'
                      }}
                    >
                      {/* Nome */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{t.name}</span>
                          {isCurrent && (
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              backgroundColor: '#e0e7ff',
                              color: '#4338ca',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              Sessão Ativa
                            </span>
                          )}
                        </div>
                        {t.address && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                            {t.address}
                          </div>
                        )}
                      </td>

                      {/* Slug */}
                      <td style={{ padding: '10px 16px' }}>
                        <code style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          backgroundColor: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: '#475569'
                        }}>
                          {t.slug}
                        </code>
                      </td>

                      {/* CNPJ */}
                      <td style={{ padding: '10px 16px', color: '#334155' }}>
                        {t.cnpj || '—'}
                      </td>

                      {/* Telefone */}
                      <td style={{ padding: '10px 16px', color: '#334155' }}>
                        {t.telephone || '—'}
                      </td>

                      {/* Plano */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: t.plan_tier === 'enterprise' ? '#fef3c7' : '#eef2ff',
                          color: t.plan_tier === 'enterprise' ? '#b45309' : '#4338ca'
                        }}>
                          {t.plan_tier}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 16px' }}>
                        {t.is_active ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#15803d',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            <CheckCircle2 size={13} /> Ativo
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#b91c1c',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            <XCircle size={13} /> Inativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setEditingTenant(t)}
                            title="Editar dados cadastrais"
                            style={{
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#475569',
                              padding: '4px 8px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            <Edit2 size={12} /> Editar
                          </button>

                          {isCurrent ? (
                            <span style={{
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#4f46e5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={13} /> Em Uso
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSwitchSession(t)}
                              style={{
                                border: '1px solid #c7d2fe',
                                backgroundColor: '#eef2ff',
                                color: '#4338ca',
                                padding: '4px 10px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              Entrar <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CRIAR NOVO LABORATÓRIO */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Provisionar Novo Laboratório Óptico
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                  Crie um novo ambiente independente para o laboratório parceiro.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Nome Fantasia / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Laboratório Vision"
                    value={createForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCreateForm(prev => ({
                        ...prev,
                        name,
                        slug: prev.slug === '' || prev.slug === handleSlugify(prev.name) ? handleSlugify(name) : prev.slug
                      }));
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Identificador Único (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: optica-vision"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().trim() }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={createForm.cnpj}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={createForm.telephone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, telephone: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Principal, 1000 - Centro"
                    value={createForm.address}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Plano de Assinatura
                  </label>
                  <select
                    value={createForm.plan_tier}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, plan_tier: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="enterprise">Enterprise (Ilimitado + BI + Multi-Filiais)</option>
                    <option value="pro">Pro (Fábrica + Gestão Financeira)</option>
                    <option value="starter">Starter (Estoque & Grade)</option>
                  </select>
                </div>
              </div>

              {/* Administrador do laboratório */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Shield size={14} style={{ color: '#4f46e5' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                    Administrador Inicial do Laboratório
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#475569', marginBottom: '3px' }}>
                      Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Silva"
                      value={createForm.admin_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_name: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#475569', marginBottom: '3px' }}>
                      E-mail Login
                    </label>
                    <input
                      type="email"
                      placeholder="admin@vision.com"
                      value={createForm.admin_email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_email: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#475569', marginBottom: '3px' }}>
                      Senha
                    </label>
                    <input
                      type="password"
                      placeholder="Mín. 6 dígitos"
                      value={createForm.admin_password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_password: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Provisionando...' : 'Salvar e Provisionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DADOS DO LABORATÓRIO */}
      {editingTenant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={16} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  Editar: {editingTenant.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Nome Fantasia / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTenant.name}
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={editingTenant.cnpj || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, cnpj: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editingTenant.telephone || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, telephone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Plano de Assinatura
                  </label>
                  <select
                    value={editingTenant.plan_tier}
                    onChange={(e) => setEditingTenant({ ...editingTenant, plan_tier: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="enterprise">Enterprise</option>
                    <option value="pro">Pro</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={editingTenant.address || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, address: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="tenant_active"
                    checked={editingTenant.is_active}
                    onChange={(e) => setEditingTenant({ ...editingTenant, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                  />
                  <label htmlFor="tenant_active" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                    Laboratório Ativo (Permitir acesso de seus operadores e faturamento)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
