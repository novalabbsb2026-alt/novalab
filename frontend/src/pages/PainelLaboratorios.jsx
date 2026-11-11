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
  FileText,
  Users,
  ExternalLink,
  Save,
  X,
  Layers,
  Crown
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

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
                Painel de Gestão de Laboratórios
              </h2>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                letterSpacing: '0.5px'
              }}>
                Multi-Tenant SuperAdmin
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
              Administre todas as fábricas e laboratórios cadastrados com isolamento completo de banco de dados e dados contábeis.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadTenants}
            disabled={loading}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Plus size={18} />
            Novo Laboratório
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'hsl(var(--bg-card))',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#e0e7ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Total de Laboratórios</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>{tenants.length}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'hsl(var(--bg-card))',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Laboratórios Ativos</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>{totalActive}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'hsl(var(--bg-card))',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Crown size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Plano Enterprise</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{totalEnterprise}</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'hsl(var(--bg-card))',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #6366f1',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#f5f3ff',
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 700 }}>Sessão Ativa Agora</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'hsl(var(--text-primary))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
              {localStorage.getItem('factory_tenant_name') || 'Nova LAB Matriz'}
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          color: '#b91c1c',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          color: '#15803d',
          marginBottom: '20px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}

      {/* Toolbar & Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', maxWidth: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar por nome, slug ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--bg-card))',
                fontSize: '0.88rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterStatus('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: filterStatus === 'ALL' ? '2px solid #4f46e5' : '1px solid hsl(var(--border))',
              backgroundColor: filterStatus === 'ALL' ? '#eef2ff' : 'hsl(var(--bg-card))',
              color: filterStatus === 'ALL' ? '#4338ca' : 'hsl(var(--text-muted))',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Todos ({tenants.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: filterStatus === 'ACTIVE' ? '2px solid #16a34a' : '1px solid hsl(var(--border))',
              backgroundColor: filterStatus === 'ACTIVE' ? '#f0fdf4' : 'hsl(var(--bg-card))',
              color: filterStatus === 'ACTIVE' ? '#15803d' : 'hsl(var(--text-muted))',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Ativos ({totalActive})
          </button>
          <button
            onClick={() => setFilterStatus('INACTIVE')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: filterStatus === 'INACTIVE' ? '2px solid #ef4444' : '1px solid hsl(var(--border))',
              backgroundColor: filterStatus === 'INACTIVE' ? '#fef2f2' : 'hsl(var(--bg-card))',
              color: filterStatus === 'INACTIVE' ? '#b91c1c' : 'hsl(var(--text-muted))',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Inativos ({tenants.length - totalActive})
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div style={{
        backgroundColor: 'hsl(var(--bg-card))',
        borderRadius: '14px',
        border: '1px solid hsl(var(--border))',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsl(var(--bg-muted, 210 40% 96%))', borderBottom: '1px solid hsl(var(--border))' }}>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>Laboratório</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>Identificador (Slug)</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>CNPJ & Contato</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>Plano</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>Status</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: 'hsl(var(--text-muted))', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && tenants.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    Carregando laboratórios...
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                    Nenhum laboratório encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isCurrent = (t.id === (localStorage.getItem('factory_active_tenant_id') || currentActiveTenantId));
                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid hsl(var(--border))',
                        backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Nome e Avatar */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            backgroundColor: isCurrent ? '#4f46e5' : '#f1f5f9',
                            color: isCurrent ? '#ffffff' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.95rem'
                          }}>
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {t.name}
                              {isCurrent && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  backgroundColor: '#4f46e5',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '10px'
                                }}>
                                  Sessão Ativa
                                </span>
                              )}
                            </div>
                            {t.address && (
                              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <MapPin size={12} /> {t.address} {t.cep ? `- CEP ${t.cep}` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          backgroundColor: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          color: '#475569'
                        }}>
                          {t.slug}
                        </span>
                      </td>

                      {/* CNPJ / Tel */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ color: 'hsl(var(--text-primary))', fontWeight: 600 }}>
                          {t.cnpj || 'Não informado'}
                        </div>
                        {t.telephone && (
                          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                            Tel: {t.telephone}
                          </div>
                        )}
                      </td>

                      {/* Plano */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: t.plan_tier === 'enterprise' ? '#fef3c7' : '#e0e7ff',
                          color: t.plan_tier === 'enterprise' ? '#b45309' : '#4338ca'
                        }}>
                          {t.plan_tier}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}>
                        {t.is_active ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#15803d',
                            backgroundColor: '#dcfce7',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <CheckCircle2 size={13} /> Ativo
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#b91c1c',
                            backgroundColor: '#fee2e2',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <XCircle size={13} /> Inativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setEditingTenant(t)}
                            title="Editar dados cadastrais"
                            style={{
                              border: '1px solid hsl(var(--border))',
                              backgroundColor: 'transparent',
                              color: 'hsl(var(--text-muted))',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600
                            }}
                          >
                            <Edit2 size={13} /> Editar
                          </button>

                          {isCurrent ? (
                            <span style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#4f46e5',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={14} /> Em Uso
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSwitchSession(t)}
                              style={{
                                border: '1px solid #c7d2fe',
                                backgroundColor: '#eef2ff',
                                color: '#4338ca',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700
                              }}
                            >
                              Entrar <ArrowRight size={13} />
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
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, #f8fafc, #f1f5f9)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Plus size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    Provisionar Novo Laboratório Óptico
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    Crie um novo ambiente independente para o laboratório parceiro.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nome Fantasia / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Laboratório Óptico Vision"
                    value={createForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCreateForm(prev => ({
                        ...prev,
                        name,
                        slug: prev.slug === '' || prev.slug === handleSlugify(prev.name) ? handleSlugify(name) : prev.slug
                      }));
                    }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Identificador Único (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: optica-vision"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().trim() }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={createForm.cnpj}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={createForm.telephone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, telephone: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Av. Paulista, 1000, Sala 50"
                    value={createForm.address}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Plano de Assinatura
                  </label>
                  <select
                    value={createForm.plan_tier}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, plan_tier: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="enterprise">Enterprise (Ilimitado + BI + Multi-Filiais)</option>
                    <option value="pro">Pro (Fábrica + Gestão Financeira)</option>
                    <option value="starter">Starter (Controle de Estoque & Grade)</option>
                  </select>
                </div>
              </div>

              {/* Administrador do laboratório */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Shield size={16} style={{ color: '#4f46e5' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                    Administrador Inicial do Laboratório
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Oliveira"
                      value={createForm.admin_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_name: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      E-mail de Acesso
                    </label>
                    <input
                      type="email"
                      placeholder="carlos@laboratorio.com"
                      value={createForm.admin_email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_email: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Senha Provisória
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={createForm.admin_password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, admin_password: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: 'none' }}
                >
                  {saving ? 'Provisionando...' : 'Provisionar Laboratório'}
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
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(to right, #f8fafc, #f1f5f9)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Edit2 size={20} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Editar Laboratório: {editingTenant.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nome Fantasia / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTenant.name}
                    onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={editingTenant.cnpj || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, cnpj: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editingTenant.telephone || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, telephone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Plano de Assinatura
                  </label>
                  <select
                    value={editingTenant.plan_tier}
                    onChange={(e) => setEditingTenant({ ...editingTenant, plan_tier: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="enterprise">Enterprise</option>
                    <option value="pro">Pro</option>
                    <option value="starter">Starter</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={editingTenant.address || ''}
                    onChange={(e) => setEditingTenant({ ...editingTenant, address: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="tenant_active"
                    checked={editingTenant.is_active}
                    onChange={(e) => setEditingTenant({ ...editingTenant, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }}
                  />
                  <label htmlFor="tenant_active" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                    Laboratório Ativo (Permitir acesso de seus operadores e faturamento)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: 'none' }}
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

