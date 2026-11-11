import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getBaseUrl } from '../services/api';
import { Building2, Plus, CheckCircle2, RefreshCw, X, Shield, ExternalLink, ArrowRight, Store } from 'lucide-react';

export default function TenantManagementModal({ isOpen, onClose, currentActiveTenantId, onSelectTenant }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modo de criação de novo laboratório
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    cnpj: '',
    telephone: '',
    plan_tier: 'pro',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTenants();
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const loadTenants = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('factory_token');
      const response = await axios.get(`${getBaseUrl()}/tenants/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTenants(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar lista de laboratórios:', err);
      setError(err.response?.data?.detail || 'Não foi possível carregar a lista de laboratórios.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlugify = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === handleSlugify(prev.name) ? handleSlugify(name) : prev.slug
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      setError('Por favor, preencha o Nome e o Identificador (Slug) do laboratório.');
      return;
    }

    setCreating(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('factory_token');
      await axios.post(`${getBaseUrl()}/tenants/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccessMsg(`Laboratório "${formData.name}" provisionado com sucesso!`);
      setShowCreateForm(false);
      setFormData({
        name: '',
        slug: '',
        cnpj: '',
        telephone: '',
        plan_tier: 'pro',
        admin_name: '',
        admin_email: '',
        admin_password: '',
      });
      await loadTenants();
    } catch (err) {
      console.error('Erro ao criar laboratório:', err);
      setError(err.response?.data?.detail || 'Erro ao provisionar novo laboratório.');
    } finally {
      setCreating(false);
    }
  };

  const handleSwitchTenant = (tenant) => {
    localStorage.setItem('factory_active_tenant_id', tenant.id);
    localStorage.setItem('factory_tenant_name', tenant.name);
    localStorage.setItem('factory_tenant_slug', tenant.slug);
    if (onSelectTenant) {
      onSelectTenant(tenant);
    }
    onClose();
    // Recarrega a página para inicializar os módulos no contexto do novo tenant
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
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
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
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
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Laboratórios & Multi-Tenancy
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca'
                }}>
                  SuperAdmin
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Gerencie os laboratórios ópticos independentes e alterne de sessão com 1 clique.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#15803d',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={18} /> {successMsg}
            </div>
          )}

          {!showCreateForm ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                  Laboratórios Ativos ({tenants.length})
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={loadTenants}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                    }}
                  >
                    <Plus size={16} /> Novo Laboratório
                  </button>
                </div>
              </div>

              {loading && tenants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                  Carregando laboratórios...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tenants.map((t) => {
                    const isCurrent = (t.id === currentActiveTenantId);
                    return (
                      <div
                        key={t.id}
                        style={{
                          border: isCurrent ? '2px solid #6366f1' : '1px solid #e2e8f0',
                          backgroundColor: isCurrent ? '#f5f3ff' : '#ffffff',
                          borderRadius: '12px',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            backgroundColor: isCurrent ? '#e0e7ff' : '#f1f5f9',
                            color: isCurrent ? '#4f46e5' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1rem'
                          }}>
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                                {t.name}
                              </span>
                              {isCurrent && (
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor: '#4f46e5',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}>
                                  Sessão Ativa
                                </span>
                              )}
                              <span style={{
                                fontSize: '0.7rem',
                                color: '#64748b',
                                backgroundColor: '#f1f5f9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                              }}>
                                {t.slug}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px' }}>
                              {t.cnpj && <span>CNPJ: {t.cnpj}</span>}
                              {t.telephone && <span>Tel: {t.telephone}</span>}
                              <span>Plano: <strong style={{ textTransform: 'capitalize' }}>{t.plan_tier}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isCurrent ? (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#4f46e5',
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}>
                              <CheckCircle2 size={16} /> Em Uso
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSwitchTenant(t)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid #c7d2fe',
                                backgroundColor: '#eef2ff',
                                color: '#4338ca',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease'
                              }}
                            >
                              Alternar <ArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Formulário de Criação */
            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Provisionar Novo Laboratório Óptico
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Voltar para Lista
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nome Fantasia / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Laboratório Óptico São Paulo"
                    value={formData.name}
                    onChange={handleNameChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Slug / Identificador de URL *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: optica-sp"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().trim() }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formData.telephone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Administrador Inicial */}
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
                    Usuário Administrador Inicial do Laboratório (Opcional)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Nome do Administrador
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva"
                      value={formData.admin_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      E-mail de Login
                    </label>
                    <input
                      type="email"
                      placeholder="admin@laboratorio.com"
                      value={formData.admin_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Senha Provisória
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.admin_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  {creating ? 'Provisionando...' : 'Salvar e Provisionar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
